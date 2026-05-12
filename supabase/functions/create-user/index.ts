// Supabase Edge Function: create-user
// Deno runtime (v2)
// 
// 呼叫端需為已登入且具有 action:users:manage 權限的 admin。
// 自動注入的環境變數（本機與 hosted 皆同）：
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// 需手動設定的環境變數：
//   SYNTHETIC_EMAIL_DOMAIN  (本機: supabase/functions/.env, hosted: Dashboard → Edge Functions)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** 產生 n 位隨機密碼（英數混合） */
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const emailDomain = Deno.env.get('SYNTHETIC_EMAIL_DOMAIN') ?? 'team.local';

  // ── 1. 驗證 caller 的 JWT，並確認有 action:users:manage 權限 ──────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 用 caller 的 JWT 建立普通 client（拿 profile + 檢查權限）
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // 取得目前登入者資訊
  const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
  if (authErr || !caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 確認有 action:users:manage 權限（透過 role_permissions 查詢）
  const { data: permRows } = await callerClient
    .from('user_roles')
    .select('role_id, roles!inner(role_permissions!inner(permission_key))')
    .eq('user_id', caller.id);

  const hasPermission = (permRows ?? []).some((row: Record<string, unknown>) => {
    const role = row.roles as { role_permissions: { permission_key: string }[] };
    return role?.role_permissions?.some(
      (p: { permission_key: string }) => p.permission_key === 'action:users:manage',
    );
  });

  if (!hasPermission) {
    return new Response(JSON.stringify({ error: 'Forbidden: action:users:manage required' }), {
      status: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 2. 解析 request body ───────────────────────────────────────────────
  let body: { username: string; display_name: string; role_id: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { username, display_name, role_id } = body;
  if (!username?.trim() || !display_name?.trim() || !role_id) {
    return new Response(
      JSON.stringify({ error: 'username, display_name, role_id are required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // username 只允許英數和底線
  if (!/^[a-z0-9_]{2,30}$/.test(username.trim())) {
    return new Response(
      JSON.stringify({ error: 'username must be 2–30 lowercase alphanumeric or underscore characters' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // ── 3. 用 service_role_key 建立管理員 client ───────────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 確認 username 未被使用
  const { data: existing } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: `Username "${username}" is already taken` }), {
      status: 409,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 4. 建立 auth user ─────────────────────────────────────────────────
  const tempPassword = generatePassword(12);
  const syntheticEmail = `${username.trim()}@${emailDomain}`;

  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: syntheticEmail,
    password: tempPassword,
    email_confirm: true,   // 跳過 email 確認
  });

  if (createErr || !newUser.user) {
    console.error('auth.admin.createUser error:', createErr);
    return new Response(
      JSON.stringify({ error: createErr?.message ?? 'Failed to create auth user' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const userId = newUser.user.id;

  // ── 5. 建立 profile ───────────────────────────────────────────────────
  const { error: profileErr } = await adminClient.from('profiles').insert({
    id: userId,
    username: username.trim(),
    display_name: display_name.trim(),
    must_change_password: true,
    created_by: caller.id,
  });

  if (profileErr) {
    // rollback：刪除剛建立的 auth user
    await adminClient.auth.admin.deleteUser(userId);
    console.error('profiles insert error:', profileErr);
    return new Response(JSON.stringify({ error: profileErr.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 6. 指派角色 ───────────────────────────────────────────────────────
  const { error: roleErr } = await adminClient.from('user_roles').insert({
    user_id: userId,
    role_id,
    granted_by: caller.id,
  });

  if (roleErr) {
    console.error('user_roles insert error:', roleErr);
    // 不 rollback（profile 已建立，角色可之後在後台補設）
  }

  // ── 7. 回傳 ──────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      userId,
      username: username.trim(),
      display_name: display_name.trim(),
      tempPassword,   // ← 只有這一次能看到，請 Admin 立即轉交給使用者
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    },
  );
});
