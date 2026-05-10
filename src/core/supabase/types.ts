/**
 * 資料庫型別。Phase 1 手寫對應 0001/0002 migration。
 * Phase 4 會改為由 `supabase gen types typescript` 自動產生並 commit。
 *
 * 註：Supabase v2 的 typed client 嚴格期待 Database 結構完整：
 *   - 每個 table 必須有 Row / Insert / Update / Relationships
 *   - schema 必須有 Tables / Views / Functions / Enums / CompositeTypes
 * 任何欄位缺漏都會讓 from('xxx').update(...) 落到 never 重載而報 TS2345。
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'username' | 'display_name'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: { id?: string; name: string; description?: string | null; is_system?: boolean };
        Update: Partial<{ name: string; description: string | null; is_system: boolean }>;
        Relationships: [];
      };
      permissions: {
        Row: { key: string; description: string; category: 'page' | 'action' };
        Insert: { key: string; description: string; category: 'page' | 'action' };
        Update: Partial<{ description: string; category: 'page' | 'action' }>;
        Relationships: [];
      };
      role_permissions: {
        Row: { role_id: string; permission_key: string };
        Insert: { role_id: string; permission_key: string };
        Update: Partial<{ role_id: string; permission_key: string }>;
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role_id: string; granted_at: string; granted_by: string | null };
        Insert: { user_id: string; role_id: string; granted_by?: string | null };
        Update: Partial<{ role_id: string }>;
        Relationships: [];
      };
    };
    Views: {
      v_my_profile: {
        Row: ProfileRow & {
          role_names: string[];
          permission_keys: string[];
        };
        Relationships: [];
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
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
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
