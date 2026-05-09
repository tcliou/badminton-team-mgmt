import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // 不在 import 時直接 throw，以免 unit test 缺 env 也跑不起來；
  // 改在實際使用時才報錯。
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 未設定，請複製 .env.example 為 .env 並填寫',
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'badminton-team-mgmt.auth',
    },
  },
);

/** 用 username 組成系統內部使用的 synthetic email。 */
export function syntheticEmailFor(username: string): string {
  const domain = import.meta.env.VITE_SYNTHETIC_EMAIL_DOMAIN || 'team.local';
  return `${username.trim().toLowerCase()}@${domain}`;
}
