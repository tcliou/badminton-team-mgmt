/**
 * 資料庫型別。Phase 1–2 手寫對應 0001/0002/0010 migration。
 * Phase 4 會改為由 `supabase gen types typescript` 自動產生並 commit。
 *
 * Insert 型別約定：
 *   Insert = Pick<Row, '必填欄位'> & Partial<Row>
 * 這樣可以同時表達「DB 規定必填的欄位」與「DB 有 DEFAULT 或允許 NULL 的可省欄位」。
 *
 * Supabase v2 typed client 嚴格期待 Database 結構完整：每個 table 必須有 Row /
 * Insert / Update / Relationships；schema 必須有 Tables / Views / Functions /
 * Enums / CompositeTypes。任何欄位缺漏都會讓 from('xxx').update(...) 落到
 * never 重載而報 TS2345。
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, 'id' | 'username' | 'display_name'> & Partial<ProfileRow>;
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
      calendar_events: {
        Row: CalendarEventRow;
        Insert: Pick<CalendarEventRow, 'title' | 'starts_at' | 'ends_at'> & Partial<CalendarEventRow>;
        Update: Partial<CalendarEventRow>;
        Relationships: [];
      };
      personal_events: {
        Row: PersonalEventRow;
        Insert: Pick<PersonalEventRow, 'owner_id' | 'title' | 'starts_at' | 'ends_at'> &
          Partial<PersonalEventRow>;
        Update: Partial<PersonalEventRow>;
        Relationships: [];
      };
      training_sessions: {
        Row: TrainingSessionRow;
        Insert: Pick<TrainingSessionRow, 'calendar_event_id'> & Partial<TrainingSessionRow>;
        Update: Partial<TrainingSessionRow>;
        Relationships: [];
      };
      leave_requests: {
        Row: LeaveRequestRow;
        Insert: Pick<LeaveRequestRow, 'player_id' | 'start_at' | 'end_at'> & Partial<LeaveRequestRow>;
        Update: Partial<LeaveRequestRow>;
        Relationships: [];
      };
      attendance_records: {
        Row: AttendanceRow;
        Insert: Pick<AttendanceRow, 'training_id' | 'player_id'> & Partial<AttendanceRow>;
        Update: Partial<AttendanceRow>;
        Relationships: [];
      };
      player_match_records: {
        Row: PlayerMatchRow;
        Insert: Pick<PlayerMatchRow, 'player_id' | 'event_name' | 'event_date'> & Partial<PlayerMatchRow>;
        Update: Partial<PlayerMatchRow>;
        Relationships: [];
      };
      player_experiences: {
        Row: PlayerExperienceRow;
        Insert: Pick<PlayerExperienceRow, 'player_id' | 'start_ym' | 'organization'> &
          Partial<PlayerExperienceRow>;
        Update: Partial<PlayerExperienceRow>;
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

export type CalendarEventType = 'training' | 'match' | 'meeting' | 'other';

export type CalendarEventRow = {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  event_type: CalendarEventType;
  source_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type PersonalEventRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingSessionRow = {
  id: string;
  calendar_event_id: string;
  coach_id: string | null;
  topic: string | null;
  group_tag: string | null;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LeaveReasonType = 'sick' | 'personal' | 'official' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveRequestRow = {
  id: string;
  player_id: string;
  start_at: string;
  end_at: string;
  reason_type: LeaveReasonType;
  reason_text: string | null;
  affected_event_ids: string[];
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceStatus = 'present' | 'absent' | 'on_leave' | 'late';

export type AttendanceRow = {
  id: string;
  training_id: string;
  player_id: string;
  status: AttendanceStatus;
  note: string | null;
  recorded_by: string | null;
  recorded_at: string;
};

export type PlayerMatchRow = {
  id: string;
  player_id: string;
  event_name: string;
  event_date: string;
  category: string;
  division: string | null;
  placement: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type PlayerExperienceRow = {
  id: string;
  player_id: string;
  start_ym: string;
  end_ym: string | null;
  organization: string;
  role: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};
