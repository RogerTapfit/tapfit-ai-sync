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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          badge_color: string
          badge_icon: string | null
          coin_reward: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          rarity_level: string
          trigger_condition: Json
        }
        Insert: {
          achievement_type: string
          badge_color?: string
          badge_icon?: string | null
          coin_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rarity_level?: string
          trigger_condition: Json
        }
        Update: {
          achievement_type?: string
          badge_color?: string
          badge_icon?: string | null
          coin_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rarity_level?: string
          trigger_condition?: Json
        }
        Relationships: []
      }
      activity_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          target_id: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string
          id: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_type: string
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      alarm_completions: {
        Row: {
          alarm_id: string
          completed_at: string
          created_at: string
          id: string
          push_ups_completed: number
          time_to_complete: number
          user_id: string
        }
        Insert: {
          alarm_id: string
          completed_at?: string
          created_at?: string
          id?: string
          push_ups_completed: number
          time_to_complete: number
          user_id: string
        }
        Update: {
          alarm_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          push_ups_completed?: number
          time_to_complete?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alarm_completions_alarm_id_fkey"
            columns: ["alarm_id"]
            isOneToOne: false
            referencedRelation: "fitness_alarms"
            referencedColumns: ["id"]
          },
        ]
      }
      alcohol_entries: {
        Row: {
          alcohol_content: number | null
          created_at: string
          drink_type: string
          id: string
          logged_date: string
          logged_time: string | null
          notes: string | null
          photo_storage_path: string | null
          photo_url: string | null
          quantity: number
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alcohol_content?: number | null
          created_at?: string
          drink_type: string
          id?: string
          logged_date?: string
          logged_time?: string | null
          notes?: string | null
          photo_storage_path?: string | null
          photo_url?: string | null
          quantity?: number
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alcohol_content?: number | null
          created_at?: string
          drink_type?: string
          id?: string
          logged_date?: string
          logged_time?: string | null
          notes?: string | null
          photo_storage_path?: string | null
          photo_url?: string | null
          quantity?: number
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      avatar_achievements: {
        Row: {
          achievement_data: Json
          achievement_type: string
          avatar_reward: Json | null
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_data: Json
          achievement_type: string
          avatar_reward?: Json | null
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json
          achievement_type?: string
          avatar_reward?: Json | null
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      avatar_nfts: {
        Row: {
          avatar_config: Json
          blockchain_address: string | null
          created_at: string
          id: string
          minted_at: string | null
          nft_metadata: Json
          rarity_tier: string
          serial_number: number | null
          token_id: string | null
          user_id: string
        }
        Insert: {
          avatar_config: Json
          blockchain_address?: string | null
          created_at?: string
          id?: string
          minted_at?: string | null
          nft_metadata: Json
          rarity_tier?: string
          serial_number?: number | null
          token_id?: string | null
          user_id: string
        }
        Update: {
          avatar_config?: Json
          blockchain_address?: string | null
          created_at?: string
          id?: string
          minted_at?: string | null
          nft_metadata?: Json
          rarity_tier?: string
          serial_number?: number | null
          token_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      avatar_power_ups: {
        Row: {
          app_functionality: Json
          coin_cost: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          power_type: string
          rarity_tier: string
          token_cost: number | null
          unlock_condition: Json | null
          visual_component: string | null
        }
        Insert: {
          app_functionality: Json
          coin_cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          power_type: string
          rarity_tier?: string
          token_cost?: number | null
          unlock_condition?: Json | null
          visual_component?: string | null
        }
        Update: {
          app_functionality?: Json
          coin_cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          power_type?: string
          rarity_tier?: string
          token_cost?: number | null
          unlock_condition?: Json | null
          visual_component?: string | null
        }
        Relationships: []
      }
      avatars: {
        Row: {
          accent_hex: string | null
          gender: string | null
          id: string
          image_url: string
          is_active: boolean
          mini_image_url: string
          name: string
          sort_order: number
        }
        Insert: {
          accent_hex?: string | null
          gender?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          mini_image_url: string
          name: string
          sort_order?: number
        }
        Update: {
          accent_hex?: string | null
          gender?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          mini_image_url?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      biometric_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          data_source: string[] | null
          expires_at: string | null
          id: string
          insight_text: string
          insight_type: string
          is_actionable: boolean | null
          is_read: boolean | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          data_source?: string[] | null
          expires_at?: string | null
          id?: string
          insight_text: string
          insight_type: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          data_source?: string[] | null
          expires_at?: string | null
          id?: string
          insight_text?: string
          insight_type?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      body_scan_images: {
        Row: {
          created_at: string
          id: string
          landmarks: Json
          mask_downsampled: string | null
          scan_id: string
          view: string
          width_profile: Json
        }
        Insert: {
          created_at?: string
          id?: string
          landmarks?: Json
          mask_downsampled?: string | null
          scan_id: string
          view: string
          width_profile?: Json
        }
        Update: {
          created_at?: string
          id?: string
          landmarks?: Json
          mask_downsampled?: string | null
          scan_id?: string
          view?: string
          width_profile?: Json
        }
        Relationships: [
          {
            foreignKeyName: "body_scan_images_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "body_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      body_scan_metrics: {
        Row: {
          created_at: string
          estimates: Json
          id: string
          scan_id: string
        }
        Insert: {
          created_at?: string
          estimates: Json
          id?: string
          scan_id: string
        }
        Update: {
          created_at?: string
          estimates?: Json
          id?: string
          scan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_scan_metrics_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "body_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      body_scans: {
        Row: {
          back_path: string | null
          created_at: string
          error: string | null
          front_path: string | null
          height_cm: number | null
          id: string
          left_path: string | null
          metrics: Json | null
          notes: string | null
          right_path: string | null
          sex: string | null
          status: Database["public"]["Enums"]["scan_status"]
          summary: Json | null
          updated_at: string
          user_id: string
          weight_known_kg: number | null
        }
        Insert: {
          back_path?: string | null
          created_at?: string
          error?: string | null
          front_path?: string | null
          height_cm?: number | null
          id?: string
          left_path?: string | null
          metrics?: Json | null
          notes?: string | null
          right_path?: string | null
          sex?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
          summary?: Json | null
          updated_at?: string
          user_id: string
          weight_known_kg?: number | null
        }
        Update: {
          back_path?: string | null
          created_at?: string
          error?: string | null
          front_path?: string | null
          height_cm?: number | null
          id?: string
          left_path?: string | null
          metrics?: Json | null
          notes?: string | null
          right_path?: string | null
          sex?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
          summary?: Json | null
          updated_at?: string
          user_id?: string
          weight_known_kg?: number | null
        }
        Relationships: []
      }
      cardio_blocks: {
        Row: {
          actual_duration: number | null
          actual_hr_avg: number | null
          block_order: number
          block_type: string
          created_at: string
          duration_min: number
          id: string
          machine_settings: Json
          session_id: string
          target_hrr_max: number
          target_hrr_min: number
        }
        Insert: {
          actual_duration?: number | null
          actual_hr_avg?: number | null
          block_order: number
          block_type: string
          created_at?: string
          duration_min: number
          id?: string
          machine_settings?: Json
          session_id: string
          target_hrr_max: number
          target_hrr_min: number
        }
        Update: {
          actual_duration?: number | null
          actual_hr_avg?: number | null
          block_order?: number
          block_type?: string
          created_at?: string
          duration_min?: number
          id?: string
          machine_settings?: Json
          session_id?: string
          target_hrr_max?: number
          target_hrr_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "cardio_blocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cardio_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cardio_sessions: {
        Row: {
          actual_duration: number | null
          completed_at: string | null
          created_at: string
          goal: string
          id: string
          machine_type: string
          planned_duration: number
          status: string
          target_load: number
          target_zone: string
          user_id: string
        }
        Insert: {
          actual_duration?: number | null
          completed_at?: string | null
          created_at?: string
          goal: string
          id?: string
          machine_type: string
          planned_duration?: number
          status?: string
          target_load?: number
          target_zone: string
          user_id: string
        }
        Update: {
          actual_duration?: number | null
          completed_at?: string | null
          created_at?: string
          goal?: string
          id?: string
          machine_type?: string
          planned_duration?: number
          status?: string
          target_load?: number
          target_zone?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          bonus_coin_reward: number | null
          challenge_type: string
          coin_reward: number
          created_at: string
          description: string | null
          difficulty_level: string
          id: string
          is_active: boolean
          is_recurring: boolean
          name: string
          target_value: number
          time_limit_days: number | null
          updated_at: string
        }
        Insert: {
          bonus_coin_reward?: number | null
          challenge_type: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty_level?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          name: string
          target_value: number
          time_limit_days?: number | null
          updated_at?: string
        }
        Update: {
          bonus_coin_reward?: number | null
          challenge_type?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty_level?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          name?: string
          target_value?: number
          time_limit_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      corrective_exercises: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          exercise_name: string
          id: string
          instructions: string | null
          is_active: boolean | null
          muscle_groups: string[] | null
          reps: number | null
          sets: number | null
          target_issue: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          exercise_name: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          muscle_groups?: string[] | null
          reps?: number | null
          sets?: number | null
          target_issue: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          exercise_name?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          muscle_groups?: string[] | null
          reps?: number | null
          sets?: number | null
          target_issue?: string
          video_url?: string | null
        }
        Relationships: []
      }
      cycle_tracking: {
        Row: {
          average_cycle_length: number
          average_period_length: number
          created_at: string
          id: string
          is_enabled: boolean
          last_period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_cycle_length?: number
          average_period_length?: number
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_cycle_length?: number
          average_period_length?: number
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_activity_summary: {
        Row: {
          activity_date: string
          activity_score: number | null
          created_at: string
          goals_achieved: number | null
          id: string
          meals_logged: number | null
          step_count: number | null
          total_calories_burned: number | null
          total_calories_consumed: number | null
          total_exercises: number | null
          total_workout_minutes: number | null
          updated_at: string
          user_id: string
          workouts_completed: number | null
        }
        Insert: {
          activity_date?: string
          activity_score?: number | null
          created_at?: string
          goals_achieved?: number | null
          id?: string
          meals_logged?: number | null
          step_count?: number | null
          total_calories_burned?: number | null
          total_calories_consumed?: number | null
          total_exercises?: number | null
          total_workout_minutes?: number | null
          updated_at?: string
          user_id: string
          workouts_completed?: number | null
        }
        Update: {
          activity_date?: string
          activity_score?: number | null
          created_at?: string
          goals_achieved?: number | null
          id?: string
          meals_logged?: number | null
          step_count?: number | null
          total_calories_burned?: number | null
          total_calories_consumed?: number | null
          total_exercises?: number | null
          total_workout_minutes?: number | null
          updated_at?: string
          user_id?: string
          workouts_completed?: number | null
        }
        Relationships: []
      }
      daily_nutrition_summary: {
        Row: {
          created_at: string
          id: string
          meals_count: number
          metabolism_readings_count: number
          summary_date: string
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meals_count?: number
          metabolism_readings_count?: number
          summary_date: string
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meals_count?: number
          metabolism_readings_count?: number
          summary_date?: string
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_steps: {
        Row: {
          active_minutes: number | null
          calories_burned: number | null
          created_at: string
          data_source: string | null
          distance_km: number | null
          id: string
          recorded_date: string
          step_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string
          data_source?: string | null
          distance_km?: number | null
          id?: string
          recorded_date?: string
          step_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string
          data_source?: string | null
          distance_km?: number | null
          id?: string
          recorded_date?: string
          step_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_database: {
        Row: {
          calorie_burn_rate: number | null
          created_at: string
          difficulty_level: string
          equipment_category: string
          exercise_name: string
          exercise_type: string
          form_instructions: string | null
          id: string
          is_active: boolean
          machine_name: string | null
          muscle_groups: string[]
          progression_notes: string | null
        }
        Insert: {
          calorie_burn_rate?: number | null
          created_at?: string
          difficulty_level: string
          equipment_category: string
          exercise_name: string
          exercise_type: string
          form_instructions?: string | null
          id?: string
          is_active?: boolean
          machine_name?: string | null
          muscle_groups: string[]
          progression_notes?: string | null
        }
        Update: {
          calorie_burn_rate?: number | null
          created_at?: string
          difficulty_level?: string
          equipment_category?: string
          exercise_name?: string
          exercise_type?: string
          form_instructions?: string | null
          id?: string
          is_active?: boolean
          machine_name?: string | null
          muscle_groups?: string[]
          progression_notes?: string | null
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          actual_rest_seconds: number | null
          completed_at: string
          created_at: string
          exercise_name: string
          id: string
          machine_name: string | null
          notes: string | null
          reps_completed: number
          sets_completed: number
          user_id: string
          weight_used: number | null
          workout_log_id: string
        }
        Insert: {
          actual_rest_seconds?: number | null
          completed_at?: string
          created_at?: string
          exercise_name: string
          id?: string
          machine_name?: string | null
          notes?: string | null
          reps_completed?: number
          sets_completed?: number
          user_id: string
          weight_used?: number | null
          workout_log_id: string
        }
        Update: {
          actual_rest_seconds?: number | null
          completed_at?: string
          created_at?: string
          exercise_name?: string
          id?: string
          machine_name?: string | null
          notes?: string | null
          reps_completed?: number
          sets_completed?: number
          user_id?: string
          weight_used?: number | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_rest_preferences: {
        Row: {
          avg_actual_rest_seconds: number
          created_at: string
          exercise_name: string
          id: string
          last_updated: string
          machine_name: string
          preferred_rest_seconds: number
          total_samples: number
          user_id: string
        }
        Insert: {
          avg_actual_rest_seconds?: number
          created_at?: string
          exercise_name: string
          id?: string
          last_updated?: string
          machine_name: string
          preferred_rest_seconds?: number
          total_samples?: number
          user_id: string
        }
        Update: {
          avg_actual_rest_seconds?: number
          created_at?: string
          exercise_name?: string
          id?: string
          last_updated?: string
          machine_name?: string
          preferred_rest_seconds?: number
          total_samples?: number
          user_id?: string
        }
        Relationships: []
      }
      exercise_sets: {
        Row: {
          completed_at: string
          created_at: string
          exercise_log_id: string
          id: string
          notes: string | null
          perceived_effort: number | null
          reps_completed: number
          rest_duration_seconds: number | null
          set_number: number
          user_id: string
          weight_used: number | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          exercise_log_id: string
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          reps_completed?: number
          rest_duration_seconds?: number | null
          set_number: number
          user_id: string
          weight_used?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          exercise_log_id?: string
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          reps_completed?: number
          rest_duration_seconds?: number | null
          set_number?: number
          user_id?: string
          weight_used?: number | null
        }
        Relationships: []
      }
      fitness_alarms: {
        Row: {
          alarm_sound: string
          alarm_time: string
          created_at: string
          days_of_week: Json
          enabled: boolean
          id: string
          label: string | null
          push_up_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alarm_sound?: string
          alarm_time: string
          created_at?: string
          days_of_week?: Json
          enabled?: boolean
          id?: string
          label?: string | null
          push_up_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alarm_sound?: string
          alarm_time?: string
          created_at?: string
          days_of_week?: Json
          enabled?: boolean
          id?: string
          label?: string | null
          push_up_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_analysis_cache: {
        Row: {
          analysis_result: Json
          cache_hits: number | null
          created_at: string
          expires_at: string
          id: string
          image_hash: string
          meal_type: string | null
          user_id: string | null
        }
        Insert: {
          analysis_result: Json
          cache_hits?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          image_hash: string
          meal_type?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_result?: Json
          cache_hits?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          image_hash?: string
          meal_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          ai_analyzed: boolean
          analysis_confidence: number | null
          created_at: string
          food_items: Json
          grade_score: number | null
          health_grade: string | null
          id: string
          logged_date: string
          meal_type: string
          notes: string | null
          photo_storage_path: string | null
          photo_storage_paths: string[] | null
          photo_url: string | null
          photo_urls: string[] | null
          thumbnail_url: string | null
          thumbnail_urls: string[] | null
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          updated_at: string
          user_confirmed: boolean
          user_id: string
        }
        Insert: {
          ai_analyzed?: boolean
          analysis_confidence?: number | null
          created_at?: string
          food_items: Json
          grade_score?: number | null
          health_grade?: string | null
          id?: string
          logged_date?: string
          meal_type: string
          notes?: string | null
          photo_storage_path?: string | null
          photo_storage_paths?: string[] | null
          photo_url?: string | null
          photo_urls?: string[] | null
          thumbnail_url?: string | null
          thumbnail_urls?: string[] | null
          total_calories: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_confirmed?: boolean
          user_id: string
        }
        Update: {
          ai_analyzed?: boolean
          analysis_confidence?: number | null
          created_at?: string
          food_items?: Json
          grade_score?: number | null
          health_grade?: string | null
          id?: string
          logged_date?: string
          meal_type?: string
          notes?: string | null
          photo_storage_path?: string | null
          photo_storage_paths?: string[] | null
          photo_url?: string | null
          photo_urls?: string[] | null
          thumbnail_url?: string | null
          thumbnail_urls?: string[] | null
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_confirmed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      food_photos: {
        Row: {
          created_at: string | null
          file_size: number | null
          food_entry_id: string | null
          id: string
          photo_type: string | null
          photo_url: string
          storage_path: string
          thumbnail_url: string | null
          upload_timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          food_entry_id?: string | null
          id?: string
          photo_type?: string | null
          photo_url: string
          storage_path: string
          thumbnail_url?: string | null
          upload_timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          food_entry_id?: string | null
          id?: string
          photo_type?: string | null
          photo_url?: string
          storage_path?: string
          thumbnail_url?: string | null
          upload_timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_photos_food_entry_id_fkey"
            columns: ["food_entry_id"]
            isOneToOne: false
            referencedRelation: "food_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      form_analysis_logs: {
        Row: {
          avg_form_score: number | null
          created_at: string | null
          exercise_log_id: string | null
          exercise_name: string
          flagged_patterns: string[] | null
          form_issues: Json | null
          id: string
          imbalance_direction: string | null
          imbalance_percentage: number | null
          injury_risk_level: string | null
          joint_warnings: Json | null
          left_side_score: number | null
          muscle_group: string | null
          right_side_score: number | null
          user_id: string
        }
        Insert: {
          avg_form_score?: number | null
          created_at?: string | null
          exercise_log_id?: string | null
          exercise_name: string
          flagged_patterns?: string[] | null
          form_issues?: Json | null
          id?: string
          imbalance_direction?: string | null
          imbalance_percentage?: number | null
          injury_risk_level?: string | null
          joint_warnings?: Json | null
          left_side_score?: number | null
          muscle_group?: string | null
          right_side_score?: number | null
          user_id: string
        }
        Update: {
          avg_form_score?: number | null
          created_at?: string | null
          exercise_log_id?: string | null
          exercise_name?: string
          flagged_patterns?: string[] | null
          form_issues?: Json | null
          id?: string
          imbalance_direction?: string | null
          imbalance_percentage?: number | null
          injury_risk_level?: string | null
          joint_warnings?: Json | null
          left_side_score?: number | null
          muscle_group?: string | null
          right_side_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_analysis_logs_exercise_log_id_fkey"
            columns: ["exercise_log_id"]
            isOneToOne: false
            referencedRelation: "exercise_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          last_activity: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_activity?: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_activity?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      gyms: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      heart_rate_data: {
        Row: {
          created_at: string
          heart_rate_bpm: number
          hrr_percent: number | null
          id: string
          machine_settings: Json | null
          session_id: string
          target_hrr_percent: number | null
          timestamp_offset: number
        }
        Insert: {
          created_at?: string
          heart_rate_bpm: number
          hrr_percent?: number | null
          id?: string
          machine_settings?: Json | null
          session_id: string
          target_hrr_percent?: number | null
          timestamp_offset: number
        }
        Update: {
          created_at?: string
          heart_rate_bpm?: number
          hrr_percent?: number | null
          id?: string
          machine_settings?: Json | null
          session_id?: string
          target_hrr_percent?: number | null
          timestamp_offset?: number
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cardio_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      loot_boxes: {
        Row: {
          created_at: string
          description: string | null
          guaranteed_rewards: Json
          id: string
          is_active: boolean
          name: string
          possible_rewards: Json
          rarity_tier: string
          tap_token_cost: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          guaranteed_rewards?: Json
          id?: string
          is_active?: boolean
          name: string
          possible_rewards?: Json
          rarity_tier?: string
          tap_token_cost: number
        }
        Update: {
          created_at?: string
          description?: string | null
          guaranteed_rewards?: Json
          id?: string
          is_active?: boolean
          name?: string
          possible_rewards?: Json
          rarity_tier?: string
          tap_token_cost?: number
        }
        Relationships: []
      }
      machine_calibrations: {
        Row: {
          accuracy_score: number
          calibration_constant: number
          created_at: string
          gym_id: string | null
          id: string
          last_updated: string
          machine_id: string
          machine_type: string
          session_count: number
        }
        Insert: {
          accuracy_score?: number
          calibration_constant?: number
          created_at?: string
          gym_id?: string | null
          id?: string
          last_updated?: string
          machine_id: string
          machine_type: string
          session_count?: number
        }
        Update: {
          accuracy_score?: number
          calibration_constant?: number
          created_at?: string
          gym_id?: string | null
          id?: string
          last_updated?: string
          machine_id?: string
          machine_type?: string
          session_count?: number
        }
        Relationships: []
      }
      machine_recognition_feedback: {
        Row: {
          ai_confidence: number
          corrected_machine_id: string
          created_at: string
          detected_machine_id: string
          id: string
          image_thumbnail: string | null
          user_id: string | null
        }
        Insert: {
          ai_confidence: number
          corrected_machine_id: string
          created_at?: string
          detected_machine_id: string
          id?: string
          image_thumbnail?: string | null
          user_id?: string | null
        }
        Update: {
          ai_confidence?: number
          corrected_machine_id?: string
          created_at?: string
          detected_machine_id?: string
          id?: string
          image_thumbnail?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          image_url: string | null
          location: string | null
          name: string
          type: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          type: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      meal_shares: {
        Row: {
          activity_feed_id: string
          alcohol_entry_id: string | null
          created_at: string
          food_entry_id: string | null
          id: string
          is_public: boolean
          user_id: string
        }
        Insert: {
          activity_feed_id: string
          alcohol_entry_id?: string | null
          created_at?: string
          food_entry_id?: string | null
          id?: string
          is_public?: boolean
          user_id: string
        }
        Update: {
          activity_feed_id?: string
          alcohol_entry_id?: string | null
          created_at?: string
          food_entry_id?: string | null
          id?: string
          is_public?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_shares_activity_feed_id_fkey"
            columns: ["activity_feed_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_shares_alcohol_entry_id_fkey"
            columns: ["alcohol_entry_id"]
            isOneToOne: false
            referencedRelation: "alcohol_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_shares_food_entry_id_fkey"
            columns: ["food_entry_id"]
            isOneToOne: false
            referencedRelation: "food_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      metabolism_readings: {
        Row: {
          created_at: string
          device_source: string | null
          id: string
          reading_type: string
          reading_value: number | null
          recommendations: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_source?: string | null
          id?: string
          reading_type: string
          reading_value?: number | null
          recommendations?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_source?: string | null
          id?: string
          reading_type?: string
          reading_value?: number | null
          recommendations?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_workout_progress: {
        Row: {
          created_at: string
          current_week: number
          id: string
          nutrition_compliance: Json | null
          performance_metrics: Json | null
          progress_notes: string | null
          updated_at: string
          user_id: string
          weekly_adaptations: Json | null
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          current_week?: number
          id?: string
          nutrition_compliance?: Json | null
          performance_metrics?: Json | null
          progress_notes?: string | null
          updated_at?: string
          user_id: string
          weekly_adaptations?: Json | null
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          current_week?: number
          id?: string
          nutrition_compliance?: Json | null
          performance_metrics?: Json | null
          progress_notes?: string | null
          updated_at?: string
          user_id?: string
          weekly_adaptations?: Json | null
          workout_plan_id?: string
        }
        Relationships: []
      }
      monthly_workout_templates: {
        Row: {
          created_at: string
          fitness_level: string
          id: string
          is_active: boolean
          primary_goal: string
          template_data: Json
          updated_at: string
          week_structure: Json
        }
        Insert: {
          created_at?: string
          fitness_level: string
          id?: string
          is_active?: boolean
          primary_goal: string
          template_data?: Json
          updated_at?: string
          week_structure?: Json
        }
        Update: {
          created_at?: string
          fitness_level?: string
          id?: string
          is_active?: boolean
          primary_goal?: string
          template_data?: Json
          updated_at?: string
          week_structure?: Json
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string | null
          energy_level: number | null
          entry_context: string | null
          entry_date: string
          entry_time: string | null
          heart_rate_bpm: number | null
          id: string
          mood_score: number | null
          mood_tags: string[] | null
          motivation_level: number | null
          notes: string | null
          sleep_hours_last_night: number | null
          sleep_quality_last_night: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          energy_level?: number | null
          entry_context?: string | null
          entry_date?: string
          entry_time?: string | null
          heart_rate_bpm?: number | null
          id?: string
          mood_score?: number | null
          mood_tags?: string[] | null
          motivation_level?: number | null
          notes?: string | null
          sleep_hours_last_night?: number | null
          sleep_quality_last_night?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          energy_level?: number | null
          entry_context?: string | null
          entry_date?: string
          entry_time?: string | null
          heart_rate_bpm?: number | null
          id?: string
          mood_score?: number | null
          mood_tags?: string[] | null
          motivation_level?: number | null
          notes?: string | null
          sleep_hours_last_night?: number | null
          sleep_quality_last_night?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      muscle_imbalance_tracking: {
        Row: {
          avg_left_strength: number | null
          avg_right_strength: number | null
          created_at: string | null
          data_points_count: number | null
          dominant_side: string | null
          id: string
          imbalance_percentage: number | null
          injury_risk_score: number | null
          last_updated: string | null
          muscle_group: string
          recommended_focus: string | null
          trend: string | null
          user_id: string
        }
        Insert: {
          avg_left_strength?: number | null
          avg_right_strength?: number | null
          created_at?: string | null
          data_points_count?: number | null
          dominant_side?: string | null
          id?: string
          imbalance_percentage?: number | null
          injury_risk_score?: number | null
          last_updated?: string | null
          muscle_group: string
          recommended_focus?: string | null
          trend?: string | null
          user_id: string
        }
        Update: {
          avg_left_strength?: number | null
          avg_right_strength?: number | null
          created_at?: string | null
          data_points_count?: number | null
          dominant_side?: string | null
          id?: string
          imbalance_percentage?: number | null
          injury_risk_score?: number | null
          last_updated?: string | null
          muscle_group?: string
          recommended_focus?: string | null
          trend?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          notification_data: Json
          notification_type: string
          read: boolean
          reference_id: string | null
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          notification_data?: Json
          notification_type: string
          read?: boolean
          reference_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          notification_data?: Json
          notification_type?: string
          read?: boolean
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_challenge_participants: {
        Row: {
          average_grade_score: number | null
          challenge_id: string
          coins_earned: number | null
          current_streak: number | null
          id: string
          joined_at: string
          last_updated: string
          meals_above_target: number | null
          rank: number | null
          total_health_score: number | null
          total_meals: number | null
          user_id: string
        }
        Insert: {
          average_grade_score?: number | null
          challenge_id: string
          coins_earned?: number | null
          current_streak?: number | null
          id?: string
          joined_at?: string
          last_updated?: string
          meals_above_target?: number | null
          rank?: number | null
          total_health_score?: number | null
          total_meals?: number | null
          user_id: string
        }
        Update: {
          average_grade_score?: number | null
          challenge_id?: string
          coins_earned?: number | null
          current_streak?: number | null
          id?: string
          joined_at?: string
          last_updated?: string
          meals_above_target?: number | null
          rank?: number | null
          total_health_score?: number | null
          total_meals?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "nutrition_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_challenges: {
        Row: {
          challenge_type: string
          coin_reward: number
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          min_meals_required: number | null
          name: string
          start_date: string
          target_metric: string
          updated_at: string
        }
        Insert: {
          challenge_type: string
          coin_reward?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          min_meals_required?: number | null
          name: string
          start_date: string
          target_metric: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          coin_reward?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          min_meals_required?: number | null
          name?: string
          start_date?: string
          target_metric?: string
          updated_at?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          carbs_grams: number
          created_at: string
          daily_calories: number
          fat_grams: number
          goal_type: string
          id: string
          is_active: boolean
          protein_grams: number
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_grams: number
          created_at?: string
          daily_calories: number
          fat_grams: number
          goal_type: string
          id?: string
          is_active?: boolean
          protein_grams: number
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_grams?: number
          created_at?: string
          daily_calories?: number
          fat_grams?: number
          goal_type?: string
          id?: string
          is_active?: boolean
          protein_grams?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          celebrated: boolean | null
          created_at: string
          exercise_name: string
          id: string
          improvement_percentage: number | null
          machine_name: string
          previous_record_weight: number | null
          reps: number
          sets: number
          user_id: string
          weight_lbs: number
        }
        Insert: {
          achieved_at?: string
          celebrated?: boolean | null
          created_at?: string
          exercise_name: string
          id?: string
          improvement_percentage?: number | null
          machine_name: string
          previous_record_weight?: number | null
          reps: number
          sets: number
          user_id: string
          weight_lbs: number
        }
        Update: {
          achieved_at?: string
          celebrated?: boolean | null
          created_at?: string
          exercise_name?: string
          id?: string
          improvement_percentage?: number | null
          machine_name?: string
          previous_record_weight?: number | null
          reps?: number
          sets?: number
          user_id?: string
          weight_lbs?: number
        }
        Relationships: []
      }
      photo_upload_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          photo_count: number | null
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          photo_count?: number | null
          success: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          photo_count?: number | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      power_level_history: {
        Row: {
          created_at: string
          date: string
          factors: Json
          id: string
          score: number
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          factors?: Json
          id?: string
          score: number
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          factors?: Json
          id?: string
          score?: number
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      pr_history: {
        Row: {
          achieved_at: string
          coins_awarded: number | null
          created_at: string
          exercise_name: string
          id: string
          is_current_pr: boolean | null
          machine_name: string
          reps: number
          sets: number
          user_id: string
          weight_lbs: number
        }
        Insert: {
          achieved_at?: string
          coins_awarded?: number | null
          created_at?: string
          exercise_name: string
          id?: string
          is_current_pr?: boolean | null
          machine_name: string
          reps: number
          sets: number
          user_id: string
          weight_lbs: number
        }
        Update: {
          achieved_at?: string
          coins_awarded?: number | null
          created_at?: string
          exercise_name?: string
          id?: string
          is_current_pr?: boolean | null
          machine_name?: string
          reps?: number
          sets?: number
          user_id?: string
          weight_lbs?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_data: Json | null
          avatar_id: string | null
          avatar_url: string | null
          bio: string | null
          calibration_completed: boolean | null
          created_at: string
          current_max_weights: Json | null
          diet_type: string | null
          email: string | null
          experience_level: string | null
          ftp_watts: number | null
          full_name: string | null
          gender: string | null
          gym_id: string | null
          health_conditions: string[] | null
          height_cm: number | null
          hr_max: number | null
          hr_rest: number | null
          id: string
          is_profile_public: boolean | null
          onboarding_completed: boolean | null
          preferred_equipment_type: string | null
          previous_injuries: string[] | null
          primary_goal: string | null
          share_workout_stats: boolean | null
          tap_coins_balance: number
          tap_tokens_balance: number
          target_carbs_grams: number | null
          target_daily_calories: number | null
          target_fat_grams: number | null
          target_protein_grams: number | null
          target_sleep_hours: number | null
          unit_preference: string | null
          username: string | null
          vo2max_velocity: number | null
          weight_kg: number | null
          workout_visibility: string | null
        }
        Insert: {
          age?: number | null
          avatar_data?: Json | null
          avatar_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          calibration_completed?: boolean | null
          created_at?: string
          current_max_weights?: Json | null
          diet_type?: string | null
          email?: string | null
          experience_level?: string | null
          ftp_watts?: number | null
          full_name?: string | null
          gender?: string | null
          gym_id?: string | null
          health_conditions?: string[] | null
          height_cm?: number | null
          hr_max?: number | null
          hr_rest?: number | null
          id: string
          is_profile_public?: boolean | null
          onboarding_completed?: boolean | null
          preferred_equipment_type?: string | null
          previous_injuries?: string[] | null
          primary_goal?: string | null
          share_workout_stats?: boolean | null
          tap_coins_balance?: number
          tap_tokens_balance?: number
          target_carbs_grams?: number | null
          target_daily_calories?: number | null
          target_fat_grams?: number | null
          target_protein_grams?: number | null
          target_sleep_hours?: number | null
          unit_preference?: string | null
          username?: string | null
          vo2max_velocity?: number | null
          weight_kg?: number | null
          workout_visibility?: string | null
        }
        Update: {
          age?: number | null
          avatar_data?: Json | null
          avatar_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          calibration_completed?: boolean | null
          created_at?: string
          current_max_weights?: Json | null
          diet_type?: string | null
          email?: string | null
          experience_level?: string | null
          ftp_watts?: number | null
          full_name?: string | null
          gender?: string | null
          gym_id?: string | null
          health_conditions?: string[] | null
          height_cm?: number | null
          hr_max?: number | null
          hr_rest?: number | null
          id?: string
          is_profile_public?: boolean | null
          onboarding_completed?: boolean | null
          preferred_equipment_type?: string | null
          previous_injuries?: string[] | null
          primary_goal?: string | null
          share_workout_stats?: boolean | null
          tap_coins_balance?: number
          tap_tokens_balance?: number
          target_carbs_grams?: number | null
          target_daily_calories?: number | null
          target_fat_grams?: number | null
          target_protein_grams?: number | null
          target_sleep_hours?: number | null
          unit_preference?: string | null
          username?: string | null
          vo2max_velocity?: number | null
          weight_kg?: number | null
          workout_visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      ride_sessions: {
        Row: {
          audio_cues_enabled: boolean | null
          auto_pause_enabled: boolean | null
          avg_cadence: number | null
          avg_heart_rate: number | null
          avg_speed_kmh: number | null
          calories: number | null
          created_at: string | null
          elapsed_time_s: number
          elevation_gain_m: number | null
          elevation_loss_m: number | null
          ended_at: string | null
          hr_samples: Json | null
          id: string
          max_heart_rate: number | null
          max_speed_kmh: number | null
          moving_time_s: number
          notes: string | null
          points: Json | null
          ride_type: string | null
          source: string
          splits: Json | null
          started_at: string
          status: string
          target_hr_zone: Json | null
          time_in_zone_s: number | null
          total_distance_m: number
          training_mode: string | null
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_cues_enabled?: boolean | null
          auto_pause_enabled?: boolean | null
          avg_cadence?: number | null
          avg_heart_rate?: number | null
          avg_speed_kmh?: number | null
          calories?: number | null
          created_at?: string | null
          elapsed_time_s?: number
          elevation_gain_m?: number | null
          elevation_loss_m?: number | null
          ended_at?: string | null
          hr_samples?: Json | null
          id: string
          max_heart_rate?: number | null
          max_speed_kmh?: number | null
          moving_time_s?: number
          notes?: string | null
          points?: Json | null
          ride_type?: string | null
          source?: string
          splits?: Json | null
          started_at: string
          status: string
          target_hr_zone?: Json | null
          time_in_zone_s?: number | null
          total_distance_m?: number
          training_mode?: string | null
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_cues_enabled?: boolean | null
          auto_pause_enabled?: boolean | null
          avg_cadence?: number | null
          avg_heart_rate?: number | null
          avg_speed_kmh?: number | null
          calories?: number | null
          created_at?: string | null
          elapsed_time_s?: number
          elevation_gain_m?: number | null
          elevation_loss_m?: number | null
          ended_at?: string | null
          hr_samples?: Json | null
          id?: string
          max_heart_rate?: number | null
          max_speed_kmh?: number | null
          moving_time_s?: number
          notes?: string | null
          points?: Json | null
          ride_type?: string | null
          source?: string
          splits?: Json | null
          started_at?: string
          status?: string
          target_hr_zone?: Json | null
          time_in_zone_s?: number | null
          total_distance_m?: number
          training_mode?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      run_sessions: {
        Row: {
          avg_heart_rate: number | null
          avg_pace_sec_per_km: number
          calories: number
          created_at: string
          elapsed_time_s: number
          elevation_gain_m: number | null
          elevation_loss_m: number | null
          ended_at: string | null
          hr_samples: Json | null
          id: string
          max_heart_rate: number | null
          moving_time_s: number
          notes: string | null
          route_points: Json | null
          source: string
          splits: Json | null
          started_at: string
          status: string
          target_hr_zone: Json | null
          time_in_zone_s: number | null
          total_distance_m: number
          training_mode: string | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_heart_rate?: number | null
          avg_pace_sec_per_km?: number
          calories?: number
          created_at?: string
          elapsed_time_s?: number
          elevation_gain_m?: number | null
          elevation_loss_m?: number | null
          ended_at?: string | null
          hr_samples?: Json | null
          id?: string
          max_heart_rate?: number | null
          moving_time_s?: number
          notes?: string | null
          route_points?: Json | null
          source?: string
          splits?: Json | null
          started_at: string
          status: string
          target_hr_zone?: Json | null
          time_in_zone_s?: number | null
          total_distance_m?: number
          training_mode?: string | null
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_heart_rate?: number | null
          avg_pace_sec_per_km?: number
          calories?: number
          created_at?: string
          elapsed_time_s?: number
          elevation_gain_m?: number | null
          elevation_loss_m?: number | null
          ended_at?: string | null
          hr_samples?: Json | null
          id?: string
          max_heart_rate?: number | null
          moving_time_s?: number
          notes?: string | null
          route_points?: Json | null
          source?: string
          splits?: Json | null
          started_at?: string
          status?: string
          target_hr_zone?: Json | null
          time_in_zone_s?: number | null
          total_distance_m?: number
          training_mode?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_menu_items: {
        Row: {
          calories: number | null
          created_at: string
          description: string | null
          dietary_tags: string[] | null
          health_score: number | null
          id: string
          item_name: string
          macros: Json | null
          notes: string | null
          price: number | null
          restaurant_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          health_score?: number | null
          id?: string
          item_name: string
          macros?: Json | null
          notes?: string | null
          price?: number | null
          restaurant_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          health_score?: number | null
          id?: string
          item_name?: string
          macros?: Json | null
          notes?: string | null
          price?: number | null
          restaurant_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_workouts: {
        Row: {
          completed_at: string | null
          created_at: string
          estimated_duration: number
          id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          target_muscle_group: string
          user_id: string
          workout_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          estimated_duration: number
          id?: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          target_muscle_group: string
          user_id: string
          workout_plan_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          estimated_duration?: number
          id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          target_muscle_group?: string
          user_id?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_details: Json
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_recordings: {
        Row: {
          avg_level: number | null
          avg_speed: number | null
          cadence_avg: number | null
          calories_burned: number
          created_at: string
          distance: number | null
          duration_min: number
          elevation_gain: number | null
          hr_avg: number
          hr_max: number
          id: string
          rpe: number
          session_id: string
          trimp_score: number
          user_id: string
          watts_avg: number | null
          z1_minutes: number
          z2_minutes: number
          z3_minutes: number
          z4_minutes: number
          z5_minutes: number
        }
        Insert: {
          avg_level?: number | null
          avg_speed?: number | null
          cadence_avg?: number | null
          calories_burned?: number
          created_at?: string
          distance?: number | null
          duration_min: number
          elevation_gain?: number | null
          hr_avg: number
          hr_max: number
          id?: string
          rpe: number
          session_id: string
          trimp_score?: number
          user_id: string
          watts_avg?: number | null
          z1_minutes?: number
          z2_minutes?: number
          z3_minutes?: number
          z4_minutes?: number
          z5_minutes?: number
        }
        Update: {
          avg_level?: number | null
          avg_speed?: number | null
          cadence_avg?: number | null
          calories_burned?: number
          created_at?: string
          distance?: number | null
          duration_min?: number
          elevation_gain?: number | null
          hr_avg?: number
          hr_max?: number
          id?: string
          rpe?: number
          session_id?: string
          trimp_score?: number
          user_id?: string
          watts_avg?: number | null
          z1_minutes?: number
          z2_minutes?: number
          z3_minutes?: number
          z4_minutes?: number
          z5_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cardio_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_comparisons: {
        Row: {
          comparison_data: Json
          created_at: string | null
          expires_at: string | null
          id: string
          restaurant_name: string | null
          share_token: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          comparison_data: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          restaurant_name?: string | null
          share_token: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          comparison_data?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          restaurant_name?: string | null
          share_token?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      shared_menu_items: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          item_data: Json
          item_name: string
          restaurant_name: string | null
          share_token: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          item_data: Json
          item_name: string
          restaurant_name?: string | null
          share_token: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          item_data?: Json
          item_name?: string
          restaurant_name?: string | null
          share_token?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          awakenings: number | null
          bedtime: string | null
          created_at: string | null
          deep_sleep_minutes: number | null
          duration_minutes: number | null
          id: string
          light_sleep_minutes: number | null
          notes: string | null
          quality_score: number | null
          rem_sleep_minutes: number | null
          sleep_date: string
          source: string | null
          updated_at: string | null
          user_id: string
          wake_time: string | null
        }
        Insert: {
          awakenings?: number | null
          bedtime?: string | null
          created_at?: string | null
          deep_sleep_minutes?: number | null
          duration_minutes?: number | null
          id?: string
          light_sleep_minutes?: number | null
          notes?: string | null
          quality_score?: number | null
          rem_sleep_minutes?: number | null
          sleep_date: string
          source?: string | null
          updated_at?: string | null
          user_id: string
          wake_time?: string | null
        }
        Update: {
          awakenings?: number | null
          bedtime?: string | null
          created_at?: string | null
          deep_sleep_minutes?: number | null
          duration_minutes?: number | null
          id?: string
          light_sleep_minutes?: number | null
          notes?: string | null
          quality_score?: number | null
          rem_sleep_minutes?: number | null
          sleep_date?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      smart_pin_data: {
        Row: {
          created_at: string
          duration: number
          heart_rate: number | null
          id: string
          machine_id: string
          muscle_group: string
          reps: number
          session_id: string | null
          sets: number
          timestamp: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          duration: number
          heart_rate?: number | null
          id?: string
          machine_id: string
          muscle_group: string
          reps: number
          session_id?: string | null
          sets: number
          timestamp?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          duration?: number
          heart_rate?: number | null
          id?: string
          machine_id?: string
          muscle_group?: string
          reps?: number
          session_id?: string | null
          sets?: number
          timestamp?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "smart_pin_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          category: string
          coin_cost: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          category: string
          coin_cost: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string
          coin_cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      streak_milestones: {
        Row: {
          achieved_at: string
          coins_awarded: number
          created_at: string
          id: string
          milestone_days: number
          streak_count: number
          user_id: string
        }
        Insert: {
          achieved_at?: string
          coins_awarded?: number
          created_at?: string
          id?: string
          milestone_days: number
          streak_count: number
          user_id: string
        }
        Update: {
          achieved_at?: string
          coins_awarded?: number
          created_at?: string
          id?: string
          milestone_days?: number
          streak_count?: number
          user_id?: string
        }
        Relationships: []
      }
      swim_sessions: {
        Row: {
          avg_heart_rate: number | null
          avg_pace_sec_per_100m: number
          avg_strokes_per_lap: number | null
          calories: number
          created_at: string
          elapsed_time_s: number
          ended_at: string | null
          hr_samples: Json | null
          id: string
          laps: Json | null
          max_heart_rate: number | null
          moving_time_s: number
          notes: string | null
          pool_length_m: number | null
          source: string
          started_at: string
          status: string
          stroke_type: string | null
          swolf_score: number | null
          target_hr_zone: Json | null
          time_in_zone_s: number | null
          total_distance_m: number
          total_laps: number | null
          training_mode: string | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_heart_rate?: number | null
          avg_pace_sec_per_100m?: number
          avg_strokes_per_lap?: number | null
          calories?: number
          created_at?: string
          elapsed_time_s?: number
          ended_at?: string | null
          hr_samples?: Json | null
          id?: string
          laps?: Json | null
          max_heart_rate?: number | null
          moving_time_s?: number
          notes?: string | null
          pool_length_m?: number | null
          source?: string
          started_at: string
          status: string
          stroke_type?: string | null
          swolf_score?: number | null
          target_hr_zone?: Json | null
          time_in_zone_s?: number | null
          total_distance_m?: number
          total_laps?: number | null
          training_mode?: string | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_heart_rate?: number | null
          avg_pace_sec_per_100m?: number
          avg_strokes_per_lap?: number | null
          calories?: number
          created_at?: string
          elapsed_time_s?: number
          ended_at?: string | null
          hr_samples?: Json | null
          id?: string
          laps?: Json | null
          max_heart_rate?: number | null
          moving_time_s?: number
          notes?: string | null
          pool_length_m?: number | null
          source?: string
          started_at?: string
          status?: string
          stroke_type?: string | null
          swolf_score?: number | null
          target_hr_zone?: Json | null
          time_in_zone_s?: number | null
          total_distance_m?: number
          total_laps?: number | null
          training_mode?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tap_coins_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      tap_tokens_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          coins_earned: number
          created_at: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          coins_earned?: number
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          coins_earned?: number
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calibration_results: {
        Row: {
          baseline_weights: Json
          calibration_date: string
          completed_at: string
          created_at: string
          endurance_metrics: Json
          fitness_assessment: string | null
          id: string
          recommendations: Json | null
          strength_metrics: Json
          user_id: string
        }
        Insert: {
          baseline_weights?: Json
          calibration_date?: string
          completed_at?: string
          created_at?: string
          endurance_metrics?: Json
          fitness_assessment?: string | null
          id?: string
          recommendations?: Json | null
          strength_metrics?: Json
          user_id: string
        }
        Update: {
          baseline_weights?: Json
          calibration_date?: string
          completed_at?: string
          created_at?: string
          endurance_metrics?: Json
          fitness_assessment?: string | null
          id?: string
          recommendations?: Json | null
          strength_metrics?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          coins_earned: number | null
          completed_at: string | null
          created_at: string
          current_progress: number
          early_completion_bonus: boolean
          expires_at: string | null
          id: string
          started_at: string
          status: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          coins_earned?: number | null
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          early_completion_bonus?: boolean
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          coins_earned?: number | null
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          early_completion_bonus?: boolean
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fitness_preferences: {
        Row: {
          available_days: string[]
          available_equipment: string[] | null
          created_at: string
          current_fitness_level: string
          equipment_restrictions: string[] | null
          health_conditions: string[] | null
          id: string
          preferred_time_slots: string[]
          preferred_workout_time: string | null
          primary_goal: string
          session_duration_preference: number
          target_muscle_groups: string[] | null
          updated_at: string
          user_id: string
          workout_frequency: number
        }
        Insert: {
          available_days?: string[]
          available_equipment?: string[] | null
          created_at?: string
          current_fitness_level?: string
          equipment_restrictions?: string[] | null
          health_conditions?: string[] | null
          id?: string
          preferred_time_slots?: string[]
          preferred_workout_time?: string | null
          primary_goal?: string
          session_duration_preference?: number
          target_muscle_groups?: string[] | null
          updated_at?: string
          user_id: string
          workout_frequency?: number
        }
        Update: {
          available_days?: string[]
          available_equipment?: string[] | null
          created_at?: string
          current_fitness_level?: string
          equipment_restrictions?: string[] | null
          health_conditions?: string[] | null
          id?: string
          preferred_time_slots?: string[]
          preferred_workout_time?: string | null
          primary_goal?: string
          session_duration_preference?: number
          target_muscle_groups?: string[] | null
          updated_at?: string
          user_id?: string
          workout_frequency?: number
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_loot_openings: {
        Row: {
          id: string
          loot_box_id: string
          opened_at: string
          rewards_received: Json
          tokens_spent: number
          user_id: string
        }
        Insert: {
          id?: string
          loot_box_id: string
          opened_at?: string
          rewards_received: Json
          tokens_spent: number
          user_id: string
        }
        Update: {
          id?: string
          loot_box_id?: string
          opened_at?: string
          rewards_received?: Json
          tokens_spent?: number
          user_id?: string
        }
        Relationships: []
      }
      user_power_levels: {
        Row: {
          created_at: string
          current_score: number
          current_tier: string
          id: string
          last_calculated_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_score?: number
          current_tier?: string
          id?: string
          last_calculated_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_score?: number
          current_tier?: string
          id?: string
          last_calculated_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_power_ups: {
        Row: {
          id: string
          is_equipped: boolean
          power_up_id: string
          unlocked_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          power_up_id: string
          unlocked_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          power_up_id?: string
          unlocked_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          coins_spent: number
          id: string
          purchased_at: string
          store_item_id: string
          user_id: string
        }
        Insert: {
          coins_spent: number
          id?: string
          purchased_at?: string
          store_item_id: string
          user_id: string
        }
        Update: {
          coins_spent?: number
          id?: string
          purchased_at?: string
          store_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_store_item_id_fkey"
            columns: ["store_item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          gym_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          gym_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          gym_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      water_intake: {
        Row: {
          amount_ml: number
          beverage_type: string | null
          created_at: string
          effective_hydration_ml: number | null
          id: string
          is_dehydrating: boolean | null
          logged_at: string
          logged_date: string
          source: string | null
          total_amount_ml: number | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          beverage_type?: string | null
          created_at?: string
          effective_hydration_ml?: number | null
          id?: string
          is_dehydrating?: boolean | null
          logged_at?: string
          logged_date?: string
          source?: string | null
          total_amount_ml?: number | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          beverage_type?: string | null
          created_at?: string
          effective_hydration_ml?: number | null
          id?: string
          is_dehydrating?: boolean | null
          logged_at?: string
          logged_date?: string
          source?: string | null
          total_amount_ml?: number | null
          user_id?: string
        }
        Relationships: []
      }
      weight_progressions: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          machine_name: string | null
          new_weight: number
          previous_weight: number | null
          progression_reason: string | null
          user_id: string
          week_number: number | null
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          machine_name?: string | null
          new_weight: number
          previous_weight?: number | null
          progression_reason?: string | null
          user_id: string
          week_number?: number | null
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          machine_name?: string | null
          new_weight?: number
          previous_weight?: number | null
          progression_reason?: string | null
          user_id?: string
          week_number?: number | null
        }
        Relationships: []
      }
      workout_adaptations: {
        Row: {
          adaptation_applied: Json
          adaptation_reason: string | null
          adaptation_week: number
          created_at: string
          id: string
          nutrition_trigger: Json | null
          performance_trigger: Json | null
          user_id: string
          workout_plan_id: string
        }
        Insert: {
          adaptation_applied: Json
          adaptation_reason?: string | null
          adaptation_week: number
          created_at?: string
          id?: string
          nutrition_trigger?: Json | null
          performance_trigger?: Json | null
          user_id: string
          workout_plan_id: string
        }
        Update: {
          adaptation_applied?: Json
          adaptation_reason?: string | null
          adaptation_week?: number
          created_at?: string
          id?: string
          nutrition_trigger?: Json | null
          performance_trigger?: Json | null
          user_id?: string
          workout_plan_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          duration_minutes: number | null
          exercise_order: number
          exercise_type: string | null
          id: string
          intensity: string | null
          machine_name: string
          notes: string | null
          reps: number | null
          rest_seconds: number
          scheduled_workout_id: string
          sets: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          exercise_order: number
          exercise_type?: string | null
          id?: string
          intensity?: string | null
          machine_name: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number
          scheduled_workout_id: string
          sets?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          exercise_order?: number
          exercise_type?: string | null
          id?: string
          intensity?: string | null
          machine_name?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number
          scheduled_workout_id?: string
          sets?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_scheduled_workout_id_fkey"
            columns: ["scheduled_workout_id"]
            isOneToOne: false
            referencedRelation: "scheduled_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          completed_at: string | null
          completed_exercises: number
          created_at: string
          duration_minutes: number | null
          id: string
          muscle_group: string
          notes: string | null
          scheduled_workout_id: string | null
          started_at: string
          total_exercises: number
          total_reps: number
          updated_at: string
          user_id: string
          workout_name: string
          workout_source: string | null
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string | null
          completed_exercises?: number
          created_at?: string
          duration_minutes?: number | null
          id?: string
          muscle_group: string
          notes?: string | null
          scheduled_workout_id?: string | null
          started_at?: string
          total_exercises?: number
          total_reps?: number
          updated_at?: string
          user_id: string
          workout_name: string
          workout_source?: string | null
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string | null
          completed_exercises?: number
          created_at?: string
          duration_minutes?: number | null
          id?: string
          muscle_group?: string
          notes?: string | null
          scheduled_workout_id?: string | null
          started_at?: string
          total_exercises?: number
          total_reps?: number
          updated_at?: string
          user_id?: string
          workout_name?: string
          workout_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_scheduled_workout_id_fkey"
            columns: ["scheduled_workout_id"]
            isOneToOne: false
            referencedRelation: "scheduled_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_performance: {
        Row: {
          actual_weight: number | null
          completed_at: string | null
          completed_reps: number
          completed_sets: number
          completion_percentage: number | null
          created_at: string
          id: string
          notes: string | null
          perceived_exertion: number | null
          recommended_weight: number | null
          scheduled_workout_id: string
          user_id: string
          workout_exercise_id: string
        }
        Insert: {
          actual_weight?: number | null
          completed_at?: string | null
          completed_reps?: number
          completed_sets?: number
          completion_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          perceived_exertion?: number | null
          recommended_weight?: number | null
          scheduled_workout_id: string
          user_id: string
          workout_exercise_id: string
        }
        Update: {
          actual_weight?: number | null
          completed_at?: string | null
          completed_reps?: number
          completed_sets?: number
          completion_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          perceived_exertion?: number | null
          recommended_weight?: number | null
          scheduled_workout_id?: string
          user_id?: string
          workout_exercise_id?: string
        }
        Relationships: []
      }
      workout_performance_correlations: {
        Row: {
          best_workout_day: string | null
          best_workout_time: string | null
          confidence_level: string | null
          created_at: string | null
          data_points_count: number | null
          energy_level_correlation: number | null
          id: string
          last_calculated: string | null
          mood_score_correlation: number | null
          optimal_energy_range: Json | null
          optimal_mood_range: Json | null
          optimal_resting_hr: Json | null
          optimal_sleep_hours: number | null
          optimal_sleep_quality: number | null
          optimal_stress_range: Json | null
          resting_hr_correlation: number | null
          sleep_duration_correlation: number | null
          sleep_quality_correlation: number | null
          stress_level_correlation: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_workout_day?: string | null
          best_workout_time?: string | null
          confidence_level?: string | null
          created_at?: string | null
          data_points_count?: number | null
          energy_level_correlation?: number | null
          id?: string
          last_calculated?: string | null
          mood_score_correlation?: number | null
          optimal_energy_range?: Json | null
          optimal_mood_range?: Json | null
          optimal_resting_hr?: Json | null
          optimal_sleep_hours?: number | null
          optimal_sleep_quality?: number | null
          optimal_stress_range?: Json | null
          resting_hr_correlation?: number | null
          sleep_duration_correlation?: number | null
          sleep_quality_correlation?: number | null
          stress_level_correlation?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_workout_day?: string | null
          best_workout_time?: string | null
          confidence_level?: string | null
          created_at?: string | null
          data_points_count?: number | null
          energy_level_correlation?: number | null
          id?: string
          last_calculated?: string | null
          mood_score_correlation?: number | null
          optimal_energy_range?: Json | null
          optimal_mood_range?: Json | null
          optimal_resting_hr?: Json | null
          optimal_sleep_hours?: number | null
          optimal_sleep_quality?: number | null
          optimal_stress_range?: Json | null
          resting_hr_correlation?: number | null
          sleep_duration_correlation?: number | null
          sleep_quality_correlation?: number | null
          stress_level_correlation?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          duration_weeks: number
          fitness_goal: string
          id: string
          injuries_notes: string | null
          is_active: boolean
          machines_to_avoid: string[] | null
          max_workout_duration: number | null
          name: string
          preferred_days: string[] | null
          preferred_times: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number
          fitness_goal: string
          id?: string
          injuries_notes?: string | null
          is_active?: boolean
          machines_to_avoid?: string[] | null
          max_workout_duration?: number | null
          name: string
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number
          fitness_goal?: string
          id?: string
          injuries_notes?: string | null
          is_active?: boolean
          machines_to_avoid?: string[] | null
          max_workout_duration?: number | null
          name?: string
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_workout_date: string | null
          longest_streak: number
          milestones_achieved: Json | null
          streak_start_date: string | null
          total_workout_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_workout_date?: string | null
          longest_streak?: number
          milestones_achieved?: Json | null
          streak_start_date?: string | null
          total_workout_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_workout_date?: string | null
          longest_streak?: number
          milestones_achieved?: Json | null
          streak_start_date?: string | null
          total_workout_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_most_common_muscle_group: {
        Row: {
          exercise_count: number | null
          most_common_muscle_group: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_workout_summary: {
        Row: {
          average_weight: number | null
          first_workout: string | null
          last_workout: string | null
          muscle_group: string | null
          total_exercises: number | null
          total_reps: number | null
          total_sets: number | null
          total_volume: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_tap_coins: {
        Args: {
          _amount: number
          _description: string
          _reference_id?: string
          _transaction_type: string
          _user_id: string
        }
        Returns: boolean
      }
      add_tap_tokens: {
        Args: {
          _amount: number
          _description: string
          _reference_id?: string
          _transaction_type: string
          _user_id: string
        }
        Returns: boolean
      }
      award_challenge_coins: {
        Args: {
          _amount: number
          _reference_id: string
          _type: string
          _user_id: string
        }
        Returns: boolean
      }
      calculate_bmr: {
        Args: {
          _age: number
          _gender: string
          _height_cm: number
          _weight_kg: number
        }
        Returns: number
      }
      calculate_injury_risk_score: {
        Args: { _user_id: string }
        Returns: number
      }
      calculate_nutrition_goals: {
        Args: {
          _activity_level?: string
          _gender: string
          _height_cm: number
          _weight_kg: number
        }
        Returns: Json
      }
      calculate_readiness_score: { Args: { _user_id: string }; Returns: Json }
      calculate_user_power_level: {
        Args: { _user_id: string }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          max_requests: number
          time_window_seconds: number
          user_identifier: string
        }
        Returns: boolean
      }
      clean_base64_photo_urls: { Args: never; Returns: undefined }
      cleanup_expired_food_cache: { Args: never; Returns: undefined }
      cleanup_expired_shares: { Args: never; Returns: undefined }
      cleanup_old_data: { Args: never; Returns: undefined }
      cleanup_old_food_entries: {
        Args: { _days_to_keep?: number }
        Returns: undefined
      }
      cleanup_rate_limit_logs: { Args: never; Returns: undefined }
      complete_user_calibration: {
        Args: { _user_id: string }
        Returns: boolean
      }
      encrypt_sensitive_field: {
        Args: { field_value: string }
        Returns: string
      }
      enhanced_rate_limit_check: {
        Args: {
          max_requests: number
          operation_type?: string
          time_window_seconds: number
          user_identifier: string
        }
        Returns: boolean
      }
      fix_incomplete_profiles: { Args: never; Returns: undefined }
      generate_nft_metadata: {
        Args: { _avatar_config: Json; _serial_number: number }
        Returns: Json
      }
      get_cycle_insights: {
        Args: { _phase: Database["public"]["Enums"]["cycle_phase"] }
        Returns: Json
      }
      get_cycle_phase: {
        Args: {
          _cycle_length: number
          _last_period_start: string
          _period_length: number
          _target_date: string
        }
        Returns: Database["public"]["Enums"]["cycle_phase"]
      }
      get_power_level_tier: { Args: { _score: number }; Returns: string }
      get_todays_workout_progress: {
        Args: { _user_id: string }
        Returns: {
          completed_exercises: number
          completion_percentage: number
          total_exercises: number
        }[]
      }
      get_trainer_accessible_profiles: {
        Args: never
        Returns: {
          avatar_data: Json
          avatar_id: string
          avatar_url: string
          calibration_completed: boolean
          created_at: string
          experience_level: string
          full_name: string
          gym_id: string
          id: string
          onboarding_completed: boolean
          preferred_equipment_type: string
          primary_goal: string
        }[]
      }
      get_user_gym_id: { Args: { _user_id: string }; Returns: string }
      get_user_social_stats: { Args: { user_uuid: string }; Returns: Json }
      get_user_upload_success_rate: {
        Args: { _days?: number; _user_id: string }
        Returns: {
          success_rate: number
          successful_uploads: number
          total_attempts: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_at_gym: {
        Args: {
          _gym_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_following: {
        Args: { follower_uuid: string; following_uuid: string }
        Returns: boolean
      }
      is_valid_authenticated_user: { Args: never; Returns: boolean }
      log_photo_upload_attempt: {
        Args: {
          _error_message?: string
          _photo_count?: number
          _success: boolean
          _user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          _event_details?: Json
          _event_type?: string
          _ip_address?: unknown
          _user_agent?: string
          _user_id?: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: { _user_id: string }
        Returns: boolean
      }
      mark_notifications_read: {
        Args: { _notification_ids: string[]; _user_id: string }
        Returns: boolean
      }
      mask_sensitive_data: { Args: { data: Json }; Returns: Json }
      refresh_daily_nutrition_summary_for_user: {
        Args: { _user_id: string }
        Returns: undefined
      }
      spend_tap_coins: {
        Args: {
          _amount: number
          _description: string
          _reference_id?: string
          _transaction_type: string
          _user_id: string
        }
        Returns: boolean
      }
      spend_tap_tokens: {
        Args: {
          _amount: number
          _description: string
          _reference_id?: string
          _transaction_type: string
          _user_id: string
        }
        Returns: boolean
      }
      update_muscle_imbalance: {
        Args: {
          _left_score: number
          _muscle_group: string
          _right_score: number
          _user_id: string
        }
        Returns: undefined
      }
      update_user_power_level: { Args: { _user_id: string }; Returns: boolean }
      update_workout_streak: {
        Args: { _user_id: string; _workout_date: string }
        Returns: Json
      }
      validate_guest_session: {
        Args: { session_token: string }
        Returns: boolean
      }
      validate_guest_session_secure: {
        Args: { session_token: string }
        Returns: boolean
      }
      validate_session_for_sensitive_data: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "trainer" | "admin"
      cycle_phase: "menstrual" | "follicular" | "ovulation" | "luteal"
      scan_status: "queued" | "processing" | "done" | "error"
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
      app_role: ["user", "trainer", "admin"],
      cycle_phase: ["menstrual", "follicular", "ovulation", "luteal"],
      scan_status: ["queued", "processing", "done", "error"],
    },
  },
} as const
