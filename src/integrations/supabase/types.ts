export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
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
      food_entries: {
        Row: {
          ai_analyzed: boolean
          created_at: string
          food_items: Json
          id: string
          logged_date: string
          meal_type: string
          notes: string | null
          photo_url: string | null
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
          created_at?: string
          food_items: Json
          id?: string
          logged_date?: string
          meal_type: string
          notes?: string | null
          photo_url?: string | null
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
          created_at?: string
          food_items?: Json
          id?: string
          logged_date?: string
          meal_type?: string
          notes?: string | null
          photo_url?: string | null
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
      machines: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          type: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          type: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gym_id: string | null
          id: string
          tap_coins_balance: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gym_id?: string | null
          id: string
          tap_coins_balance?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gym_id?: string | null
          id?: string
          tap_coins_balance?: number
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
      user_fitness_preferences: {
        Row: {
          available_days: string[]
          created_at: string
          current_fitness_level: string
          equipment_restrictions: string[] | null
          health_conditions: string[] | null
          id: string
          preferred_time_slots: string[]
          primary_goal: string
          session_duration_preference: number
          updated_at: string
          user_id: string
          workout_frequency: number
        }
        Insert: {
          available_days?: string[]
          created_at?: string
          current_fitness_level?: string
          equipment_restrictions?: string[] | null
          health_conditions?: string[] | null
          id?: string
          preferred_time_slots?: string[]
          primary_goal?: string
          session_duration_preference?: number
          updated_at?: string
          user_id: string
          workout_frequency?: number
        }
        Update: {
          available_days?: string[]
          created_at?: string
          current_fitness_level?: string
          equipment_restrictions?: string[] | null
          health_conditions?: string[] | null
          id?: string
          preferred_time_slots?: string[]
          primary_goal?: string
          session_duration_preference?: number
          updated_at?: string
          user_id?: string
          workout_frequency?: number
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
      workout_exercises: {
        Row: {
          created_at: string
          exercise_order: number
          id: string
          machine_name: string
          notes: string | null
          reps: number
          rest_seconds: number
          scheduled_workout_id: string
          sets: number
          weight: number | null
        }
        Insert: {
          created_at?: string
          exercise_order: number
          id?: string
          machine_name: string
          notes?: string | null
          reps: number
          rest_seconds?: number
          scheduled_workout_id: string
          sets: number
          weight?: number | null
        }
        Update: {
          created_at?: string
          exercise_order?: number
          id?: string
          machine_name?: string
          notes?: string | null
          reps?: number
          rest_seconds?: number
          scheduled_workout_id?: string
          sets?: number
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
          _user_id: string
          _amount: number
          _transaction_type: string
          _description: string
          _reference_id?: string
        }
        Returns: boolean
      }
      get_user_gym_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_role_at_gym: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _gym_id: string
        }
        Returns: boolean
      }
      spend_tap_coins: {
        Args: {
          _user_id: string
          _amount: number
          _transaction_type: string
          _description: string
          _reference_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "trainer" | "admin"
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
    },
  },
} as const
