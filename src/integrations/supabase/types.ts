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
      alcohol_entries: {
        Row: {
          alcohol_content: number | null
          created_at: string
          drink_type: string
          id: string
          logged_date: string
          logged_time: string | null
          notes: string | null
          quantity: number
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
          quantity?: number
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
          quantity?: number
          updated_at?: string
          user_id?: string
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
          id: string
          image_url: string
          is_active: boolean
          mini_image_url: string
          name: string
          sort_order: number
        }
        Insert: {
          accent_hex?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          mini_image_url: string
          name: string
          sort_order?: number
        }
        Update: {
          accent_hex?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          mini_image_url?: string
          name?: string
          sort_order?: number
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
      exercise_logs: {
        Row: {
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
          photo_url: string | null
          thumbnail_url: string | null
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
          photo_url?: string | null
          thumbnail_url?: string | null
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
          photo_url?: string | null
          thumbnail_url?: string | null
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
      profiles: {
        Row: {
          age: number | null
          avatar_data: Json | null
          avatar_id: string | null
          avatar_url: string | null
          calibration_completed: boolean | null
          created_at: string
          current_max_weights: Json | null
          diet_type: string | null
          email: string | null
          experience_level: string | null
          full_name: string | null
          gender: string | null
          gym_id: string | null
          health_conditions: string[] | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean | null
          preferred_equipment_type: string | null
          previous_injuries: string[] | null
          primary_goal: string | null
          tap_coins_balance: number
          tap_tokens_balance: number
          target_carbs_grams: number | null
          target_daily_calories: number | null
          target_fat_grams: number | null
          target_protein_grams: number | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          avatar_data?: Json | null
          avatar_id?: string | null
          avatar_url?: string | null
          calibration_completed?: boolean | null
          created_at?: string
          current_max_weights?: Json | null
          diet_type?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          gym_id?: string | null
          health_conditions?: string[] | null
          height_cm?: number | null
          id: string
          onboarding_completed?: boolean | null
          preferred_equipment_type?: string | null
          previous_injuries?: string[] | null
          primary_goal?: string | null
          tap_coins_balance?: number
          tap_tokens_balance?: number
          target_carbs_grams?: number | null
          target_daily_calories?: number | null
          target_fat_grams?: number | null
          target_protein_grams?: number | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          avatar_data?: Json | null
          avatar_id?: string | null
          avatar_url?: string | null
          calibration_completed?: boolean | null
          created_at?: string
          current_max_weights?: Json | null
          diet_type?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          gym_id?: string | null
          health_conditions?: string[] | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          preferred_equipment_type?: string | null
          previous_injuries?: string[] | null
          primary_goal?: string | null
          tap_coins_balance?: number
          tap_tokens_balance?: number
          target_carbs_grams?: number | null
          target_daily_calories?: number | null
          target_fat_grams?: number | null
          target_protein_grams?: number | null
          weight_kg?: number | null
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
      calculate_nutrition_goals: {
        Args: {
          _activity_level?: string
          _gender: string
          _height_cm: number
          _weight_kg: number
        }
        Returns: Json
      }
      calculate_user_power_level: {
        Args: { _user_id: string }
        Returns: number
      }
      cleanup_old_food_entries: {
        Args: { _days_to_keep?: number }
        Returns: undefined
      }
      complete_user_calibration: {
        Args: { _user_id: string }
        Returns: boolean
      }
      fix_incomplete_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_nft_metadata: {
        Args: { _avatar_config: Json; _serial_number: number }
        Returns: Json
      }
      get_power_level_tier: {
        Args: { _score: number }
        Returns: string
      }
      get_todays_workout_progress: {
        Args: { _user_id: string }
        Returns: {
          completed_exercises: number
          completion_percentage: number
          total_exercises: number
        }[]
      }
      get_trainer_accessible_profiles: {
        Args: Record<PropertyKey, never>
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
      get_user_gym_id: {
        Args: { _user_id: string }
        Returns: string
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
      update_user_power_level: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "trainer" | "admin"
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
      scan_status: ["queued", "processing", "done", "error"],
    },
  },
} as const
