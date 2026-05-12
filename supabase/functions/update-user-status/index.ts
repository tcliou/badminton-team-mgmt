// Supabase Edge Function: update-user-status
// 同時更新 Supabase Auth ban_duration 與 profiles.status
// 這是唯一能真正阻止使用者登入的方式（Auth 層封鎖）

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

  // ── 1. 驗證 caller JWT 與 action:users:manage 權限 ────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
  if (authErr || !caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // 確認有 action:users:manage 權限
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

  // ── 2. 解析 body ──────────────────────────────────────────────────────
  let body: { userId: string; status: 'active' | 'suspended' };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { userId, status } = body;
  if (!userId || !['active', 'suspended'].includes(status)) {
    return new Response(
      JSON.stringify({ error: 'userId and status (active|suspended) are required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // 禁止 admin 停用自己
  if (userId === caller.id) {
    return new Response(JSON.stringify({ error: 'Cannot change your own account status' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 3. 用 service_role_key 更新 Auth 層 ban 狀態 ────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { error: banErr } = await adminClient.auth.admin.updateUserById(userId, {
    // 停用：封鎖 100 年（等同永久）；啟用：解除封鎖
    ban_duration: status === 'suspended' ? '876000h' : 'none',
  });

  if (banErr) {
    console.error('auth.admin.updateUserById error:', banErr);
    return new Response(JSON.stringify({ error: banErr.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 4. 同步更新 profiles.status ───────────────────────────────────────
  const { error: profileErr } = await adminClient
    .from('profiles')
    .update({ status })
    .eq('id', userId);

  if (profileErr) {
    console.error('profiles update error:', profileErr);
    // Auth 已更新，profile 失敗不 rollback（下次操作會再修正）
    return new Response(JSON.stringify({ error: profileErr.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ userId, status }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
