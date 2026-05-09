/**
 * 資料庫型別。Phase 1 手寫對應 0001/0002 migration。
 * Phase 4 會改為由 `supabase gen types typescript` 自動產生並 commit。
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'username' | 'display_name'>;
        Update: Partial<ProfileRow>;
      };
      roles: {
        Row: { id: string; name: string; description: string | null; is_system: boolean; created_at: string };
        Insert: { id?: string; name: string; description?: string | null; is_system?: boolean };
        Update: Partial<{ name: string; description: string | null; is_system: boolean }>;
      };
      permissions: {
        Row: { key: string; description: string; category: 'page' | 'action' };
        Insert: { key: string; description: string; category: 'page' | 'action' };
        Update: Partial<{ description: string; category: 'page' | 'action' }>;
      };
      role_permissions: {
        Row: { role_id: string; permission_key: string };
        Insert: { role_id: string; permission_key: string };
        Update: Partial<{ role_id: string; permission_key: string }>;
      };
      user_roles: {
        Row: { user_id: string; role_id: string; granted_at: string; granted_by: string | null };
        Insert: { user_id: string; role_id: string; granted_by?: string | null };
        Update: Partial<{ role_id: string }>;
      };
    };
    Views: {
      v_my_profile: {
        Row: ProfileRow & {
          role_names: string[];
          permission_keys: string[];
        };
      };
    };
    Functions: {
      has_permission: {
        Args: { p_user_id: string; p_key: string };
        Returns: boolean;
      };
      current_user_permissions: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
  };
};

export type ProfileRow = {
  id: string;
  team_id: string;
  username: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  birthday: string | null;
  dominant_hand: 'left' | 'right' | 'both' | null;
  height_cm: number | null;
  weight_kg: number | null;
  favorite_racket: string | null;
  extra_info: Record<string, unknown>;
  must_change_password: boolean;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  created_by: string | null;
};
