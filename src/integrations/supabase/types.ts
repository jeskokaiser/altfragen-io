export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      draft_questions: {
        Row: {
          comment: string | null
          correct_answer: string
          created_at: string
          creator_id: string
          difficulty: number | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          question: string
          session_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          correct_answer: string
          created_at?: string
          creator_id: string
          difficulty?: number | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          question: string
          session_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          correct_answer?: string
          created_at?: string
          creator_id?: string
          difficulty?: number | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          option_e?: string
          question?: string
          session_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          semester: string | null
          subject: string
          title: string
          university_id: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          semester?: string | null
          subject: string
          title: string
          university_id?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          semester?: string | null
          subject?: string
          title?: string
          university_id?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_email_verified: boolean | null
          university_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_email_verified?: boolean | null
          university_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_email_verified?: boolean | null
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          comment: string | null
          correct_answer: string
          created_at: string
          difficulty: number | null
          exam_name: string | null
          exam_semester: string | null
          exam_year: string | null
          filename: string
          id: string
          image_key: string | null
          is_unclear: boolean | null
          marked_unclear_at: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          question: string
          show_image_after_answer: boolean | null
          subject: string
          university_id: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          comment?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: number | null
          exam_name?: string | null
          exam_semester?: string | null
          exam_year?: string | null
          filename: string
          id?: string
          image_key?: string | null
          is_unclear?: boolean | null
          marked_unclear_at?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          question: string
          show_image_after_answer?: boolean | null
          subject: string
          university_id?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          comment?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: number | null
          exam_name?: string | null
          exam_semester?: string | null
          exam_year?: string | null
          filename?: string
          id?: string
          image_key?: string | null
          is_unclear?: boolean | null
          marked_unclear_at?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          option_e?: string
          question?: string
          show_image_after_answer?: boolean | null
          subject?: string
          university_id?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      session_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          id: string
          message: string
          session_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          message: string
          session_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          message?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_activities_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          email_domain: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_domain: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_domain?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          archived_datasets: string[] | null
          created_at: string | null
          id: string
          immediate_feedback: boolean | null
          selected_university_datasets: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived_datasets?: string[] | null
          created_at?: string | null
          id?: string
          immediate_feedback?: boolean | null
          selected_university_datasets?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived_datasets?: string[] | null
          created_at?: string | null
          id?: string
          immediate_feedback?: boolean | null
          selected_university_datasets?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          attempts_count: number | null
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string | null
          updated_at: string | null
          user_answer: string | null
          user_difficulty: number | null
          user_id: string | null
        }
        Insert: {
          attempts_count?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          updated_at?: string | null
          user_answer?: string | null
          user_difficulty?: number | null
          user_id?: string | null
        }
        Update: {
          attempts_count?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          updated_at?: string | null
          user_answer?: string | null
          user_difficulty?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_university_match: {
        Args: { user_uuid: string; university_uuid: string }
        Returns: boolean
      }
      get_question_session_id: {
        Args: { question_uuid: string }
        Returns: string
      }
      is_session_host: {
        Args: { session_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_session_participant: {
        Args: { session_uuid: string; user_uuid: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
