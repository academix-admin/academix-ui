export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements_progress_table: {
        Row: {
          achievements_id: string
          achievements_progress_completed: boolean
          achievements_progress_created_at: string
          achievements_progress_id: string
          achievements_progress_ledger_written: boolean
          achievements_progress_rewarded: boolean
          achievements_progress_updated_at: string | null
          achievements_progress_value: Json
          redeem_code_id: string | null
          users_id: string
        }
        Insert: {
          achievements_id: string
          achievements_progress_completed?: boolean
          achievements_progress_created_at?: string
          achievements_progress_id?: string
          achievements_progress_ledger_written?: boolean
          achievements_progress_rewarded?: boolean
          achievements_progress_updated_at?: string | null
          achievements_progress_value?: Json
          redeem_code_id?: string | null
          users_id: string
        }
        Update: {
          achievements_id?: string
          achievements_progress_completed?: boolean
          achievements_progress_created_at?: string
          achievements_progress_id?: string
          achievements_progress_ledger_written?: boolean
          achievements_progress_rewarded?: boolean
          achievements_progress_updated_at?: string | null
          achievements_progress_value?: Json
          redeem_code_id?: string | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_progress_table_achievements_id_fkey"
            columns: ["achievements_id"]
            isOneToOne: false
            referencedRelation: "achievements_table"
            referencedColumns: ["achievements_id"]
          },
          {
            foreignKeyName: "achievements_progress_table_redeem_code_id_fkey"
            columns: ["redeem_code_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_table"
            referencedColumns: ["redeem_code_id"]
          },
          {
            foreignKeyName: "achievements_progress_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      achievements_table: {
        Row: {
          achievements_created_at: string
          achievements_description: Json
          achievements_id: string
          achievements_image: string | null
          achievements_is_active: boolean
          achievements_requirement: Json
          achievements_title: Json
          achievements_type: string
          country_control: Json | null
          country_control_old: Json | null
          language_control: Json | null
          language_control_old: Json | null
          reward_id: string
          sort_created_id: number
        }
        Insert: {
          achievements_created_at?: string
          achievements_description: Json
          achievements_id?: string
          achievements_image?: string | null
          achievements_is_active?: boolean
          achievements_requirement: Json
          achievements_title: Json
          achievements_type: string
          country_control?: Json | null
          country_control_old?: Json | null
          language_control?: Json | null
          language_control_old?: Json | null
          reward_id: string
          sort_created_id: number
        }
        Update: {
          achievements_created_at?: string
          achievements_description?: Json
          achievements_id?: string
          achievements_image?: string | null
          achievements_is_active?: boolean
          achievements_requirement?: Json
          achievements_title?: Json
          achievements_type?: string
          country_control?: Json | null
          country_control_old?: Json | null
          language_control?: Json | null
          language_control_old?: Json | null
          reward_id?: string
          sort_created_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_table_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_table"
            referencedColumns: ["reward_id"]
          },
        ]
      }
      age_table: {
        Row: {
          age_created_at: string
          age_id: number
          age_identity: Json
          age_visible: boolean
        }
        Insert: {
          age_created_at?: string
          age_id: number
          age_identity: Json
          age_visible?: boolean
        }
        Update: {
          age_created_at?: string
          age_id?: number
          age_identity?: Json
          age_visible?: boolean
        }
        Relationships: []
      }
      category_group_table: {
        Row: {
          age_control: Json
          approval_status: Json
          category_group_created_at: string
          category_group_created_by: Json
          category_group_id: string
          category_group_identity: Json
          category_group_reviewed_by: Json
          category_group_updated_at: string
          category_group_visible: boolean
          country_control: Json
          gender_control: Json
          language_control: Json
          sort_created_id: string
          sort_updated_id: string
        }
        Insert: {
          age_control: Json
          approval_status?: Json
          category_group_created_at?: string
          category_group_created_by?: Json
          category_group_id?: string
          category_group_identity: Json
          category_group_reviewed_by?: Json
          category_group_updated_at?: string
          category_group_visible?: boolean
          country_control: Json
          gender_control: Json
          language_control: Json
          sort_created_id?: string
          sort_updated_id?: string
        }
        Update: {
          age_control?: Json
          approval_status?: Json
          category_group_created_at?: string
          category_group_created_by?: Json
          category_group_id?: string
          category_group_identity?: Json
          category_group_reviewed_by?: Json
          category_group_updated_at?: string
          category_group_visible?: boolean
          country_control?: Json
          gender_control?: Json
          language_control?: Json
          sort_created_id?: string
          sort_updated_id?: string
        }
        Relationships: []
      }
      challenge_table: {
        Row: {
          challenge_bot_share: number
          challenge_created_at: string
          challenge_creator_share: number
          challenge_development_charge: number
          challenge_extended_time: number
          challenge_id: string
          challenge_identity: Json
          challenge_max_participants: number
          challenge_mid_share: number
          challenge_min_participants: number
          challenge_overhead_time: number
          challenge_points: number
          challenge_price: number
          challenge_question_count: number
          challenge_rank: number
          challenge_reviewer_share: number
          challenge_role_share: Json
          challenge_starting_time: number
          challenge_top_share: number
          challenge_visible: boolean
          challenge_waiting_time: number
          game_mode_id: string
          users_id: string | null
        }
        Insert: {
          challenge_bot_share: number
          challenge_created_at?: string
          challenge_creator_share?: number
          challenge_development_charge?: number
          challenge_extended_time?: number
          challenge_id?: string
          challenge_identity: Json
          challenge_max_participants?: number
          challenge_mid_share: number
          challenge_min_participants: number
          challenge_overhead_time?: number
          challenge_points: number
          challenge_price: number
          challenge_question_count: number
          challenge_rank: number
          challenge_reviewer_share?: number
          challenge_role_share?: Json
          challenge_starting_time?: number
          challenge_top_share: number
          challenge_visible?: boolean
          challenge_waiting_time?: number
          game_mode_id: string
          users_id?: string | null
        }
        Update: {
          challenge_bot_share?: number
          challenge_created_at?: string
          challenge_creator_share?: number
          challenge_development_charge?: number
          challenge_extended_time?: number
          challenge_id?: string
          challenge_identity?: Json
          challenge_max_participants?: number
          challenge_mid_share?: number
          challenge_min_participants?: number
          challenge_overhead_time?: number
          challenge_points?: number
          challenge_price?: number
          challenge_question_count?: number
          challenge_rank?: number
          challenge_reviewer_share?: number
          challenge_role_share?: Json
          challenge_starting_time?: number
          challenge_top_share?: number
          challenge_visible?: boolean
          challenge_waiting_time?: number
          game_mode_id?: string
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_table_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_mode_table"
            referencedColumns: ["game_mode_id"]
          },
          {
            foreignKeyName: "challenge_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      country_table: {
        Row: {
          country_created_at: string | null
          country_id: string
          country_identity: Json
          country_image: string | null
          country_phone_code: string
          country_phone_digit: number
          country_three_iso_code: string
          country_two_iso_code: string
          country_visible: boolean
        }
        Insert: {
          country_created_at?: string | null
          country_id?: string
          country_identity: Json
          country_image?: string | null
          country_phone_code: string
          country_phone_digit: number
          country_three_iso_code: string
          country_two_iso_code: string
          country_visible?: boolean
        }
        Update: {
          country_created_at?: string | null
          country_id?: string
          country_identity?: Json
          country_image?: string | null
          country_phone_code?: string
          country_phone_digit?: number
          country_three_iso_code?: string
          country_two_iso_code?: string
          country_visible?: boolean
        }
        Relationships: []
      }
      daily_streaks_table: {
        Row: {
          daily_streaks_awarded: number
          daily_streaks_count: number
          daily_streaks_created_at: string
          daily_streaks_id: string
          daily_streaks_ledger_written: boolean
          daily_streaks_reached: boolean
          daily_streaks_rewarded: boolean
          redeem_code_id: string | null
          streak_date: string
          users_id: string
        }
        Insert: {
          daily_streaks_awarded?: number
          daily_streaks_count: number
          daily_streaks_created_at?: string
          daily_streaks_id?: string
          daily_streaks_ledger_written?: boolean
          daily_streaks_reached?: boolean
          daily_streaks_rewarded?: boolean
          redeem_code_id?: string | null
          streak_date?: string
          users_id: string
        }
        Update: {
          daily_streaks_awarded?: number
          daily_streaks_count?: number
          daily_streaks_created_at?: string
          daily_streaks_id?: string
          daily_streaks_ledger_written?: boolean
          daily_streaks_reached?: boolean
          daily_streaks_rewarded?: boolean
          redeem_code_id?: string | null
          streak_date?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_streaks_table_2_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
          {
            foreignKeyName: "daily_streaks_table_redeem_code_id_fkey"
            columns: ["redeem_code_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_table"
            referencedColumns: ["redeem_code_id"]
          },
        ]
      }
      engagement_levels_table: {
        Row: {
          engagement_levels_badge_url: string | null
          engagement_levels_created_at: string | null
          engagement_levels_id: number
          engagement_levels_identity: Json
          engagement_levels_max_points: number
          engagement_levels_updated_at: string | null
        }
        Insert: {
          engagement_levels_badge_url?: string | null
          engagement_levels_created_at?: string | null
          engagement_levels_id?: number
          engagement_levels_identity: Json
          engagement_levels_max_points: number
          engagement_levels_updated_at?: string | null
        }
        Update: {
          engagement_levels_badge_url?: string | null
          engagement_levels_created_at?: string | null
          engagement_levels_id?: number
          engagement_levels_identity?: Json
          engagement_levels_max_points?: number
          engagement_levels_updated_at?: string | null
        }
        Relationships: []
      }
      features_table: {
        Row: {
          age_control: Json
          country_control: Json
          features_active: boolean
          features_checker: string
          features_created_at: string
          features_id: string
          features_identity: Json
          gender_control: Json
          language_control: Json
          state_control: Json | null
        }
        Insert: {
          age_control: Json
          country_control: Json
          features_active?: boolean
          features_checker: string
          features_created_at?: string
          features_id?: string
          features_identity: Json
          gender_control: Json
          language_control: Json
          state_control?: Json | null
        }
        Update: {
          age_control?: Json
          country_control?: Json
          features_active?: boolean
          features_checker?: string
          features_created_at?: string
          features_id?: string
          features_identity?: Json
          gender_control?: Json
          language_control?: Json
          state_control?: Json | null
        }
        Relationships: []
      }
      fraud_logs: {
        Row: {
          action: string
          allowed: boolean
          created_at: string
          device_fingerprint: string
          id: string
          ip_address: string
          metadata: Json | null
          pool_id: string | null
          reasons: string[] | null
          risk_score: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          allowed?: boolean
          created_at?: string
          device_fingerprint: string
          id?: string
          ip_address: string
          metadata?: Json | null
          pool_id?: string | null
          reasons?: string[] | null
          risk_score?: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          allowed?: boolean
          created_at?: string
          device_fingerprint?: string
          id?: string
          ip_address?: string
          metadata?: Json | null
          pool_id?: string | null
          reasons?: string[] | null
          risk_score?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_logs_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools_table"
            referencedColumns: ["pools_id"]
          },
          {
            foreignKeyName: "fraud_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      game_mode_table: {
        Row: {
          game_mode_checker: string | null
          game_mode_created_at: string
          game_mode_id: string
          game_mode_identity: Json | null
        }
        Insert: {
          game_mode_checker?: string | null
          game_mode_created_at?: string
          game_mode_id?: string
          game_mode_identity?: Json | null
        }
        Update: {
          game_mode_checker?: string | null
          game_mode_created_at?: string
          game_mode_id?: string
          game_mode_identity?: Json | null
        }
        Relationships: []
      }
      gender_table: {
        Row: {
          gender_created_at: string
          gender_id: string
          gender_identity: Json
          gender_visible: boolean
        }
        Insert: {
          gender_created_at?: string
          gender_id: string
          gender_identity: Json
          gender_visible?: boolean
        }
        Update: {
          gender_created_at?: string
          gender_id?: string
          gender_identity?: Json
          gender_visible?: boolean
        }
        Relationships: []
      }
      geo_blocklist: {
        Row: {
          active: boolean
          added_by: string | null
          block_type: string
          cidr_range: unknown
          country_code: string | null
          created_at: string
          expires_at: string | null
          feature: string | null
          id: string
          reason: string | null
          state_code: string | null
        }
        Insert: {
          active?: boolean
          added_by?: string | null
          block_type: string
          cidr_range?: unknown
          country_code?: string | null
          created_at?: string
          expires_at?: string | null
          feature?: string | null
          id?: string
          reason?: string | null
          state_code?: string | null
        }
        Update: {
          active?: boolean
          added_by?: string | null
          block_type?: string
          cidr_range?: unknown
          country_code?: string | null
          created_at?: string
          expires_at?: string | null
          feature?: string | null
          id?: string
          reason?: string | null
          state_code?: string | null
        }
        Relationships: []
      }
      giveback_table: {
        Row: {
          age_control: Json
          country_control: Json
          gender_control: Json
          giveback_code: string
          giveback_created_at: string
          giveback_id: string
          giveback_identifier: string | null
          giveback_password: string | null
          giveback_total_amount: number | null
          giveback_total_usage: number
          giveback_unit_amount: number
          language_control: Json
          redeem_code_rule_id: string | null
          sort_created_id: string
        }
        Insert: {
          age_control?: Json
          country_control?: Json
          gender_control?: Json
          giveback_code: string
          giveback_created_at?: string
          giveback_id?: string
          giveback_identifier?: string | null
          giveback_password?: string | null
          giveback_total_amount?: number | null
          giveback_total_usage: number
          giveback_unit_amount: number
          language_control?: Json
          redeem_code_rule_id?: string | null
          sort_created_id?: string
        }
        Update: {
          age_control?: Json
          country_control?: Json
          gender_control?: Json
          giveback_code?: string
          giveback_created_at?: string
          giveback_id?: string
          giveback_identifier?: string | null
          giveback_password?: string | null
          giveback_total_amount?: number | null
          giveback_total_usage?: number
          giveback_unit_amount?: number
          language_control?: Json
          redeem_code_rule_id?: string | null
          sort_created_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveback_redeem_code_rule_fkey"
            columns: ["redeem_code_rule_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_rule_table"
            referencedColumns: ["redeem_code_rule_id"]
          },
        ]
      }
      ip_geo_cache: {
        Row: {
          country_code: string | null
          ip: unknown
          request_id: number | null
          requested_at: string
          resolved_at: string | null
          state_code: string | null
          status: string
        }
        Insert: {
          country_code?: string | null
          ip: unknown
          request_id?: number | null
          requested_at?: string
          resolved_at?: string | null
          state_code?: string | null
          status?: string
        }
        Update: {
          country_code?: string | null
          ip?: unknown
          request_id?: number | null
          requested_at?: string
          resolved_at?: string | null
          state_code?: string | null
          status?: string
        }
        Relationships: []
      }
      language_table: {
        Row: {
          age_control: Json
          age_control_old: Json
          gender_control: Json
          gender_control_old: Json
          language_code: string
          language_created_at: string
          language_id: string
          language_identity: Json
          language_visible: boolean
        }
        Insert: {
          age_control: Json
          age_control_old: Json
          gender_control: Json
          gender_control_old: Json
          language_code: string
          language_created_at?: string
          language_id?: string
          language_identity: Json
          language_visible?: boolean
        }
        Update: {
          age_control?: Json
          age_control_old?: Json
          gender_control?: Json
          gender_control_old?: Json
          language_code?: string
          language_created_at?: string
          language_id?: string
          language_identity?: Json
          language_visible?: boolean
        }
        Relationships: []
      }
      media_operation_table: {
        Row: {
          media_operation_created_at: string
          media_operation_id: string
          media_operation_path: string | null
          media_operation_type: string
          users_id: string
        }
        Insert: {
          media_operation_created_at?: string
          media_operation_id?: string
          media_operation_path?: string | null
          media_operation_type: string
          users_id?: string
        }
        Update: {
          media_operation_created_at?: string
          media_operation_id?: string
          media_operation_path?: string | null
          media_operation_type?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_operation_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      mission_progress_table: {
        Row: {
          mission_id: string
          mission_progress_completed: boolean
          mission_progress_created_at: string
          mission_progress_id: string
          mission_progress_ledger_written: boolean
          mission_progress_rewarded: boolean
          mission_progress_updated_at: string | null
          mission_progress_value: Json
          redeem_code_id: string | null
          users_id: string
        }
        Insert: {
          mission_id: string
          mission_progress_completed?: boolean
          mission_progress_created_at?: string
          mission_progress_id?: string
          mission_progress_ledger_written?: boolean
          mission_progress_rewarded?: boolean
          mission_progress_updated_at?: string | null
          mission_progress_value?: Json
          redeem_code_id?: string | null
          users_id: string
        }
        Update: {
          mission_id?: string
          mission_progress_completed?: boolean
          mission_progress_created_at?: string
          mission_progress_id?: string
          mission_progress_ledger_written?: boolean
          mission_progress_rewarded?: boolean
          mission_progress_updated_at?: string | null
          mission_progress_value?: Json
          redeem_code_id?: string | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_progress_table_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_table"
            referencedColumns: ["mission_id"]
          },
          {
            foreignKeyName: "mission_progress_table_redeem_code_id_fkey"
            columns: ["redeem_code_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_table"
            referencedColumns: ["redeem_code_id"]
          },
          {
            foreignKeyName: "mission_progress_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      mission_table: {
        Row: {
          country_control: Json
          country_control_old: Json | null
          language_control: Json
          language_control_old: Json | null
          mission_created_at: string
          mission_description: Json
          mission_id: string
          mission_image: string | null
          mission_is_active: boolean
          mission_requirement: Json
          mission_title: Json
          mission_type: string
          reward_id: string
          sort_created_id: number
        }
        Insert: {
          country_control: Json
          country_control_old?: Json | null
          language_control: Json
          language_control_old?: Json | null
          mission_created_at?: string
          mission_description: Json
          mission_id?: string
          mission_image?: string | null
          mission_is_active?: boolean
          mission_requirement: Json
          mission_title: Json
          mission_type: string
          reward_id: string
          sort_created_id: number
        }
        Update: {
          country_control?: Json
          country_control_old?: Json | null
          language_control?: Json
          language_control_old?: Json | null
          mission_created_at?: string
          mission_description?: Json
          mission_id?: string
          mission_image?: string | null
          mission_is_active?: boolean
          mission_requirement?: Json
          mission_title?: Json
          mission_type?: string
          reward_id?: string
          sort_created_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_table_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_table"
            referencedColumns: ["reward_id"]
          },
        ]
      }
      newsletter_table: {
        Row: {
          newsletter_created_at: string
          newsletter_email: string
          newsletter_id: string
        }
        Insert: {
          newsletter_created_at?: string
          newsletter_email: string
          newsletter_id?: string
        }
        Update: {
          newsletter_created_at?: string
          newsletter_email?: string
          newsletter_id?: string
        }
        Relationships: []
      }
      option_tracker_table: {
        Row: {
          option_tracker_created_at: string
          option_tracker_id: string
          option_tracker_identity: string | null
          options_id: string
          question_tracker_id: string
        }
        Insert: {
          option_tracker_created_at?: string
          option_tracker_id?: string
          option_tracker_identity?: string | null
          options_id: string
          question_tracker_id: string
        }
        Update: {
          option_tracker_created_at?: string
          option_tracker_id?: string
          option_tracker_identity?: string | null
          options_id?: string
          question_tracker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_tracker_table_options_id_fkey"
            columns: ["options_id"]
            isOneToOne: false
            referencedRelation: "options_table"
            referencedColumns: ["options_id"]
          },
          {
            foreignKeyName: "option_tracker_table_question_tracker_id_fkey"
            columns: ["question_tracker_id"]
            isOneToOne: false
            referencedRelation: "question_tracker_table"
            referencedColumns: ["question_tracker_id"]
          },
        ]
      }
      options_table: {
        Row: {
          options_created_at: string
          options_id: string
          options_identity: Json
          options_image: string | null
          options_is_correct: boolean
          options_max: number | null
          options_min: number | null
          options_unit: string | null
          questions_id: string
        }
        Insert: {
          options_created_at?: string
          options_id?: string
          options_identity: Json
          options_image?: string | null
          options_is_correct?: boolean
          options_max?: number | null
          options_min?: number | null
          options_unit?: string | null
          questions_id: string
        }
        Update: {
          options_created_at?: string
          options_id?: string
          options_identity?: Json
          options_image?: string | null
          options_is_correct?: boolean
          options_max?: number | null
          options_min?: number | null
          options_unit?: string | null
          questions_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_table_questions_id_fkey"
            columns: ["questions_id"]
            isOneToOne: false
            referencedRelation: "questions_table"
            referencedColumns: ["questions_id"]
          },
        ]
      }
      payment_details_table: {
        Row: {
          account_number: string | null
          bank_code: string | null
          bank_name: string | null
          country: string | null
          direct_debit: boolean | null
          e_naira: boolean | null
          email: string
          fullname: string
          network: string | null
          opay: boolean | null
          payment_details_id: string
          phone: string
          private_account: boolean | null
        }
        Insert: {
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          country?: string | null
          direct_debit?: boolean | null
          e_naira?: boolean | null
          email?: string
          fullname?: string
          network?: string | null
          opay?: boolean | null
          payment_details_id?: string
          phone: string
          private_account?: boolean | null
        }
        Update: {
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          country?: string | null
          direct_debit?: boolean | null
          e_naira?: boolean | null
          email?: string
          fullname?: string
          network?: string | null
          opay?: boolean | null
          payment_details_id?: string
          phone?: string
          private_account?: boolean | null
        }
        Relationships: []
      }
      payment_method_table: {
        Row: {
          age_control: Json
          payment_method_buy_active: boolean
          payment_method_buy_limit: number | null
          payment_method_buy_multiple: boolean
          payment_method_checker: string
          payment_method_created_at: string
          payment_method_id: string
          payment_method_identity: Json
          payment_method_image: string | null
          payment_method_network: Json[]
          payment_method_sell_active: boolean
          payment_method_sell_limit: number | null
          payment_method_sell_multiple: boolean
          payment_method_time_out: number
          payment_wallet_id: string
          sort_created_id: string
        }
        Insert: {
          age_control?: Json
          payment_method_buy_active?: boolean
          payment_method_buy_limit?: number | null
          payment_method_buy_multiple?: boolean
          payment_method_checker: string
          payment_method_created_at?: string
          payment_method_id?: string
          payment_method_identity: Json
          payment_method_image?: string | null
          payment_method_network?: Json[]
          payment_method_sell_active?: boolean
          payment_method_sell_limit?: number | null
          payment_method_sell_multiple?: boolean
          payment_method_time_out?: number
          payment_wallet_id: string
          sort_created_id?: string
        }
        Update: {
          age_control?: Json
          payment_method_buy_active?: boolean
          payment_method_buy_limit?: number | null
          payment_method_buy_multiple?: boolean
          payment_method_checker?: string
          payment_method_created_at?: string
          payment_method_id?: string
          payment_method_identity?: Json
          payment_method_image?: string | null
          payment_method_network?: Json[]
          payment_method_sell_active?: boolean
          payment_method_sell_limit?: number | null
          payment_method_sell_multiple?: boolean
          payment_method_time_out?: number
          payment_wallet_id?: string
          sort_created_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_table_payment_wallet_id_fkey"
            columns: ["payment_wallet_id"]
            isOneToOne: false
            referencedRelation: "payment_wallet_table"
            referencedColumns: ["payment_wallet_id"]
          },
        ]
      }
      payment_profile_table: {
        Row: {
          payment_details_id: string | null
          payment_method_id: string
          payment_profile_buy_active: boolean
          payment_profile_created_at: string
          payment_profile_id: string
          payment_profile_receiver: boolean
          payment_profile_sell_active: boolean
          sort_created_id: string
          users_id: string | null
        }
        Insert: {
          payment_details_id?: string | null
          payment_method_id: string
          payment_profile_buy_active?: boolean
          payment_profile_created_at?: string
          payment_profile_id?: string
          payment_profile_receiver?: boolean
          payment_profile_sell_active?: boolean
          sort_created_id?: string
          users_id?: string | null
        }
        Update: {
          payment_details_id?: string | null
          payment_method_id?: string
          payment_profile_buy_active?: boolean
          payment_profile_created_at?: string
          payment_profile_id?: string
          payment_profile_receiver?: boolean
          payment_profile_sell_active?: boolean
          sort_created_id?: string
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_profile_table_payment_details_id_fkey"
            columns: ["payment_details_id"]
            isOneToOne: false
            referencedRelation: "payment_details_table"
            referencedColumns: ["payment_details_id"]
          },
          {
            foreignKeyName: "payment_profile_table_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_method_table"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "payment_profile_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      payment_wallet_table: {
        Row: {
          country_id: string | null
          payment_wallet_buy_active: boolean
          payment_wallet_buy_fee: number
          payment_wallet_buy_fee_flat: number
          payment_wallet_buy_max: number
          payment_wallet_buy_min: number
          payment_wallet_buy_rate: number
          payment_wallet_buy_rate_type: string
          payment_wallet_created_at: string
          payment_wallet_currency: string
          payment_wallet_id: string
          payment_wallet_identity: string
          payment_wallet_image: string | null
          payment_wallet_sell_active: boolean
          payment_wallet_sell_fee: number
          payment_wallet_sell_fee_flat: number
          payment_wallet_sell_max: number
          payment_wallet_sell_min: number
          payment_wallet_sell_rate: number
          payment_wallet_sell_rate_type: string
          payment_wallet_updated_at: string | null
          sort_created_id: string
          wallet_settlement_hours: number
        }
        Insert: {
          country_id?: string | null
          payment_wallet_buy_active?: boolean
          payment_wallet_buy_fee?: number
          payment_wallet_buy_fee_flat?: number
          payment_wallet_buy_max: number
          payment_wallet_buy_min: number
          payment_wallet_buy_rate: number
          payment_wallet_buy_rate_type?: string
          payment_wallet_created_at?: string
          payment_wallet_currency: string
          payment_wallet_id?: string
          payment_wallet_identity: string
          payment_wallet_image?: string | null
          payment_wallet_sell_active?: boolean
          payment_wallet_sell_fee?: number
          payment_wallet_sell_fee_flat?: number
          payment_wallet_sell_max: number
          payment_wallet_sell_min: number
          payment_wallet_sell_rate: number
          payment_wallet_sell_rate_type?: string
          payment_wallet_updated_at?: string | null
          sort_created_id?: string
          wallet_settlement_hours?: number
        }
        Update: {
          country_id?: string | null
          payment_wallet_buy_active?: boolean
          payment_wallet_buy_fee?: number
          payment_wallet_buy_fee_flat?: number
          payment_wallet_buy_max?: number
          payment_wallet_buy_min?: number
          payment_wallet_buy_rate?: number
          payment_wallet_buy_rate_type?: string
          payment_wallet_created_at?: string
          payment_wallet_currency?: string
          payment_wallet_id?: string
          payment_wallet_identity?: string
          payment_wallet_image?: string | null
          payment_wallet_sell_active?: boolean
          payment_wallet_sell_fee?: number
          payment_wallet_sell_fee_flat?: number
          payment_wallet_sell_max?: number
          payment_wallet_sell_min?: number
          payment_wallet_sell_rate?: number
          payment_wallet_sell_rate_type?: string
          payment_wallet_updated_at?: string | null
          sort_created_id?: string
          wallet_settlement_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_wallet_table_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country_table"
            referencedColumns: ["country_id"]
          },
        ]
      }
      personalized_table: {
        Row: {
          personalized_created_at: string
          personalized_id: string
          topics_id: string | null
          users_id: string
        }
        Insert: {
          personalized_created_at?: string
          personalized_id?: string
          topics_id?: string | null
          users_id: string
        }
        Update: {
          personalized_created_at?: string
          personalized_id?: string
          topics_id?: string | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personalized_table_topics_id_fkey"
            columns: ["topics_id"]
            isOneToOne: false
            referencedRelation: "topics_table"
            referencedColumns: ["topics_id"]
          },
          {
            foreignKeyName: "personalized_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      platform_config_table: {
        Row: {
          config_key: string
          config_note: string | null
          config_value: string
        }
        Insert: {
          config_key: string
          config_note?: string | null
          config_value: string
        }
        Update: {
          config_key?: string
          config_note?: string | null
          config_value?: string
        }
        Relationships: []
      }
      pools_members_table: {
        Row: {
          pools_completed_question_tracker_size: number
          pools_completed_question_tracker_time: number
          pools_id: string
          pools_members_category: string
          pools_members_created_at: string
          pools_members_id: string
          pools_members_paid_amount: number | null
          pools_members_points: number
          pools_members_price: number
          pools_members_rank: number
          redeemable_id: string | null
          sort_created_id: string
          transaction_id: string | null
          users_id: string
        }
        Insert: {
          pools_completed_question_tracker_size?: number
          pools_completed_question_tracker_time?: number
          pools_id: string
          pools_members_category?: string
          pools_members_created_at?: string
          pools_members_id?: string
          pools_members_paid_amount?: number | null
          pools_members_points?: number
          pools_members_price?: number
          pools_members_rank?: number
          redeemable_id?: string | null
          sort_created_id?: string
          transaction_id?: string | null
          users_id: string
        }
        Update: {
          pools_completed_question_tracker_size?: number
          pools_completed_question_tracker_time?: number
          pools_id?: string
          pools_members_category?: string
          pools_members_created_at?: string
          pools_members_id?: string
          pools_members_paid_amount?: number | null
          pools_members_points?: number
          pools_members_price?: number
          pools_members_rank?: number
          redeemable_id?: string | null
          sort_created_id?: string
          transaction_id?: string | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_members_table_pools_id_fkey"
            columns: ["pools_id"]
            isOneToOne: false
            referencedRelation: "pools_table"
            referencedColumns: ["pools_id"]
          },
          {
            foreignKeyName: "pools_members_table_redeemable_id_fkey"
            columns: ["redeemable_id"]
            isOneToOne: true
            referencedRelation: "redeemable_table"
            referencedColumns: ["redeemable_id"]
          },
          {
            foreignKeyName: "pools_members_table_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transaction_table"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "pools_members_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      pools_question_table: {
        Row: {
          pools_id: string
          pools_question_created_at: string
          pools_question_id: string
          questions_id: string
          users_id: string
        }
        Insert: {
          pools_id: string
          pools_question_created_at?: string
          pools_question_id?: string
          questions_id: string
          users_id: string
        }
        Update: {
          pools_id?: string
          pools_question_created_at?: string
          pools_question_id?: string
          questions_id?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_question_table_pools_id_fkey"
            columns: ["pools_id"]
            isOneToOne: false
            referencedRelation: "pools_table"
            referencedColumns: ["pools_id"]
          },
          {
            foreignKeyName: "pools_question_table_questions_id_fkey"
            columns: ["questions_id"]
            isOneToOne: false
            referencedRelation: "questions_table"
            referencedColumns: ["questions_id"]
          },
          {
            foreignKeyName: "pools_question_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      pools_table: {
        Row: {
          challenge_id: string
          pools_allow_submission: boolean
          pools_auth: string
          pools_code: string
          pools_completed_at: string | null
          pools_contributors_paid: number | null
          pools_created_at: string
          pools_dev_charge: number | null
          pools_duration: number | null
          pools_gamified_at: string | null
          pools_graded_at: string | null
          pools_id: string
          pools_job: string | null
          pools_job_end_at: string | null
          pools_ledger_written_at: string | null
          pools_locale: string
          pools_members_paid: number | null
          pools_paid_at: string | null
          pools_password: string | null
          pools_platform_kept: number | null
          pools_ranked_at: string | null
          pools_rewarded_at: string | null
          pools_starting_at: string | null
          pools_status: string
          pools_total_amount: number | null
          pools_visible: boolean
          sort_created_id: string
          sort_updated_id: string
          topics_id: string
        }
        Insert: {
          challenge_id: string
          pools_allow_submission?: boolean
          pools_auth?: string
          pools_code?: string
          pools_completed_at?: string | null
          pools_contributors_paid?: number | null
          pools_created_at?: string
          pools_dev_charge?: number | null
          pools_duration?: number | null
          pools_gamified_at?: string | null
          pools_graded_at?: string | null
          pools_id?: string
          pools_job?: string | null
          pools_job_end_at?: string | null
          pools_ledger_written_at?: string | null
          pools_locale?: string
          pools_members_paid?: number | null
          pools_paid_at?: string | null
          pools_password?: string | null
          pools_platform_kept?: number | null
          pools_ranked_at?: string | null
          pools_rewarded_at?: string | null
          pools_starting_at?: string | null
          pools_status?: string
          pools_total_amount?: number | null
          pools_visible?: boolean
          sort_created_id?: string
          sort_updated_id?: string
          topics_id: string
        }
        Update: {
          challenge_id?: string
          pools_allow_submission?: boolean
          pools_auth?: string
          pools_code?: string
          pools_completed_at?: string | null
          pools_contributors_paid?: number | null
          pools_created_at?: string
          pools_dev_charge?: number | null
          pools_duration?: number | null
          pools_gamified_at?: string | null
          pools_graded_at?: string | null
          pools_id?: string
          pools_job?: string | null
          pools_job_end_at?: string | null
          pools_ledger_written_at?: string | null
          pools_locale?: string
          pools_members_paid?: number | null
          pools_paid_at?: string | null
          pools_password?: string | null
          pools_platform_kept?: number | null
          pools_ranked_at?: string | null
          pools_rewarded_at?: string | null
          pools_starting_at?: string | null
          pools_status?: string
          pools_total_amount?: number | null
          pools_visible?: boolean
          sort_created_id?: string
          sort_updated_id?: string
          topics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_table_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_table"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "pools_table_topics_id_fkey"
            columns: ["topics_id"]
            isOneToOne: false
            referencedRelation: "topics_table"
            referencedColumns: ["topics_id"]
          },
        ]
      }
      question_time_table: {
        Row: {
          question_time_created_at: string
          question_time_id: string
          question_time_value: number
        }
        Insert: {
          question_time_created_at?: string
          question_time_id?: string
          question_time_value: number
        }
        Update: {
          question_time_created_at?: string
          question_time_id?: string
          question_time_value?: number
        }
        Relationships: []
      }
      question_tracker_table: {
        Row: {
          pools_question_id: string
          question_tracker_created_at: string
          question_tracker_id: string
          question_tracker_question_status: string
          question_tracker_time_taken: number
          question_tracker_updated_at: string
          sort_created_id: string | null
          sort_updated_id: string | null
          users_id: string
        }
        Insert: {
          pools_question_id: string
          question_tracker_created_at?: string
          question_tracker_id?: string
          question_tracker_question_status?: string
          question_tracker_time_taken: number
          question_tracker_updated_at?: string
          sort_created_id?: string | null
          sort_updated_id?: string | null
          users_id: string
        }
        Update: {
          pools_question_id?: string
          question_tracker_created_at?: string
          question_tracker_id?: string
          question_tracker_question_status?: string
          question_tracker_time_taken?: number
          question_tracker_updated_at?: string
          sort_created_id?: string | null
          sort_updated_id?: string | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_tracker_table_pools_question_id_fkey"
            columns: ["pools_question_id"]
            isOneToOne: false
            referencedRelation: "pools_question_table"
            referencedColumns: ["pools_question_id"]
          },
          {
            foreignKeyName: "question_tracker_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      question_type_table: {
        Row: {
          question_type_available: boolean
          question_type_created_at: string
          question_type_id: string
          question_type_identity: Json
          question_type_local_identity: string
        }
        Insert: {
          question_type_available?: boolean
          question_type_created_at?: string
          question_type_id?: string
          question_type_identity: Json
          question_type_local_identity: string
        }
        Update: {
          question_type_available?: boolean
          question_type_created_at?: string
          question_type_id?: string
          question_type_identity?: Json
          question_type_local_identity?: string
        }
        Relationships: []
      }
      questions_table: {
        Row: {
          age_control: Json
          approval_status: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          question_time_id: string
          question_type_id: string
          questions_created_at: string
          questions_created_by: Json
          questions_id: string
          questions_identity: Json
          questions_image: string | null
          questions_reviewed_by: Json
          questions_updated_at: string
          questions_visible: boolean
          sort_created_id: string
          sort_updated_id: string
          topic_category_id: string
          topics_id: string
        }
        Insert: {
          age_control: Json
          approval_status?: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          question_time_id: string
          question_type_id: string
          questions_created_at?: string
          questions_created_by?: Json
          questions_id?: string
          questions_identity: Json
          questions_image?: string | null
          questions_reviewed_by?: Json
          questions_updated_at?: string
          questions_visible?: boolean
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_id: string
          topics_id: string
        }
        Update: {
          age_control?: Json
          approval_status?: Json
          category_group_id?: string
          country_control?: Json
          gender_control?: Json
          language_control?: Json
          question_time_id?: string
          question_type_id?: string
          questions_created_at?: string
          questions_created_by?: Json
          questions_id?: string
          questions_identity?: Json
          questions_image?: string | null
          questions_reviewed_by?: Json
          questions_updated_at?: string
          questions_visible?: boolean
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_id?: string
          topics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_table_category_group_id_fkey"
            columns: ["category_group_id"]
            isOneToOne: false
            referencedRelation: "category_group_table"
            referencedColumns: ["category_group_id"]
          },
          {
            foreignKeyName: "questions_table_question_time_id_fkey"
            columns: ["question_time_id"]
            isOneToOne: false
            referencedRelation: "question_time_table"
            referencedColumns: ["question_time_id"]
          },
          {
            foreignKeyName: "questions_table_question_type_id_fkey"
            columns: ["question_type_id"]
            isOneToOne: false
            referencedRelation: "question_type_table"
            referencedColumns: ["question_type_id"]
          },
          {
            foreignKeyName: "questions_table_topic_category_id_fkey"
            columns: ["topic_category_id"]
            isOneToOne: false
            referencedRelation: "topic_category_table"
            referencedColumns: ["topic_category_id"]
          },
          {
            foreignKeyName: "questions_table_topics_id_fkey"
            columns: ["topics_id"]
            isOneToOne: false
            referencedRelation: "topics_table"
            referencedColumns: ["topics_id"]
          },
        ]
      }
      redeem_code_rule_table: {
        Row: {
          redeem_code_rule_bot: boolean
          redeem_code_rule_created_at: string
          redeem_code_rule_id: string
          redeem_code_rule_mid: boolean
          redeem_code_rule_rank1: boolean
          redeem_code_rule_rank2: boolean
          redeem_code_rule_rank3: boolean
          redeem_code_rule_top: boolean
        }
        Insert: {
          redeem_code_rule_bot?: boolean
          redeem_code_rule_created_at?: string
          redeem_code_rule_id?: string
          redeem_code_rule_mid?: boolean
          redeem_code_rule_rank1?: boolean
          redeem_code_rule_rank2?: boolean
          redeem_code_rule_rank3?: boolean
          redeem_code_rule_top?: boolean
        }
        Update: {
          redeem_code_rule_bot?: boolean
          redeem_code_rule_created_at?: string
          redeem_code_rule_id?: string
          redeem_code_rule_mid?: boolean
          redeem_code_rule_rank1?: boolean
          redeem_code_rule_rank2?: boolean
          redeem_code_rule_rank3?: boolean
          redeem_code_rule_top?: boolean
        }
        Relationships: []
      }
      redeem_code_table: {
        Row: {
          giveback_id: string | null
          redeem_code_active: boolean
          redeem_code_amount: number
          redeem_code_created_at: string
          redeem_code_description: string
          redeem_code_expires: string | null
          redeem_code_id: string
          redeem_code_rule_id: string | null
          redeem_code_source: string | null
          redeem_code_value: string
          redeem_code_visible: boolean
          sort_created_id: string
          users_id: string
        }
        Insert: {
          giveback_id?: string | null
          redeem_code_active?: boolean
          redeem_code_amount: number
          redeem_code_created_at?: string
          redeem_code_description?: string
          redeem_code_expires?: string | null
          redeem_code_id?: string
          redeem_code_rule_id?: string | null
          redeem_code_source?: string | null
          redeem_code_value: string
          redeem_code_visible?: boolean
          sort_created_id?: string
          users_id: string
        }
        Update: {
          giveback_id?: string | null
          redeem_code_active?: boolean
          redeem_code_amount?: number
          redeem_code_created_at?: string
          redeem_code_description?: string
          redeem_code_expires?: string | null
          redeem_code_id?: string
          redeem_code_rule_id?: string | null
          redeem_code_source?: string | null
          redeem_code_value?: string
          redeem_code_visible?: boolean
          sort_created_id?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeem_code_table_giveback_id_fkey"
            columns: ["giveback_id"]
            isOneToOne: false
            referencedRelation: "giveback_table"
            referencedColumns: ["giveback_id"]
          },
          {
            foreignKeyName: "redeem_code_table_redeem_code_rule_id_fkey"
            columns: ["redeem_code_rule_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_rule_table"
            referencedColumns: ["redeem_code_rule_id"]
          },
          {
            foreignKeyName: "redeem_code_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      redeemable_table: {
        Row: {
          redeem_code_id: string
          redeemable_created_at: string
          redeemable_id: string
          redeemable_status: string
          users_id: string
        }
        Insert: {
          redeem_code_id: string
          redeemable_created_at?: string
          redeemable_id?: string
          redeemable_status: string
          users_id: string
        }
        Update: {
          redeem_code_id?: string
          redeemable_created_at?: string
          redeemable_id?: string
          redeemable_status?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeemable_table_redeem_code_id_fkey"
            columns: ["redeem_code_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_table"
            referencedColumns: ["redeem_code_id"]
          },
          {
            foreignKeyName: "redeemable_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      redirect_consume_table: {
        Row: {
          redirect_consume_created_at: string
          redirect_consume_expires_at: string | null
          redirect_consume_id: string
          redirect_consume_query: string | null
          redirect_consume_used: boolean | null
          redirect_link_id: string
          users_id: string | null
        }
        Insert: {
          redirect_consume_created_at?: string
          redirect_consume_expires_at?: string | null
          redirect_consume_id?: string
          redirect_consume_query?: string | null
          redirect_consume_used?: boolean | null
          redirect_link_id: string
          users_id?: string | null
        }
        Update: {
          redirect_consume_created_at?: string
          redirect_consume_expires_at?: string | null
          redirect_consume_id?: string
          redirect_consume_query?: string | null
          redirect_consume_used?: boolean | null
          redirect_link_id?: string
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redirect_consume_table_redirect_link_id_fkey"
            columns: ["redirect_link_id"]
            isOneToOne: false
            referencedRelation: "redirect_link_table"
            referencedColumns: ["redirect_link_id"]
          },
          {
            foreignKeyName: "redirect_consume_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      redirect_link_table: {
        Row: {
          created_at: string
          redirect_link_id: string
          redirect_link_value: string
        }
        Insert: {
          created_at?: string
          redirect_link_id: string
          redirect_link_value: string
        }
        Update: {
          created_at?: string
          redirect_link_id?: string
          redirect_link_value?: string
        }
        Relationships: []
      }
      reports_table: {
        Row: {
          reports_activity: string
          reports_by: string
          reports_created_at: string
          reports_id: string
          reports_type: string
          reports_user_involved: string
        }
        Insert: {
          reports_activity: string
          reports_by: string
          reports_created_at?: string
          reports_id?: string
          reports_type: string
          reports_user_involved: string
        }
        Update: {
          reports_activity?: string
          reports_by?: string
          reports_created_at?: string
          reports_id?: string
          reports_type?: string
          reports_user_involved?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_table_reports_by_fkey"
            columns: ["reports_by"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
          {
            foreignKeyName: "reports_table_reports_user_involved_fkey"
            columns: ["reports_user_involved"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      reward_table: {
        Row: {
          reward_created_at: string
          reward_expires_hour: number | null
          reward_id: string
          reward_instruction: Json
          reward_limit: number | null
          reward_type: string
          reward_value: number
        }
        Insert: {
          reward_created_at?: string
          reward_expires_hour?: number | null
          reward_id?: string
          reward_instruction: Json
          reward_limit?: number | null
          reward_type: string
          reward_value: number
        }
        Update: {
          reward_created_at?: string
          reward_expires_hour?: number | null
          reward_id?: string
          reward_instruction?: Json
          reward_limit?: number | null
          reward_type?: string
          reward_value?: number
        }
        Relationships: []
      }
      roles_table: {
        Row: {
          roles_access: Json
          roles_buy_in: number | null
          roles_checker: string
          roles_created_at: string
          roles_id: string
          roles_identity: Json
          roles_is_personal_entry: boolean
          roles_is_public: boolean
          roles_level: number
          roles_perks: Json
          roles_streak_amount: number
          roles_streak_duration: number
          roles_streak_expires: number
        }
        Insert: {
          roles_access?: Json
          roles_buy_in?: number | null
          roles_checker: string
          roles_created_at?: string
          roles_id?: string
          roles_identity: Json
          roles_is_personal_entry?: boolean
          roles_is_public?: boolean
          roles_level: number
          roles_perks?: Json
          roles_streak_amount?: number
          roles_streak_duration?: number
          roles_streak_expires?: number
        }
        Update: {
          roles_access?: Json
          roles_buy_in?: number | null
          roles_checker?: string
          roles_created_at?: string
          roles_id?: string
          roles_identity?: Json
          roles_is_personal_entry?: boolean
          roles_is_public?: boolean
          roles_level?: number
          roles_perks?: Json
          roles_streak_amount?: number
          roles_streak_duration?: number
          roles_streak_expires?: number
        }
        Relationships: []
      }
      suspicious_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_activities_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
          {
            foreignKeyName: "suspicious_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      topic_category_table: {
        Row: {
          age_control: Json
          approval_status: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          sort_created_id: string
          sort_updated_id: string
          topic_category_created_at: string
          topic_category_created_by: Json
          topic_category_id: string
          topic_category_identity: Json
          topic_category_image: string | null
          topic_category_reviewed_by: Json
          topic_category_updated_at: string
          topic_category_visible: boolean
          topic_category_creator: {
            country_id: string
            language_id: string
            roles_id: string
            sort_created_id: string
            transaction_id: string | null
            users_activation_at: string | null
            users_active: boolean
            users_created_at: string
            users_dob: string
            users_email: string
            users_id: string
            users_image: string | null
            users_login_type: string
            users_names: string
            users_phone: string
            users_profile_index: string | null
            users_referred_id: string | null
            users_referred_status: string
            users_roles_access: Json
            users_sex: string
            users_updated_at: string
            users_username: string
            users_verified: boolean
          } | null
        }
        Insert: {
          age_control: Json
          approval_status?: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_created_at?: string
          topic_category_created_by?: Json
          topic_category_id?: string
          topic_category_identity: Json
          topic_category_image?: string | null
          topic_category_reviewed_by?: Json
          topic_category_updated_at?: string
          topic_category_visible?: boolean
        }
        Update: {
          age_control?: Json
          approval_status?: Json
          category_group_id?: string
          country_control?: Json
          gender_control?: Json
          language_control?: Json
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_created_at?: string
          topic_category_created_by?: Json
          topic_category_id?: string
          topic_category_identity?: Json
          topic_category_image?: string | null
          topic_category_reviewed_by?: Json
          topic_category_updated_at?: string
          topic_category_visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "topic_category_table_category_group_id_fkey"
            columns: ["category_group_id"]
            isOneToOne: false
            referencedRelation: "category_group_table"
            referencedColumns: ["category_group_id"]
          },
        ]
      }
      topic_settings_table: {
        Row: {
          sort_created_id: string
          sort_updated_id: string
          topic_category_id: string | null
          topic_is_favourite: boolean
          topic_is_recent: boolean
          topic_settings_created_at: string
          topic_settings_id: string
          topic_settings_updated_at: string
          topics_id: string | null
          users_id: string
        }
        Insert: {
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_id?: string | null
          topic_is_favourite?: boolean
          topic_is_recent?: boolean
          topic_settings_created_at?: string
          topic_settings_id?: string
          topic_settings_updated_at?: string
          topics_id?: string | null
          users_id: string
        }
        Update: {
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_id?: string | null
          topic_is_favourite?: boolean
          topic_is_recent?: boolean
          topic_settings_created_at?: string
          topic_settings_id?: string
          topic_settings_updated_at?: string
          topics_id?: string | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_settings_table_topic_category_id_fkey"
            columns: ["topic_category_id"]
            isOneToOne: false
            referencedRelation: "topic_category_table"
            referencedColumns: ["topic_category_id"]
          },
          {
            foreignKeyName: "topic_settings_table_topics_id_fkey"
            columns: ["topics_id"]
            isOneToOne: false
            referencedRelation: "topics_table"
            referencedColumns: ["topics_id"]
          },
          {
            foreignKeyName: "topic_settings_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      topics_metrics_table: {
        Row: {
          topics_id: string
          topics_metrics_created_at: string
          topics_metrics_id: string
          topics_metrics_is_commented: boolean | null
          topics_metrics_is_liked: boolean | null
          topics_metrics_rating: number | null
          users_id: string
        }
        Insert: {
          topics_id: string
          topics_metrics_created_at?: string
          topics_metrics_id?: string
          topics_metrics_is_commented?: boolean | null
          topics_metrics_is_liked?: boolean | null
          topics_metrics_rating?: number | null
          users_id: string
        }
        Update: {
          topics_id?: string
          topics_metrics_created_at?: string
          topics_metrics_id?: string
          topics_metrics_is_commented?: boolean | null
          topics_metrics_is_liked?: boolean | null
          topics_metrics_rating?: number | null
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_metrics_table_topics_id_fkey"
            columns: ["topics_id"]
            isOneToOne: false
            referencedRelation: "topics_table"
            referencedColumns: ["topics_id"]
          },
          {
            foreignKeyName: "topic_metrics_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      topics_table: {
        Row: {
          age_control: Json
          approval_status: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          sort_created_id: string
          sort_updated_id: string
          topic_category_id: string
          topics_created_at: string
          topics_created_by: Json
          topics_id: string
          topics_identity: Json
          topics_image: string | null
          topics_reviewed_by: Json
          topics_updated_at: string
          topics_visible: boolean
        }
        Insert: {
          age_control: Json
          approval_status?: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_id: string
          topics_created_at?: string
          topics_created_by?: Json
          topics_id?: string
          topics_identity: Json
          topics_image?: string | null
          topics_reviewed_by?: Json
          topics_updated_at?: string
          topics_visible?: boolean
        }
        Update: {
          age_control?: Json
          approval_status?: Json
          category_group_id?: string
          country_control?: Json
          gender_control?: Json
          language_control?: Json
          sort_created_id?: string
          sort_updated_id?: string
          topic_category_id?: string
          topics_created_at?: string
          topics_created_by?: Json
          topics_id?: string
          topics_identity?: Json
          topics_image?: string | null
          topics_reviewed_by?: Json
          topics_updated_at?: string
          topics_visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "topics_table_category_group_id_fkey"
            columns: ["category_group_id"]
            isOneToOne: false
            referencedRelation: "category_group_table"
            referencedColumns: ["category_group_id"]
          },
          {
            foreignKeyName: "topics_table_topic_category_id_fkey"
            columns: ["topic_category_id"]
            isOneToOne: false
            referencedRelation: "topic_category_table"
            referencedColumns: ["topic_category_id"]
          },
        ]
      }
      transaction_table: {
        Row: {
          payment_profile_receiver_id: string
          payment_profile_sender_id: string
          pools_id: string | null
          sort_created_id: string
          transaction_balance_written: boolean
          transaction_created_at: string
          transaction_external_fee: number | null
          transaction_external_id: string | null
          transaction_fee: number
          transaction_id: string
          transaction_ledger_retries: number
          transaction_ledger_status: string | null
          transaction_receiver_amount: number
          transaction_receiver_rate: number
          transaction_receiver_reference: string
          transaction_receiver_status: string
          transaction_retry_status: boolean
          transaction_security_hash_key: string | null
          transaction_sender_amount: number
          transaction_sender_rate: number
          transaction_sender_reference: string
          transaction_sender_status: string
          transaction_service: string | null
          transaction_type: string
          transaction_updated_at: string
          users_balance_new_amount: number
          users_balance_old_amount: number
        }
        Insert: {
          payment_profile_receiver_id: string
          payment_profile_sender_id: string
          pools_id?: string | null
          sort_created_id?: string
          transaction_balance_written?: boolean
          transaction_created_at?: string
          transaction_external_fee?: number | null
          transaction_external_id?: string | null
          transaction_fee: number
          transaction_id?: string
          transaction_ledger_retries?: number
          transaction_ledger_status?: string | null
          transaction_receiver_amount: number
          transaction_receiver_rate: number
          transaction_receiver_reference?: string
          transaction_receiver_status?: string
          transaction_retry_status?: boolean
          transaction_security_hash_key?: string | null
          transaction_sender_amount: number
          transaction_sender_rate: number
          transaction_sender_reference?: string
          transaction_sender_status?: string
          transaction_service?: string | null
          transaction_type: string
          transaction_updated_at?: string
          users_balance_new_amount: number
          users_balance_old_amount: number
        }
        Update: {
          payment_profile_receiver_id?: string
          payment_profile_sender_id?: string
          pools_id?: string | null
          sort_created_id?: string
          transaction_balance_written?: boolean
          transaction_created_at?: string
          transaction_external_fee?: number | null
          transaction_external_id?: string | null
          transaction_fee?: number
          transaction_id?: string
          transaction_ledger_retries?: number
          transaction_ledger_status?: string | null
          transaction_receiver_amount?: number
          transaction_receiver_rate?: number
          transaction_receiver_reference?: string
          transaction_receiver_status?: string
          transaction_retry_status?: boolean
          transaction_security_hash_key?: string | null
          transaction_sender_amount?: number
          transaction_sender_rate?: number
          transaction_sender_reference?: string
          transaction_sender_status?: string
          transaction_service?: string | null
          transaction_type?: string
          transaction_updated_at?: string
          users_balance_new_amount?: number
          users_balance_old_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_table_payment_profile_receiver_id_fkey"
            columns: ["payment_profile_receiver_id"]
            isOneToOne: false
            referencedRelation: "payment_profile_table"
            referencedColumns: ["payment_profile_id"]
          },
          {
            foreignKeyName: "transaction_table_payment_profile_sender_id_fkey"
            columns: ["payment_profile_sender_id"]
            isOneToOne: false
            referencedRelation: "payment_profile_table"
            referencedColumns: ["payment_profile_id"]
          },
          {
            foreignKeyName: "transaction_table_pools_id_fkey"
            columns: ["pools_id"]
            isOneToOne: false
            referencedRelation: "pools_table"
            referencedColumns: ["pools_id"]
          },
        ]
      }
      user_engagement_progress_table: {
        Row: {
          pools_id: string
          user_engagement_progress_created_at: string
          user_engagement_progress_points: number
          user_engagement_progress_questions: number
          user_engagement_progress_quiz_count: number
          user_engagement_progress_time: number
          user_engagement_progress_win_count: number
          user_engagement_total_questions: number
          user_engagement_total_time: number
          users_id: string
        }
        Insert: {
          pools_id: string
          user_engagement_progress_created_at?: string
          user_engagement_progress_points?: number
          user_engagement_progress_questions?: number
          user_engagement_progress_quiz_count?: number
          user_engagement_progress_time?: number
          user_engagement_progress_win_count?: number
          user_engagement_total_questions?: number
          user_engagement_total_time?: number
          users_id?: string
        }
        Update: {
          pools_id?: string
          user_engagement_progress_created_at?: string
          user_engagement_progress_points?: number
          user_engagement_progress_questions?: number
          user_engagement_progress_quiz_count?: number
          user_engagement_progress_time?: number
          user_engagement_progress_win_count?: number
          user_engagement_total_questions?: number
          user_engagement_total_time?: number
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_engagement_progress_table_pools_id_fkey"
            columns: ["pools_id"]
            isOneToOne: false
            referencedRelation: "pools_table"
            referencedColumns: ["pools_id"]
          },
          {
            foreignKeyName: "user_engagement_progress_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: true
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      users_followers_table: {
        Row: {
          users_creator_id: string | null
          users_followers_created_at: string
          users_followers_id: string
          users_id: string
        }
        Insert: {
          users_creator_id?: string | null
          users_followers_created_at?: string
          users_followers_id?: string
          users_id: string
        }
        Update: {
          users_creator_id?: string | null
          users_followers_created_at?: string
          users_followers_id?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_followers_table_users_creator_id_fkey"
            columns: ["users_creator_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
          {
            foreignKeyName: "users_followers_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      users_settings_table: {
        Row: {
          users_id: string
          users_settings_created_at: string
        }
        Insert: {
          users_id?: string
          users_settings_created_at?: string
        }
        Update: {
          users_id?: string
          users_settings_created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_settings_table_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: true
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      users_table: {
        Row: {
          country_id: string
          language_id: string
          roles_id: string
          sort_created_id: string
          transaction_id: string | null
          users_activation_at: string | null
          users_active: boolean
          users_created_at: string
          users_dob: string
          users_email: string
          users_id: string
          users_image: string | null
          users_login_type: string
          users_names: string
          users_phone: string
          users_profile_index: string | null
          users_referred_id: string | null
          users_referred_status: string
          users_roles_access: Json
          users_sex: string
          users_updated_at: string
          users_username: string
          users_verified: boolean
          user_creator_followers: {
            users_creator_id: string | null
            users_followers_created_at: string
            users_followers_id: string
            users_id: string
          } | null
        }
        Insert: {
          country_id: string
          language_id: string
          roles_id: string
          sort_created_id?: string
          transaction_id?: string | null
          users_activation_at?: string | null
          users_active?: boolean
          users_created_at?: string
          users_dob: string
          users_email: string
          users_id: string
          users_image?: string | null
          users_login_type: string
          users_names: string
          users_phone: string
          users_profile_index?: string | null
          users_referred_id?: string | null
          users_referred_status?: string
          users_roles_access?: Json
          users_sex: string
          users_updated_at?: string
          users_username: string
          users_verified?: boolean
        }
        Update: {
          country_id?: string
          language_id?: string
          roles_id?: string
          sort_created_id?: string
          transaction_id?: string | null
          users_activation_at?: string | null
          users_active?: boolean
          users_created_at?: string
          users_dob?: string
          users_email?: string
          users_id?: string
          users_image?: string | null
          users_login_type?: string
          users_names?: string
          users_phone?: string
          users_profile_index?: string | null
          users_referred_id?: string | null
          users_referred_status?: string
          users_roles_access?: Json
          users_sex?: string
          users_updated_at?: string
          users_username?: string
          users_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "users_table_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country_table"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "users_table_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "language_table"
            referencedColumns: ["language_id"]
          },
          {
            foreignKeyName: "users_table_roles_id_fkey"
            columns: ["roles_id"]
            isOneToOne: false
            referencedRelation: "roles_table"
            referencedColumns: ["roles_id"]
          },
          {
            foreignKeyName: "users_table_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transaction_table"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "users_table_users_referred_id_fkey"
            columns: ["users_referred_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
      wallet_balance_table: {
        Row: {
          created_at: string
          currency: string
          last_alert_at: string | null
          our_profit: number
          payment_wallet_id: string
          replenish_needed: boolean
          updated_at: string
          user_principal: number
          wallet_balance: number
          wallet_float_minimum: number
          wallet_float_target: number
          wallet_settlement_rate: number
        }
        Insert: {
          created_at?: string
          currency: string
          last_alert_at?: string | null
          our_profit?: number
          payment_wallet_id: string
          replenish_needed?: boolean
          updated_at?: string
          user_principal?: number
          wallet_balance?: number
          wallet_float_minimum?: number
          wallet_float_target?: number
          wallet_settlement_rate?: number
        }
        Update: {
          created_at?: string
          currency?: string
          last_alert_at?: string | null
          our_profit?: number
          payment_wallet_id?: string
          replenish_needed?: boolean
          updated_at?: string
          user_principal?: number
          wallet_balance?: number
          wallet_float_minimum?: number
          wallet_float_target?: number
          wallet_settlement_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balance_table_wallet_fkey"
            columns: ["payment_wallet_id"]
            isOneToOne: true
            referencedRelation: "payment_wallet_table"
            referencedColumns: ["payment_wallet_id"]
          },
        ]
      }
      wallet_ledger_table: {
        Row: {
          adc_amount: number
          currency: string
          exchange_rate: number
          flutterwave_fee_amount: number
          gross_amount: number
          method_checker: string | null
          our_profit_amount: number
          payment_wallet_id: string
          pools_id: string | null
          principal_amount: number
          reconciled_at: string | null
          redeem_code_id: string | null
          sort_created_id: string
          transaction_id: string | null
          transaction_type: string
          wallet_ledger_created_at: string
          wallet_ledger_id: string
        }
        Insert: {
          adc_amount: number
          currency: string
          exchange_rate: number
          flutterwave_fee_amount: number
          gross_amount: number
          method_checker?: string | null
          our_profit_amount: number
          payment_wallet_id: string
          pools_id?: string | null
          principal_amount: number
          reconciled_at?: string | null
          redeem_code_id?: string | null
          sort_created_id?: string
          transaction_id?: string | null
          transaction_type: string
          wallet_ledger_created_at?: string
          wallet_ledger_id?: string
        }
        Update: {
          adc_amount?: number
          currency?: string
          exchange_rate?: number
          flutterwave_fee_amount?: number
          gross_amount?: number
          method_checker?: string | null
          our_profit_amount?: number
          payment_wallet_id?: string
          pools_id?: string | null
          principal_amount?: number
          reconciled_at?: string | null
          redeem_code_id?: string | null
          sort_created_id?: string
          transaction_id?: string | null
          transaction_type?: string
          wallet_ledger_created_at?: string
          wallet_ledger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_payment_wallet_fkey"
            columns: ["payment_wallet_id"]
            isOneToOne: false
            referencedRelation: "payment_wallet_table"
            referencedColumns: ["payment_wallet_id"]
          },
          {
            foreignKeyName: "wallet_ledger_pools_fkey"
            columns: ["pools_id"]
            isOneToOne: false
            referencedRelation: "pools_table"
            referencedColumns: ["pools_id"]
          },
          {
            foreignKeyName: "wallet_ledger_table_redeem_code_id_fkey"
            columns: ["redeem_code_id"]
            isOneToOne: false
            referencedRelation: "redeem_code_table"
            referencedColumns: ["redeem_code_id"]
          },
          {
            foreignKeyName: "wallet_ledger_transaction_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transaction_table"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
    }
    Views: {
      fraud_analytics: {
        Row: {
          avg_risk_score: number | null
          blocked_count: number | null
          last_check: string | null
          max_risk_score: number | null
          total_checks: number | null
          unique_devices: number | null
          unique_ips: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_table"
            referencedColumns: ["users_id"]
          },
        ]
      }
    }
    Functions: {
      _ledger_mark_failed: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      activate_user_account: {
        Args: {
          p_amount: number
          p_status: string
          p_transaction_id: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      assert_allowed_region: {
        Args: { p_feature?: string; p_ip?: unknown }
        Returns: string
      }
      async_rpc: {
        Args: {
          json_args: Json
          jwt_token?: string
          rpc_name: string
          supabase_url: string
          version?: string
        }
        Returns: undefined
      }
      authorized_quiz_pool_questions: {
        Args: { p_locale: string; p_pool_id: string }
        Returns: Json
      }
      build_control: {
        Args: {
          controls: Json
          fallback_locales?: string[]
          requested_locale?: string
          use_default?: boolean
        }
        Returns: Json[]
      }
      calculate_amount_with_fee: {
        Args: {
          fee_amount: number
          fee_flat: number
          fee_type: string
          original_amount: number
        }
        Returns: number
      }
      calibrate_wallet_floats: {
        Args: never
        Returns: {
          avg_topup: number
          currency: string
          days_of_data: number
          new_float_minimum: number
          new_float_target: number
          p95_withdrawal: number
          same_day_credit: number
          settlement_rate: number
          wallet_id: string
        }[]
      }
      calibrate_wallet_settlement_rates: {
        Args: never
        Returns: {
          out_currency: string
          out_observed_rate: number
          out_settled_within_sla: number
          out_total_topups: number
          out_wallet_id: string
        }[]
      }
      change_creator_follow_status: {
        Args: { p_creator_id: string; p_user_id: string }
        Returns: Json
      }
      change_newsletter_subscription: {
        Args: { p_email: string }
        Returns: Json
      }
      change_topic_personalised_status: {
        Args: { p_topic_id: string; p_user_id: string }
        Returns: Json
      }
      charge_user_quiz_pool: {
        Args: {
          p_age: string
          p_challenge_id: string
          p_country: string
          p_gender: string
          p_locale: string
          p_redeem_code?: string
          p_user_id: string
        }
        Returns: Json
      }
      check_email_exist: { Args: { p_email: string }; Returns: boolean }
      check_phone_exist: { Args: { p_phone: string }; Returns: boolean }
      check_role_verification: {
        Args: { p_roles_id?: string; p_users_id?: string }
        Returns: Json
      }
      check_username_exist: { Args: { p_username: string }; Returns: boolean }
      check_wallet_balance_for_withdrawal: {
        Args: { p_amount: number; p_fw_balance: number; p_wallet_id: string }
        Returns: Json
      }
      claim_giveback_code: {
        Args: { p_giveback_code: string; p_locale: string; p_password?: string }
        Returns: Json
      }
      claim_user_achievements: {
        Args: { p_achievements_id: string; p_locale: string }
        Returns: Json
      }
      claim_user_mission: {
        Args: { p_locale: string; p_mission_id: string }
        Returns: Json
      }
      claim_user_streaks: { Args: { p_locale: string }; Returns: Json }
      commit_quiz_pool_entry: {
        Args: {
          p_age: string
          p_challenge_id: string
          p_country: string
          p_gender: string
          p_locale: string
          p_pool_id?: string
          p_redeem_code?: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json
      }
      complete_pool_quiz: { Args: { p_pool_id: string }; Returns: undefined }
      complete_pool_users_charge: {
        Args: { p_pool_id: string }
        Returns: boolean
      }
      consume_redirect: { Args: { p_redirect_id: string }; Returns: Json }
      count_accepted_questions: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_status?: string
          p_topic_id: string
          p_tracker_status?: string
          p_user_id: string
          p_visible?: boolean
        }
        Returns: number
      }
      create_giveback_code: {
        Args: {
          p_age_control: Json[]
          p_amount?: number
          p_country_control: Json[]
          p_fee?: number
          p_gender_control: Json[]
          p_giveback_code: string
          p_giveback_identifier?: string
          p_language_control: Json[]
          p_locale: string
          p_method_checker?: string
          p_password?: string
          p_rule_id?: string
          p_unit: number
          p_usage: number
          p_wallet_id?: string
        }
        Returns: Json
      }
      create_or_get_academix_profile: {
        Args: { p_locale: string }
        Returns: Json
      }
      create_or_get_wallet_profile: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_user_id: string
        }
        Returns: Json
      }
      create_or_join_public_quiz_pool: {
        Args: {
          p_age: string
          p_challenge_id: string
          p_country: string
          p_gender: string
          p_locale: string
          p_pool_id?: string
          p_redeem_code?: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json
      }
      create_redirect_consumer: {
        Args: { p_query?: string; p_redirect_to: string; p_user_id: string }
        Returns: Json
      }
      create_reward_redeem_code: {
        Args: {
          expires_at?: string
          p_amount: number
          p_source?: string
          p_title: string
          p_user_id: string
        }
        Returns: Json
      }
      create_user_redeem_code: {
        Args: { p_amount: number; p_rule_id?: string; p_user_id: string }
        Returns: string
      }
      decontrol: {
        Args: {
          controls: Json
          fallback_locales?: string[]
          requested_control: string
          requested_locale?: string
          use_default?: boolean
        }
        Returns: {
          record: Json
          translation: string
          value: boolean
        }[]
      }
      delete_pool_quiz: { Args: { p_pool_id: string }; Returns: boolean }
      end_pool_quiz: { Args: { p_pool_id: string }; Returns: boolean }
      evaluate_category: {
        Args: {
          p_approval_checker: string
          p_category_id: string
          p_user_id: string
        }
        Returns: Json
      }
      evaluate_group: {
        Args: {
          p_approval_checker: string
          p_group_id: string
          p_user_id: string
        }
        Returns: Json
      }
      evaluate_question: {
        Args: {
          p_approval_checker: string
          p_question_id: string
          p_user_id: string
        }
        Returns: Json
      }
      evaluate_topic: {
        Args: {
          p_approval_checker: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json
      }
      fetch_available_quizzes: {
        Args: {
          p_after_quiz_topics: Json
          p_limit_by: number
          p_locale: string
          p_search_key?: string
          p_type: string
        }
        Returns: Json[]
      }
      fetch_categories: {
        Args: {
          p_after_categories: Json
          p_age: string
          p_country: string
          p_gender: string
          p_group_id?: string
          p_limit_by: number
          p_locale: string
          p_reviewer_tab?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json[]
      }
      fetch_country: { Args: { p_locale: string }; Returns: Json[] }
      fetch_friends: {
        Args: {
          p_after_friends: Json
          p_limit_by: number
          p_locale: string
          p_search_key?: string
        }
        Returns: Json[]
      }
      fetch_general_content_check: {
        Args: {
          p_age?: boolean
          p_approval?: string
          p_checker_id?: string
          p_country?: boolean
          p_gender?: boolean
          p_locale?: boolean
          p_owner_id: string
          p_search: string
          p_viewer_id: string
          p_visible?: boolean
        }
        Returns: boolean
      }
      fetch_groups: {
        Args: {
          p_after_groups: Json
          p_age: string
          p_country: string
          p_gender: string
          p_limit_by: number
          p_limit_category?: number
          p_locale: string
          p_reviewer_tab?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json[]
      }
      fetch_languages: { Args: { p_locale: string }; Returns: Json[] }
      fetch_payout_data: {
        Args: { p_challenge_id?: string; p_locale: string }
        Returns: Json[]
      }
      fetch_pool_members: {
        Args: {
          p_after_pool_members: Json
          p_for_ranking?: boolean
          p_limit_by: number
          p_locale: string
          p_pool_id: string
        }
        Returns: Json[]
      }
      fetch_public_quizzes: {
        Args: {
          p_after_quiz_topics: Json
          p_limit_by: number
          p_locale: string
          p_search_key?: string
          p_type: string
        }
        Returns: Json[]
      }
      fetch_question_time: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_user_id: string
        }
        Returns: Json[]
      }
      fetch_question_types: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_user_id: string
        }
        Returns: Json[]
      }
      fetch_questions: {
        Args: {
          p_after_questions: Json
          p_age: string
          p_country: string
          p_gender: string
          p_limit_by: number
          p_locale: string
          p_reviewer_tab?: string
          p_topic_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json[]
      }
      fetch_quiz_challenges: {
        Args: { p_game_mode_id?: string; p_locale: string; topic_id: string }
        Returns: Json[]
      }
      fetch_quiz_modes: {
        Args: { p_locale: string; p_topic_id?: string }
        Returns: Json[]
      }
      fetch_redirect_links: { Args: { p_links: string[] }; Returns: Json }
      fetch_roles: { Args: { p_locale: string }; Returns: Json[] }
      fetch_top_up_methods: {
        Args: {
          p_after_methods: Json
          p_limit_by: number
          p_locale: string
          p_wallet_id: string
        }
        Returns: Json[]
      }
      fetch_top_up_profiles: {
        Args: {
          p_after_profiles: Json
          p_limit_by: number
          p_locale: string
          p_method_id: string
        }
        Returns: Json[]
      }
      fetch_top_up_wallets: {
        Args: { p_after_wallets: Json; p_limit_by: number; p_locale?: string }
        Returns: Json[]
      }
      fetch_topics: {
        Args: {
          p_after_topics: Json
          p_age: string
          p_category_id?: string
          p_country: string
          p_gender: string
          p_limit_by: number
          p_locale: string
          p_reviewer_tab?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json[]
      }
      fetch_user_achievements: {
        Args: {
          p_achievement_tab: string
          p_after_achievements: Json
          p_limit_by: number
          p_locale: string
        }
        Returns: Json[]
      }
      fetch_user_activation_role: {
        Args: { p_locale: string; p_user_id: string }
        Returns: Json
      }
      fetch_user_activation_status: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      fetch_user_missions: {
        Args: {
          p_after_missions: Json
          p_limit_by: number
          p_locale: string
          p_mission_tab: string
        }
        Returns: Json[]
      }
      fetch_user_quiz_history: {
        Args: {
          p_after_histories: Json
          p_limit_by: number
          p_locale: string
          p_search_key?: string
        }
        Returns: Json[]
      }
      fetch_user_top_up_wallet: {
        Args: { p_country_id: string; p_locale: string }
        Returns: Json
      }
      fetch_user_transaction_by_id: {
        Args: {
          p_age?: string
          p_country?: string
          p_gender?: string
          p_locale?: string
          p_transaction_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      fetch_user_transactions: {
        Args: {
          p_after_transactions?: Json
          p_age?: string
          p_country?: string
          p_gender?: string
          p_limit_by?: number
          p_locale?: string
          p_user_id?: string
        }
        Returns: Json[]
      }
      fetch_user_withdraw_wallets: {
        Args: { p_country_id: string; p_locale: string }
        Returns: Json
      }
      fetch_withdraw_methods: {
        Args: {
          p_after_methods: Json
          p_limit_by: number
          p_locale: string
          p_wallet_id: string
        }
        Returns: Json[]
      }
      fetch_withdraw_profiles: {
        Args: {
          p_after_profiles: Json
          p_limit_by: number
          p_locale: string
          p_method_id: string
        }
        Returns: Json[]
      }
      fetch_withdraw_wallets: {
        Args: { p_after_wallets: Json; p_limit_by: number; p_locale?: string }
        Returns: Json[]
      }
      gamify_pool_quiz: {
        Args: { jwt_token: string; p_pool_id: string }
        Returns: undefined
      }
      gate_check: {
        Args: {
          p_country_override?: string
          p_feature?: string
          p_ip?: unknown
          p_locale?: string
          p_user_id?: string
        }
        Returns: {
          age: string
          country: string
          gender: string
          status: string
          users_id: string
        }[]
      }
      generate_pool_code: { Args: never; Returns: string }
      generate_transaction_external_ref: { Args: never; Returns: string }
      generate_transaction_internal_ref: { Args: never; Returns: string }
      get_accepted_questions: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_status?: string
          p_topic_id: string
          p_tracker_status?: string
          p_user_id: string
          p_visible?: boolean
        }
        Returns: {
          age_control: Json
          approval_status: Json
          category_group_id: string
          country_control: Json
          gender_control: Json
          language_control: Json
          question_time_id: string
          question_type_id: string
          questions_created_at: string
          questions_created_by: Json
          questions_id: string
          questions_identity: Json
          questions_image: string | null
          questions_reviewed_by: Json
          questions_updated_at: string
          questions_visible: boolean
          sort_created_id: string
          sort_updated_id: string
          topic_category_id: string
          topics_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "questions_table"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_quiz: {
        Args: { p_locale?: string; p_user_id?: string }
        Returns: Json
      }
      get_adc_wallet_id: { Args: never; Returns: string }
      get_all_question_options: {
        Args: { p_locale: string; p_question_id: string; p_user_id: string }
        Returns: Json[]
      }
      get_all_topic_questions: {
        Args: {
          p_after_question?: string
          p_age: string
          p_country: string
          p_gender: string
          p_limit_by: number
          p_locale: string
          p_topic_id?: string
          p_user_id: string
        }
        Returns: Json[]
      }
      get_approval_checker: {
        Args: {
          looking_tab: string
          record_approval: string
          reviewer_id?: string
          viewer_id: string
        }
        Returns: boolean
      }
      get_category_evaluation: {
        Args: { p_category_id: string; p_locale: string; p_user_id: string }
        Returns: Json
      }
      get_category_exists: {
        Args: {
          p_group_id: string
          p_locale: string
          p_name: string
          p_public: boolean
          p_user_id: string
        }
        Returns: Json
      }
      get_challenge_accepted: {
        Args: {
          p_age: string
          p_challenge_id: string
          p_country: string
          p_gender: string
          p_locale: string
          p_owner_id: string
          p_topic_id: string
        }
        Returns: boolean
      }
      get_code_data: {
        Args: { p_locale: string; p_redeem_code: string }
        Returns: Json
      }
      get_column_ownership: { Args: { p_tables: string[] }; Returns: Json }
      get_creator_categories: {
        Args: {
          p_after_categories: Json
          p_age: string
          p_country: string
          p_gender: string
          p_limit_by: number
          p_locale: string
          p_user_id: string
        }
        Returns: Json[]
      }
      get_creator_quizzes: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_user_id: string
        }
        Returns: Json[]
      }
      get_database_time: { Args: never; Returns: string }
      get_engagement_level_info_by_points: {
        Args: { p_locale: string; p_points: number }
        Returns: Json
      }
      get_feature_status: {
        Args: {
          p_age: string
          p_country_override?: string
          p_feature: string
          p_gender: string
          p_locale: string
          p_state_override?: string
        }
        Returns: Json
      }
      get_fiat_wallet_by_currency: {
        Args: { p_currency: string }
        Returns: {
          buy_active: boolean
          buy_fee: number
          buy_fee_flat: number
          buy_min: number
          buy_rate: number
          buy_rate_type: string
          sell_active: boolean
          sell_fee: number
          sell_fee_flat: number
          sell_min: number
          sell_rate: number
          sell_rate_type: string
          wallet_id: string
          wallet_identity: string
        }[]
      }
      get_fresh_control_details: {
        Args: { control_type: string; p_locale?: string }
        Returns: Json[]
      }
      get_give_back_code: {
        Args: {
          p_after_giveback?: Json
          p_limit_by?: number
          p_locale?: string
        }
        Returns: Json[]
      }
      get_group_evaluation: {
        Args: { p_group_id: string; p_locale: string; p_user_id: string }
        Returns: Json
      }
      get_group_exists: {
        Args: {
          p_locale: string
          p_name: string
          p_public: boolean
          p_user_id: string
        }
        Returns: Json
      }
      get_media_operation_id: {
        Args: { p_locale: string; p_path?: string; p_type: string }
        Returns: string
      }
      get_method_country_code: {
        Args: { p_method_id: string }
        Returns: string
      }
      get_my_sessions: {
        Args: never
        Returns: {
          created_at: string
          id: string
          ip: string
          is_current: boolean
          refreshed_at: string
          user_agent: string
        }[]
      }
      get_option_evaluation: {
        Args: { p_locale: string; p_question_id: string; p_user_id: string }
        Returns: Json[]
      }
      get_partial_user_record: {
        Args: { p_login_check: string; p_login_type: string }
        Returns: Json
      }
      get_platform_config: { Args: never; Returns: Json }
      get_pool_auth_code: {
        Args: { p_pool_id: string; p_user_id: string }
        Returns: string
      }
      get_pool_details: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_pool_question_options: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_question_id: string
          p_question_type: string
          p_user_id: string
        }
        Returns: Json[]
      }
      get_pools_members_count: {
        Args: { p_pools_id: string; p_topics_id: string; p_user_id: string }
        Returns: number
      }
      get_public_auth_quiz_pool: {
        Args: { p_locale: string; p_pool_auth_code: string }
        Returns: Json
      }
      get_question_evaluation: {
        Args: { p_locale: string; p_question_id: string; p_user_id: string }
        Returns: Json
      }
      get_question_exists: {
        Args: {
          p_locale: string
          p_name: string
          p_public: boolean
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_quiz_available: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_owner_id: string
          topic_id: string
        }
        Returns: boolean
      }
      get_quiz_content_check: {
        Args: {
          p_age?: boolean
          p_approval?: string
          p_country?: boolean
          p_gender?: boolean
          p_locale?: boolean
          p_owner_id: string
          p_search: string
          p_viewer_id: string
          p_visible?: boolean
        }
        Returns: boolean
      }
      get_quiz_result: {
        Args: { p_locale: string; p_pool_id: string }
        Returns: Json
      }
      get_quiz_status_check: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_owner_id: string
          topic_id: string
        }
        Returns: boolean
      }
      get_referral_data: { Args: { p_username: string }; Returns: Json }
      get_refreshed_transaction: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      get_top_up_payment_methods: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_user_id: string
          p_wallet_it: string
        }
        Returns: Json[]
      }
      get_topic_evaluation: {
        Args: { p_locale: string; p_topic_id: string; p_user_id: string }
        Returns: Json
      }
      get_topic_exists: {
        Args: {
          p_category_id: string
          p_locale: string
          p_name: string
          p_public: boolean
          p_user_id: string
        }
        Returns: Json
      }
      get_transaction_flutterwave_method: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      get_transaction_for_credit_retry: {
        Args: { p_hash_key: string; p_transaction_id: string }
        Returns: Json
      }
      get_unreconciled_ledger_transactions: {
        Args: { p_limit?: number; p_max_retries?: number }
        Returns: {
          confirmed_at: string
          currency: string
          ledger_retries: number
          ledger_status: string
          transaction_amount: number
          transaction_external_id: string
          transaction_id: string
          transaction_type: string
        }[]
      }
      get_user_academix_ratio: { Args: { p_locale: string }; Returns: Json }
      get_user_achievements_count: { Args: { p_locale: string }; Returns: Json }
      get_user_achievements_progress: {
        Args: {
          p_achievements_id: string
          p_achievements_req: Json
          p_user_id: string
        }
        Returns: Json
      }
      get_user_balance: { Args: { p_locale: string }; Returns: Json }
      get_user_daily_performance: { Args: { p_locale: string }; Returns: Json }
      get_user_engagement: { Args: { p_locale: string }; Returns: Json }
      get_user_fields: {
        Args: {
          p_fields: string[]
          p_locale?: string
          p_transform?: string[]
          p_translate?: string[]
          p_user_id: string
        }
        Returns: Json
      }
      get_user_login_record: {
        Args: { p_login_check: string; p_login_type: string }
        Returns: Json
      }
      get_user_mission_progress: {
        Args: { p_mission_id: string; p_mission_req: Json; p_user_id: string }
        Returns: Json
      }
      get_user_missions_count: { Args: { p_locale: string }; Returns: Json }
      get_user_record: {
        Args: { p_locale: string; p_user_id: string }
        Returns: Json
      }
      get_user_streaks: { Args: { p_locale: string }; Returns: Json[] }
      get_user_topic_questions: {
        Args: {
          p_after_question?: string
          p_age: string
          p_country: string
          p_gender: string
          p_limit_by: number
          p_locale: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json[]
      }
      get_users_redeem_code: {
        Args: { p_after_codes: Json; p_limit_by: number; p_locale: string }
        Returns: Json[]
      }
      grade_pool_quiz: { Args: { p_pool_id: string }; Returns: undefined }
      handle_referral_payment: {
        Args: {
          p_amount: number
          p_status: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      handle_user_payment: {
        Args: {
          p_age: string
          p_amount: number
          p_country: string
          p_gender: string
          p_locale: string
          p_payment_session_id: string
          p_receiver_profile_id: string
          p_sender_profile_id: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      ingest_ip_geo: { Args: never; Returns: number }
      latest_content_pagination: {
        Args: { cid: string; ctime: string; lid?: string; ltime?: string }
        Returns: boolean
      }
      leave_active_quiz_pool: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_user_id: string
        }
        Returns: Json
      }
      location_gate: {
        Args: { p_feature?: string; p_locale?: string }
        Returns: string
      }
      migrate_payment_method_network: { Args: never; Returns: undefined }
      new_option: {
        Args: {
          locale: string
          max?: number
          min?: number
          option: string
          option_is_correct: boolean
          option_language: string
          question_id: string
          translation: Json
          unit?: string
          user_id: string
        }
        Returns: Json
      }
      pay_pool_quiz: { Args: { p_pool_id: string }; Returns: undefined }
      permission_checker: {
        Args: { owner_id: string; viewer_id: string }
        Returns: boolean
      }
      prepare_pools_questions: { Args: { p_pool_id: string }; Returns: boolean }
      preserve_option_identity: {
        Args: { p_option: string; p_type: string }
        Returns: string
      }
      rank_pool_quiz: { Args: { p_pool_id: string }; Returns: undefined }
      record_pool: { Args: { p_pools_id: string }; Returns: undefined }
      reformat_text: { Args: { input_text: string }; Returns: string }
      region_block_status: {
        Args: {
          p_country?: string
          p_feature?: string
          p_ip?: unknown
          p_state?: string
        }
        Returns: string
      }
      request_ip_geo: { Args: { p_ip: unknown }; Returns: undefined }
      resolve_flutterwave_method: {
        Args: { p_method_checker: string }
        Returns: Json
      }
      resolve_ip_geo: {
        Args: { p_ip: unknown }
        Returns: {
          country_code: string
          state_code: string
        }[]
      }
      result_quiz_pool_update: {
        Args: { p_locale: string; p_pool_id: string }
        Returns: Json
      }
      revoke_my_session: { Args: { p_session_id: string }; Returns: boolean }
      reward_pool_quiz: { Args: { p_pool_id: string }; Returns: undefined }
      reward_user: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_locale: string
          p_reward_id: string
          p_source: string
          p_title: string
          p_user_id: string
        }
        Returns: Json
      }
      save_control_details: {
        Args: {
          control_defaults: Json[]
          control_type: string
          p_locale: string
        }
        Returns: Json
      }
      set_transaction_retry_hash: {
        Args: { p_hash_key: string; p_transaction_id: string }
        Returns: boolean
      }
      settle_pool_quiz: { Args: { p_pool_id: string }; Returns: undefined }
      start_pools_quiz: { Args: { p_pool_id: string }; Returns: number }
      submit_category_content: {
        Args: {
          p_age: string
          p_age_control: Json[]
          p_country: string
          p_country_control: Json[]
          p_gender: string
          p_gender_control: Json[]
          p_group_id: string
          p_language_control: Json[]
          p_locale: string
          p_public: boolean
          p_topic_category_id?: string
          p_topic_category_text: string
          p_user_id: string
        }
        Returns: Json
      }
      submit_group_content: {
        Args: {
          p_age: string
          p_age_control: Json[]
          p_country: string
          p_country_control: Json[]
          p_gender: string
          p_gender_control: Json[]
          p_group_id?: string
          p_group_text: string
          p_language_control: Json[]
          p_locale: string
          p_public: boolean
          p_user_id: string
        }
        Returns: Json
      }
      submit_or_update_user_profile:
        | {
            Args: {
              p_buy_status?: boolean
              p_locale: string
              p_method_id: string
              p_profile_data: Json
              p_profile_type: string
              p_sell_status?: boolean
            }
            Returns: Json
          }
        | {
            Args: {
              p_locale: string
              p_method_id: string
              p_profile_data: Json
              p_profile_type: string
              p_status: boolean
            }
            Returns: Json
          }
      submit_question_content: {
        Args: {
          p_age: string
          p_age_control: Json[]
          p_country: string
          p_country_control: Json[]
          p_gender: string
          p_gender_control: Json[]
          p_language_control: Json[]
          p_locale: string
          p_options: Json[]
          p_public: boolean
          p_question_text: string
          p_questions_id?: string
          p_time_id: string
          p_topic_id: string
          p_type_id: string
          p_user_id: string
        }
        Returns: Json
      }
      submit_question_tracker: {
        Args: { p_locale: string; p_submission: Json }
        Returns: Json
      }
      submit_topic_content: {
        Args: {
          p_age: string
          p_age_control: Json[]
          p_category_id: string
          p_country: string
          p_country_control: Json[]
          p_gender: string
          p_gender_control: Json[]
          p_language_control: Json[]
          p_locale: string
          p_public: boolean
          p_topic_text: string
          p_topics_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      topic_category_creator: {
        Args: {
          "": Database["public"]["Tables"]["topic_category_table"]["Row"]
        }
        Returns: {
          country_id: string
          language_id: string
          roles_id: string
          sort_created_id: string
          transaction_id: string | null
          users_activation_at: string | null
          users_active: boolean
          users_created_at: string
          users_dob: string
          users_email: string
          users_id: string
          users_image: string | null
          users_login_type: string
          users_names: string
          users_phone: string
          users_profile_index: string | null
          users_referred_id: string | null
          users_referred_status: string
          users_roles_access: Json
          users_sex: string
          users_updated_at: string
          users_username: string
          users_verified: boolean
        }
        SetofOptions: {
          from: "topic_category_table"
          to: "users_table"
          isOneToOne: true
          isSetofReturn: true
        }
      }
      translate: {
        Args: {
          fallback_locales?: string[]
          requested_locale: string
          translations: Json
          use_default?: boolean
        }
        Returns: {
          record: Json
          translation: string
        }[]
      }
      tsdf: { Args: { tsid: string }; Returns: string }
      tsid: { Args: { input_time?: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
      update_category_image: {
        Args: {
          p_age: string
          p_category_id: string
          p_country: string
          p_gender: string
          p_image_path?: string
          p_locale: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_option_image: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_image_path?: string
          p_locale: string
          p_option_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_pool_status: {
        Args: {
          p_pools_id: string
          p_previous_task?: string
          p_public?: boolean
        }
        Returns: undefined
      }
      update_question_image: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_image_path?: string
          p_locale: string
          p_question_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_topic_image: {
        Args: {
          p_age: string
          p_country: string
          p_gender: string
          p_image_path?: string
          p_locale: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_user_achievements_progress: {
        Args: { p_progress_data: Json; p_user_id: string }
        Returns: Json
      }
      update_user_email: {
        Args: { p_email: string; p_locale: string }
        Returns: Json
      }
      update_user_engagement_progress: {
        Args: { p_pool_member_id: string }
        Returns: Json
      }
      update_user_fullname: {
        Args: { p_fullname: string; p_locale: string }
        Returns: Json
      }
      update_user_image: {
        Args: {
          p_image_path?: string
          p_locale: string
          p_operation_id: string
        }
        Returns: boolean
      }
      update_user_mission_progress: {
        Args: { p_progress_data: Json; p_user_id: string }
        Returns: Json
      }
      update_user_payment: {
        Args: {
          amount: number
          currency: string
          event: string
          fw_fee?: number
          id?: string
          reference: string
          service?: string
          status: string
        }
        Returns: Json
      }
      update_user_phone: {
        Args: { p_locale: string; p_phone: string }
        Returns: Json
      }
      update_user_username: {
        Args: { p_locale: string; p_username: string }
        Returns: Json
      }
      user_creator_followers: {
        Args: { "": Database["public"]["Tables"]["users_table"]["Row"] }
        Returns: {
          users_creator_id: string | null
          users_followers_created_at: string
          users_followers_id: string
          users_id: string
        }[]
        SetofOptions: {
          from: "users_table"
          to: "users_followers_table"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      validate_quiz_pool_entry: {
        Args: {
          p_age: string
          p_challenge_id: string
          p_country: string
          p_gender: string
          p_locale: string
          p_pool_id?: string
          p_topic_id: string
          p_user_id: string
        }
        Returns: Json
      }
      verify_code_rule: {
        Args: { p_data: Json; p_redeem_id: string; p_user_id: string }
        Returns: Json
      }
      write_bonus_ledger_entry: {
        Args: { p_amount: number; p_redeem_code_id: string }
        Returns: undefined
      }
      write_cashout_ledger_entry: {
        Args: {
          p_amount: number
          p_fee: number
          p_method_checker: string
          p_rate: number
          p_wallet_id: string
        }
        Returns: undefined
      }
      write_deposit_ledger_entry: {
        Args: {
          p_amount: number
          p_fee: number
          p_method_checker: string
          p_wallet_id: string
        }
        Returns: undefined
      }
      write_giveback_ledger_entry: {
        Args: {
          p_fee?: number
          p_fiat_amount?: number
          p_giveback_id: string
          p_giveback_identifier: string
          p_method_checker?: string
          p_total_usage: number
          p_unit_amount: number
          p_wallet_id?: string
        }
        Returns: undefined
      }
      write_quiz_ledger_entry: {
        Args: { p_amount: number; p_pools_id: string }
        Returns: undefined
      }
      write_wallet_ledger_entry: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
    }
    Enums: {
      Pools: "created" | "open"
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
  public: {
    Enums: {
      Pools: ["created", "open"],
    },
  },
} as const
