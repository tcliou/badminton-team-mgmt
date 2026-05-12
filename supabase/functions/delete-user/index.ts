// Supabase Edge Function: delete-user
// 完全刪除使用者：auth.admin.deleteUser → CASCADE 刪除 profiles / user_roles /
// leave_requests / training_attendance / payment_records 等關聯資料
// （定義見 0010_phase2_core_tables.sql / 0020_phase3_announcements_finance.sql）

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── 1. 驗證 caller JWT ──────────────────────────────────────────────────
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

  // ── 2. 解析 request body ───────────────────────────────────────────────
  let body: { userId: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { userId } = body;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId is required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 3. 安全檢查：禁止刪除自己 ──────────────────────────────────────────
  if (userId === caller.id) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 4. 執行刪除（auth.admin.deleteUser 會 CASCADE 到 profiles 及所有關聯資料）
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteErr) {
    console.error('auth.admin.deleteUser error:', deleteErr);
    return new Response(JSON.stringify({ error: deleteErr.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, userId }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
