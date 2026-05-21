// Supabase Edge Function: reset-user-password
// Deno runtime (v2)
//
// 呼叫端需為已登入且具有 action:users:manage 權限的 admin。
// 輸入：{ userId: string }
// 輸出：{ tempPassword: string }（只回傳一次，Admin 需立即轉交使用者）
//
// 環境變數（自動注入）：
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  // Edge Function 的 CORS 應限制在自家起源；若未知則最多开放到 supabase.co
  'Access-Control-Allow-Origin': Deno.env.get('SUPABASE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** 產生 n 位隨機密碼（英數混合，去除易混淆字元） */
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req: Request) => {
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

  // 1. 用呼叫者的 JWT 建立普通 client，確認身份與權限
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 用 service role key 建立 client，注入 caller JWT header
  // （與 create-user / delete-user 一致的模式；不使用 ANON_KEY，
  //  因為 SUPABASE_ANON_KEY 不被 Edge Function 自動注入）
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // 2. 取得呼叫者 uid
  const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
  if (authErr || !caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 3. 確認呼叫者具有 action:users:manage 權限
  const { data: permRows } = await callerClient
    .from('user_roles')
    .select('role_id, role:roles!inner(role_permissions!inner(permission_key))')
    .eq('user_id', caller.id);

  const hasManage = (permRows as unknown as Array<{ role: { role_permissions: { permission_key: string }[] } }>)
    ?.flatMap((r) => r.role.role_permissions.map((p) => p.permission_key))
    .includes('action:users:manage') ?? false;

  if (!hasManage) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 4. 解析 body
  let userId: string;
  try {
    const body = await req.json() as { userId?: string };
    userId = body.userId ?? '';
    if (!userId) throw new Error('Missing userId');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 6. 防止 admin 重設自己的密碼
  if (userId === caller.id) {
    return new Response(JSON.stringify({ error: 'Cannot reset your own password via admin panel' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 7. 用 Service Role 重設密碼
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const tempPassword = generatePassword(12);

  const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });

  if (updateErr) {
    // 不直接暴露 DB 錯誤細節（information disclosure）
    console.error('auth.admin.updateUserById error:', updateErr.message);
    return new Response(JSON.stringify({ error: 'Failed to reset password. Please try again.' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 6. 標記 must_change_password = true
  await adminClient
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', userId);

  return new Response(
    JSON.stringify({
      tempPassword, // ← 只回傳一次，Admin 需立即轉交使用者
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    },
  );
});
