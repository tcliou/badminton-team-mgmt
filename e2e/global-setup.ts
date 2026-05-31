/**
 * e2e/global-setup.ts
 *
 * Playwright globalSetup — 在所有測試開始前執行一次。
 *
 * 負責透過 Supabase Admin SDK (service_role_key) 確保測試帳號存在：
 *   - admin   / changeme  → admin role,  must_change_password=false
 *   - player1 / changeme  → player role, must_change_password=false
 *
 * 使用 auth.admin.createUser()（GoTrue 狀態完整，Dashboard 可正常管理）
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.SUPABASE_URL             ?? 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const ADMIN_ROLE_ID  = '11111111-1111-1111-1111-111111111111';
const PLAYER_ROLE_ID = '44444444-4444-4444-4444-444444444444';

interface AccountConfig {
  email:       string;
  password:    string;
  username:    string;
  displayName: string;
  roleId:      string;
}

const ACCOUNTS: AccountConfig[] = [
  {
    email:       'admin@team.local',
    password:    process.env.E2E_ADMIN_PASSWORD  ?? 'changeme',
    username:    process.env.E2E_ADMIN_USERNAME  ?? 'admin',
    displayName: '系統管理員',
    roleId:      ADMIN_ROLE_ID,
  },
  {
    email:       'player1@team.local',
    password:    process.env.E2E_PLAYER_PASSWORD ?? 'changeme',
    username:    process.env.E2E_PLAYER_USERNAME ?? 'player1',
    displayName: '測試球員甲',
    roleId:      PLAYER_ROLE_ID,
  },
];

async function ensureAccount(
  supabase: ReturnType<typeof createClient>,
  account: AccountConfig,
) {
  const { email, password, username, displayName, roleId } = account;

  // 1. 確認帳號是否已存在（以 username 查 profiles）
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  let userId: string;

  if (existing) {
    userId = existing.id as string;
    console.log(`[globalSetup] ${email} 已存在 (id=${userId})，更新設定`);

    // 確保 must_change_password=false 且 status=active
    await supabase
      .from('profiles')
      .update({ must_change_password: false, status: 'active' })
      .eq('id', userId);
  } else {
    // 2. 透過 GoTrue Admin API 建立（欄位完整，Dashboard 可管理）
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {},
    });

    if (error || !created.user) {
      throw new Error(`[globalSetup] 建立 ${email} 失敗: ${error?.message}`);
    }

    userId = created.user.id;
    console.log(`[globalSetup] ✅ ${email} auth 帳號建立 (id=${userId})`);

    // 3. 建立 profile
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id:                   userId,
      username,
      display_name:         displayName,
      must_change_password: false,
      status:               'active',
    });
    if (profileErr) throw new Error(`[globalSetup] profiles upsert 失敗: ${profileErr.message}`);
  }

  // 4. 確保角色指派存在
  const { error: roleErr } = await supabase.from('user_roles').upsert(
    { user_id: userId, role_id: roleId, granted_by: userId },
    { onConflict: 'user_id,role_id', ignoreDuplicates: true },
  );
  if (roleErr) throw new Error(`[globalSetup] user_roles upsert 失敗: ${roleErr.message}`);

  console.log(`[globalSetup] ✅ ${email} 設定完成`);
}

export default async function globalSetup() {
  if (!SERVICE_ROLE_KEY) {
    console.warn(
      '[globalSetup] ⚠️  SUPABASE_SERVICE_ROLE_KEY 未設定，跳過帳號建立。\n' +
      '請在 .env.e2e 設定此值（執行 `supabase status` 取得）。',
    );
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const account of ACCOUNTS) {
    await ensureAccount(supabase, account);
  }

  console.log('[globalSetup] ✅ 所有測試帳號準備完成');
}
