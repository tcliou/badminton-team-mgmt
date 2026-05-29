export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          body_md: string
          created_at: string
          id: string
          image_urls: string[]
          is_pinned: boolean
          publish_at: string | null
          status: string
          team_id: string
          title: string
          updated_at: string
          visible_to_role_ids: string[]
        }
        Insert: {
          author_id?: string | null
          body_md?: string
          created_at?: string
          id?: string
          image_urls?: string[]
          is_pinned?: boolean
          publish_at?: string | null
          status?: string
          team_id?: string
          title: string
          updated_at?: string
          visible_to_role_ids?: string[]
        }
        Update: {
          author_id?: string | null
          body_md?: string
          created_at?: string
          id?: string
          image_urls?: string[]
          is_pinned?: boolean
          publish_at?: string | null
          status?: string
          team_id?: string
          title?: string
          updated_at?: string
          visible_to_role_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          id: string
          note: string | null
          player_id: string
          recorded_at: string
          recorded_by: string | null
          status: string
          training_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          player_id: string
          recorded_at?: string
          recorded_by?: string | null
          status?: string
          training_id: string
        }
        Update: {
          id?: string
          note?: string | null
          player_id?: string
          recorded_at?: string
          recorded_by?: string | null
          status?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_ip: unknown
          changed_keys: string[] | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_ip?: unknown
          changed_keys?: string[] | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_ip?: unknown
          changed_keys?: string[] | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          event_type: string
          id: string
          location: string | null
          source_id: string | null
          starts_at: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          event_type?: string
          id?: string
          location?: string | null
          source_id?: string | null
          starts_at: string
          team_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          event_type?: string
          id?: string
          location?: string | null
          source_id?: string | null
          starts_at?: string
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          avatar_url: string | null
          created_at: string
          cv: string | null
          id: string
          is_active: boolean
          name: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cv?: string | null
          id?: string
          is_active?: boolean
          name: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cv?: string | null
          id?: string
          is_active?: boolean
          name?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          team_id: string
          title: string
          updated_at: string
          url: string
          visible_to_role_ids: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          team_id?: string
          title: string
          updated_at?: string
          url: string
          visible_to_role_ids?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          team_id?: string
          title?: string
          updated_at?: string
          url?: string
          visible_to_role_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          advanced_by_user_id: string | null
          amount: number
          category: string | null
          counterparty: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          item: string
          linked_payment_record_id: string | null
          note: string | null
          occurred_on: string
          receipt_url: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          advanced_by_user_id?: string | null
          amount: number
          category?: string | null
          counterparty?: string | null
          created_at?: string
          created_by?: string | null
          direction: string
          id?: string
          item: string
          linked_payment_record_id?: string | null
          note?: string | null
          occurred_on: string
          receipt_url?: string | null
          team_id?: string
          updated_at?: string
        }
        Update: {
          advanced_by_user_id?: string | null
          amount?: number
          category?: string | null
          counterparty?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          item?: string
          linked_payment_record_id?: string | null
          note?: string | null
          occurred_on?: string
          receipt_url?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_advanced_by_user_id_fkey"
            columns: ["advanced_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_advanced_by_user_id_fkey"
            columns: ["advanced_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_linked_payment_record_id_fkey"
            columns: ["linked_payment_record_id"]
            isOneToOne: false
            referencedRelation: "payment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_links: {
        Row: {
          created_at: string
          id: string
          link_type: string
          source_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type?: string
          source_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          source_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_links_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          issue_type: string
          parent_id: string | null
          priority: string
          status: string
          tags: string[]
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          issue_type?: string
          parent_id?: string | null
          priority?: string
          status?: string
          tags?: string[]
          team_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          issue_type?: string
          parent_id?: string | null
          priority?: string
          status?: string
          tags?: string[]
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          affected_event_ids: string[]
          created_at: string
          end_at: string
          id: string
          player_id: string
          reason_text: string | null
          reason_type: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_event_ids?: string[]
          created_at?: string
          end_at: string
          id?: string
          player_id: string
          reason_text?: string | null
          reason_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_event_ids?: string[]
          created_at?: string
          end_at?: string
          id?: string
          player_id?: string
          reason_text?: string | null
          reason_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_items: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          purpose: string | null
          status: string
          target_role_ids: string[]
          target_user_ids: string[]
          team_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          purpose?: string | null
          status?: string
          target_role_ids?: string[]
          target_user_ids?: string[]
          team_id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          purpose?: string | null
          status?: string
          target_role_ids?: string[]
          target_user_ids?: string[]
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          channel: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          item_id: string
          note: string | null
          paid_at: string
          player_id: string
          proof_url: string | null
          status: string
          transfer_last5: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          channel: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          item_id: string
          note?: string | null
          paid_at?: string
          player_id: string
          proof_url?: string | null
          status?: string
          transfer_last5?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          channel?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          item_id?: string
          note?: string | null
          paid_at?: string
          player_id?: string
          proof_url?: string | null
          status?: string
          transfer_last5?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "payment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          description: string
          key: string
        }
        Insert: {
          category: string
          description: string
          key: string
        }
        Update: {
          category?: string
          description?: string
          key?: string
        }
        Relationships: []
      }
      personal_events: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          ends_at: string
          id: string
          owner_id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          owner_id: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          owner_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      player_experiences: {
        Row: {
          created_at: string
          created_by: string | null
          end_ym: string | null
          id: string
          note: string | null
          organization: string
          player_id: string
          role: string | null
          start_ym: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_ym?: string | null
          id?: string
          note?: string | null
          organization: string
          player_id: string
          role?: string | null
          start_ym: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_ym?: string | null
          id?: string
          note?: string | null
          organization?: string
          player_id?: string
          role?: string | null
          start_ym?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_experiences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_experiences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_experiences_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_experiences_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_records: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          division: string | null
          event_date: string
          event_name: string
          id: string
          note: string | null
          placement: string | null
          player_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          division?: string | null
          event_date: string
          event_name: string
          id?: string
          note?: string | null
          placement?: string | null
          player_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          division?: string | null
          event_date?: string
          event_name?: string
          id?: string
          note?: string | null
          placement?: string | null
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_match_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      player_parents: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          player_id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          player_id: string
          relationship?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          player_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_parents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_parents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          created_by: string | null
          display_name: string
          dominant_hand: string | null
          email: string | null
          extra_info: Json
          favorite_racket: string | null
          height_cm: number | null
          id: string
          must_change_password: boolean
          phone: string | null
          status: string
          student_id: string | null
          team_id: string
          updated_at: string
          username: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          created_by?: string | null
          display_name: string
          dominant_hand?: string | null
          email?: string | null
          extra_info?: Json
          favorite_racket?: string | null
          height_cm?: number | null
          id: string
          must_change_password?: boolean
          phone?: string | null
          status?: string
          student_id?: string | null
          team_id?: string
          updated_at?: string
          username: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string
          dominant_hand?: string | null
          email?: string | null
          extra_info?: Json
          favorite_racket?: string | null
          height_cm?: number | null
          id?: string
          must_change_password?: boolean
          phone?: string | null
          status?: string
          student_id?: string | null
          team_id?: string
          updated_at?: string
          username?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_key: string
          role_id: string
        }
        Insert: {
          permission_key: string
          role_id: string
        }
        Update: {
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      team_settings: {
        Row: {
          created_at: string
          nav_hidden: string[]
          nav_order: string[]
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          nav_hidden?: string[]
          nav_order?: string[]
          team_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          nav_hidden?: string[]
          nav_order?: string[]
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_enrollment_forms: {
        Row: {
          created_at: string
          created_by: string | null
          dates: Json
          description: string | null
          generate_sessions: boolean
          id: string
          session_details: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dates?: Json
          description?: string | null
          generate_sessions?: boolean
          id?: string
          session_details?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dates?: Json
          description?: string | null
          generate_sessions?: boolean
          id?: string
          session_details?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollment_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollment_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollment_rows: {
        Row: {
          created_at: string
          daily_info: Json
          daily_status: Json
          date_records: Json
          enrollment_type: string | null
          form_id: string
          id: string
          note: string | null
          player_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_info?: Json
          daily_status?: Json
          date_records?: Json
          enrollment_type?: string | null
          form_id: string
          id?: string
          note?: string | null
          player_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_info?: Json
          daily_status?: Json
          date_records?: Json
          enrollment_type?: string | null
          form_id?: string
          id?: string
          note?: string | null
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollment_rows_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "training_enrollment_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollment_rows_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollment_rows_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          batch_id: string | null
          calendar_event_id: string
          coach_id: string | null
          created_at: string
          group_tag: string | null
          id: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          calendar_event_id: string
          coach_id?: string | null
          created_at?: string
          group_tag?: string | null
          id?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          calendar_event_id?: string
          coach_id?: string | null
          created_at?: string
          group_tag?: string | null
          id?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: true
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_audit_logs: {
        Row: {
          action: string | null
          actor_display_name: string | null
          actor_ip: unknown
          actor_username: string | null
          changed_keys: string[] | null
          created_at: string | null
          id: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
        }
        Relationships: []
      }
      v_my_profile: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          dominant_hand: string | null
          email: string | null
          extra_info: Json | null
          favorite_racket: string | null
          height_cm: number | null
          id: string | null
          must_change_password: boolean | null
          permission_keys: string[] | null
          phone: string | null
          role_names: string[] | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          username: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          dominant_hand?: string | null
          email?: string | null
          extra_info?: Json | null
          favorite_racket?: string | null
          height_cm?: number | null
          id?: string | null
          must_change_password?: boolean | null
          permission_keys?: never
          phone?: string | null
          role_names?: never
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          username?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          dominant_hand?: string | null
          email?: string | null
          extra_info?: Json | null
          favorite_racket?: string | null
          height_cm?: number | null
          id?: string | null
          must_change_password?: boolean | null
          permission_keys?: never
          phone?: string | null
          role_names?: never
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          username?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_payment: {
        Args: { p_note?: string; p_record_id: string }
        Returns: undefined
      }
      current_user_permissions: { Args: never; Returns: string[] }
      has_permission: {
        Args: { p_key: string; p_user_id: string }
        Returns: boolean
      }
      is_parent_of: { Args: { p_player_id: string }; Returns: boolean }
      reject_payment: {
        Args: { p_note: string; p_record_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

