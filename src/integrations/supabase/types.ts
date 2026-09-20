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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_answer_comments: {
        Row: {
          chatgpt_chosen_answer: string | null
          chatgpt_comment_a: string | null
          chatgpt_comment_b: string | null
          chatgpt_comment_c: string | null
          chatgpt_comment_d: string | null
          chatgpt_comment_e: string | null
          chatgpt_general_comment: string | null
          chatgpt_model_version: string | null
          chatgpt_regenerated_option_a: string | null
          chatgpt_regenerated_option_b: string | null
          chatgpt_regenerated_option_c: string | null
          chatgpt_regenerated_option_d: string | null
          chatgpt_regenerated_option_e: string | null
          chatgpt_regenerated_question: string | null
          claude_comment_a: string | null
          claude_comment_b: string | null
          claude_comment_c: string | null
          claude_comment_d: string | null
          claude_comment_e: string | null
          claude_general_comment: string | null
          created_at: string | null
          deepseek_chosen_answer: string | null
          deepseek_comment_a: string | null
          deepseek_comment_b: string | null
          deepseek_comment_c: string | null
          deepseek_comment_d: string | null
          deepseek_comment_e: string | null
          deepseek_general_comment: string | null
          deepseek_model_version: string | null
          gemini_chosen_answer: string | null
          gemini_comment_a: string | null
          gemini_comment_b: string | null
          gemini_comment_c: string | null
          gemini_comment_d: string | null
          gemini_comment_e: string | null
          gemini_general_comment: string | null
          gemini_model_version: string | null
          gemini_new_comment_a: string | null
          gemini_new_comment_b: string | null
          gemini_new_comment_c: string | null
          gemini_new_comment_d: string | null
          gemini_new_comment_e: string | null
          gemini_new_general_comment: string | null
          gemini_regenerated_option_a: string | null
          gemini_regenerated_option_b: string | null
          gemini_regenerated_option_c: string | null
          gemini_regenerated_option_d: string | null
          gemini_regenerated_option_e: string | null
          gemini_regenerated_question: string | null
          id: string
          mistral_chosen_answer: string | null
          mistral_comment_a: string | null
          mistral_comment_b: string | null
          mistral_comment_c: string | null
          mistral_comment_d: string | null
          mistral_comment_e: string | null
          mistral_general_comment: string | null
          mistral_model_version: string | null
          openai_comment_a: string | null
          openai_comment_b: string | null
          openai_comment_c: string | null
          openai_comment_d: string | null
          openai_comment_e: string | null
          openai_general_comment: string | null
          perplexity_chosen_answer: string | null
          perplexity_comment_a: string | null
          perplexity_comment_b: string | null
          perplexity_comment_c: string | null
          perplexity_comment_d: string | null
          perplexity_comment_e: string | null
          perplexity_general_comment: string | null
          perplexity_model_version: string | null
          processing_status: string | null
          question_id: string | null
          updated_at: string | null
        }
        Insert: {
          chatgpt_chosen_answer?: string | null
          chatgpt_comment_a?: string | null
          chatgpt_comment_b?: string | null
          chatgpt_comment_c?: string | null
          chatgpt_comment_d?: string | null
          chatgpt_comment_e?: string | null
          chatgpt_general_comment?: string | null
          chatgpt_model_version?: string | null
          chatgpt_regenerated_option_a?: string | null
          chatgpt_regenerated_option_b?: string | null
          chatgpt_regenerated_option_c?: string | null
          chatgpt_regenerated_option_d?: string | null
          chatgpt_regenerated_option_e?: string | null
          chatgpt_regenerated_question?: string | null
          claude_comment_a?: string | null
          claude_comment_b?: string | null
          claude_comment_c?: string | null
          claude_comment_d?: string | null
          claude_comment_e?: string | null
          claude_general_comment?: string | null
          created_at?: string | null
          deepseek_chosen_answer?: string | null
          deepseek_comment_a?: string | null
          deepseek_comment_b?: string | null
          deepseek_comment_c?: string | null
          deepseek_comment_d?: string | null
          deepseek_comment_e?: string | null
          deepseek_general_comment?: string | null
          deepseek_model_version?: string | null
          gemini_chosen_answer?: string | null
          gemini_comment_a?: string | null
          gemini_comment_b?: string | null
          gemini_comment_c?: string | null
          gemini_comment_d?: string | null
          gemini_comment_e?: string | null
          gemini_general_comment?: string | null
          gemini_model_version?: string | null
          gemini_new_comment_a?: string | null
          gemini_new_comment_b?: string | null
          gemini_new_comment_c?: string | null
          gemini_new_comment_d?: string | null
          gemini_new_comment_e?: string | null
          gemini_new_general_comment?: string | null
          gemini_regenerated_option_a?: string | null
          gemini_regenerated_option_b?: string | null
          gemini_regenerated_option_c?: string | null
          gemini_regenerated_option_d?: string | null
          gemini_regenerated_option_e?: string | null
          gemini_regenerated_question?: string | null
          id?: string
          mistral_chosen_answer?: string | null
          mistral_comment_a?: string | null
          mistral_comment_b?: string | null
          mistral_comment_c?: string | null
          mistral_comment_d?: string | null
          mistral_comment_e?: string | null
          mistral_general_comment?: string | null
          mistral_model_version?: string | null
          openai_comment_a?: string | null
          openai_comment_b?: string | null
          openai_comment_c?: string | null
          openai_comment_d?: string | null
          openai_comment_e?: string | null
          openai_general_comment?: string | null
          perplexity_chosen_answer?: string | null
          perplexity_comment_a?: string | null
          perplexity_comment_b?: string | null
          perplexity_comment_c?: string | null
          perplexity_comment_d?: string | null
          perplexity_comment_e?: string | null
          perplexity_general_comment?: string | null
          perplexity_model_version?: string | null
          processing_status?: string | null
          question_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chatgpt_chosen_answer?: string | null
          chatgpt_comment_a?: string | null
          chatgpt_comment_b?: string | null
          chatgpt_comment_c?: string | null
          chatgpt_comment_d?: string | null
          chatgpt_comment_e?: string | null
          chatgpt_general_comment?: string | null
          chatgpt_model_version?: string | null
          chatgpt_regenerated_option_a?: string | null
          chatgpt_regenerated_option_b?: string | null
          chatgpt_regenerated_option_c?: string | null
          chatgpt_regenerated_option_d?: string | null
          chatgpt_regenerated_option_e?: string | null
          chatgpt_regenerated_question?: string | null
          claude_comment_a?: string | null
          claude_comment_b?: string | null
          claude_comment_c?: string | null
          claude_comment_d?: string | null
          claude_comment_e?: string | null
          claude_general_comment?: string | null
          created_at?: string | null
          deepseek_chosen_answer?: string | null
          deepseek_comment_a?: string | null
          deepseek_comment_b?: string | null
          deepseek_comment_c?: string | null
          deepseek_comment_d?: string | null
          deepseek_comment_e?: string | null
          deepseek_general_comment?: string | null
          deepseek_model_version?: string | null
          gemini_chosen_answer?: string | null
          gemini_comment_a?: string | null
          gemini_comment_b?: string | null
          gemini_comment_c?: string | null
          gemini_comment_d?: string | null
          gemini_comment_e?: string | null
          gemini_general_comment?: string | null
          gemini_model_version?: string | null
          gemini_new_comment_a?: string | null
          gemini_new_comment_b?: string | null
          gemini_new_comment_c?: string | null
          gemini_new_comment_d?: string | null
          gemini_new_comment_e?: string | null
          gemini_new_general_comment?: string | null
          gemini_regenerated_option_a?: string | null
          gemini_regenerated_option_b?: string | null
          gemini_regenerated_option_c?: string | null
          gemini_regenerated_option_d?: string | null
          gemini_regenerated_option_e?: string | null
          gemini_regenerated_question?: string | null
          id?: string
          mistral_chosen_answer?: string | null
          mistral_comment_a?: string | null
          mistral_comment_b?: string | null
          mistral_comment_c?: string | null
          mistral_comment_d?: string | null
          mistral_comment_e?: string | null
          mistral_general_comment?: string | null
          mistral_model_version?: string | null
          openai_comment_a?: string | null
          openai_comment_b?: string | null
          openai_comment_c?: string | null
          openai_comment_d?: string | null
          openai_comment_e?: string | null
          openai_general_comment?: string | null
          perplexity_chosen_answer?: string | null
          perplexity_comment_a?: string | null
          perplexity_comment_b?: string | null
          perplexity_comment_c?: string | null
          perplexity_comment_d?: string | null
          perplexity_comment_e?: string | null
          perplexity_general_comment?: string | null
          perplexity_model_version?: string | null
          processing_status?: string | null
          question_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_answer_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_commentary_batch_jobs: {
        Row: {
          batch_id: string
          created_at: string
          error_file_id: string | null
          id: string
          input_file_id: string | null
          output_file_id: string | null
          provider: string
          question_ids: string[]
          status: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          error_file_id?: string | null
          id?: string
          input_file_id?: string | null
          output_file_id?: string | null
          provider: string
          question_ids: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          error_file_id?: string | null
          id?: string
          input_file_id?: string | null
          output_file_id?: string | null
          provider?: string
          question_ids?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_commentary_job_queue: {
        Row: {
          attempts: number
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          last_error: string | null
          lease_expires_at: string | null
          question_id: string
          status: string
          target_level: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          question_id: string
          status?: string
          target_level?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          question_id?: string
          status?: string
          target_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_commentary_job_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_commentary_settings: {
        Row: {
          auto_trigger_enabled: boolean | null
          batch_size: number | null
          created_at: string
          feature_enabled: boolean | null
          free_ai_daily_limit: number | null
          id: string
          lifetime_promotion_end_date: string | null
          lifetime_status: boolean | null
          max_free_sessions: number | null
          models_enabled: Json | null
          processing_delay_minutes: number | null
          rate_limit_per_user_per_day: number | null
          updated_at: string
        }
        Insert: {
          auto_trigger_enabled?: boolean | null
          batch_size?: number | null
          created_at?: string
          feature_enabled?: boolean | null
          free_ai_daily_limit?: number | null
          id?: string
          lifetime_promotion_end_date?: string | null
          lifetime_status?: boolean | null
          max_free_sessions?: number | null
          models_enabled?: Json | null
          processing_delay_minutes?: number | null
          rate_limit_per_user_per_day?: number | null
          updated_at?: string
        }
        Update: {
          auto_trigger_enabled?: boolean | null
          batch_size?: number | null
          created_at?: string
          feature_enabled?: boolean | null
          free_ai_daily_limit?: number | null
          id?: string
          lifetime_promotion_end_date?: string | null
          lifetime_status?: boolean | null
          max_free_sessions?: number | null
          models_enabled?: Json | null
          processing_delay_minutes?: number | null
          rate_limit_per_user_per_day?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_commentary_state: {
        Row: {
          last_full_content_hash: string | null
          last_full_processed_at: string | null
          last_partial_content_hash: string | null
          last_partial_processed_at: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          last_full_content_hash?: string | null
          last_full_processed_at?: string | null
          last_partial_content_hash?: string | null
          last_partial_processed_at?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          last_full_content_hash?: string | null
          last_full_processed_at?: string | null
          last_partial_content_hash?: string | null
          last_partial_processed_at?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_commentary_state_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_commentary_summaries: {
        Row: {
          created_at: string | null
          id: string
          model_agreement_analysis: string | null
          question_id: string | null
          summary_comment_a: string | null
          summary_comment_b: string | null
          summary_comment_c: string | null
          summary_comment_d: string | null
          summary_comment_e: string | null
          summary_general_comment: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_agreement_analysis?: string | null
          question_id?: string | null
          summary_comment_a?: string | null
          summary_comment_b?: string | null
          summary_comment_c?: string | null
          summary_comment_d?: string | null
          summary_comment_e?: string | null
          summary_general_comment?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          model_agreement_analysis?: string | null
          question_id?: string | null
          summary_comment_a?: string | null
          summary_comment_b?: string | null
          summary_comment_c?: string | null
          summary_comment_d?: string | null
          summary_comment_e?: string | null
          summary_general_comment?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_commentary_summaries_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_private_credits_ledger: {
        Row: {
          created_at: string
          credits_delta: number
          event_ts: string
          id: string
          ref: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_delta: number
          event_ts?: string
          id?: string
          ref: string
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_delta?: number
          event_ts?: string
          id?: string
          ref?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_private_quota_ledger: {
        Row: {
          created_at: string
          event_ts: string
          id: string
          kind: string
          question_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_ts?: string
          id?: string
          kind: string
          question_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_ts?: string
          id?: string
          kind?: string
          question_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_private_quota_ledger_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_logs: {
        Row: {
          body: string
          created_at: string | null
          error_details: Json | null
          failed_count: number
          id: string
          invalid_removed: number
          subscribers_count: number
          successful_count: number
          tag: string | null
          title: string
          url: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          error_details?: Json | null
          failed_count?: number
          id?: string
          invalid_removed?: number
          subscribers_count?: number
          successful_count?: number
          tag?: string | null
          title: string
          url?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          error_details?: Json | null
          failed_count?: number
          id?: string
          invalid_removed?: number
          subscribers_count?: number
          successful_count?: number
          tag?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          action_text: string | null
          action_type: string | null
          action_url: string | null
          active: boolean | null
          campaign_type: string | null
          code: string | null
          created_at: string | null
          created_by: string | null
          description: string
          discount_percentage: number | null
          display_type: string | null
          end_date: string | null
          id: string
          priority: number | null
          show_to_premium: boolean | null
          start_date: string | null
          styling_variant: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_text?: string | null
          action_type?: string | null
          action_url?: string | null
          active?: boolean | null
          campaign_type?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          discount_percentage?: number | null
          display_type?: string | null
          end_date?: string | null
          id?: string
          priority?: number | null
          show_to_premium?: boolean | null
          start_date?: string | null
          styling_variant?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_text?: string | null
          action_type?: string | null
          action_url?: string | null
          active?: boolean | null
          campaign_type?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          discount_percentage?: number | null
          display_type?: string | null
          end_date?: string | null
          id?: string
          priority?: number | null
          show_to_premium?: boolean | null
          start_date?: string | null
          styling_variant?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      disposable_email_blocklist: {
        Row: {
          created_at: string
          domains: Json
          fetched_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domains?: Json
          fetched_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domains?: Json
          fetched_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_progress: {
        Row: {
          created_at: string
          errors: number
          id: string
          message: string
          progress: number
          result: Json | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at: string
          errors?: number
          id: string
          message: string
          progress?: number
          result?: Json | null
          status: string
          total?: number
          updated_at: string
        }
        Update: {
          created_at?: string
          errors?: number
          id?: string
          message?: string
          progress?: number
          result?: Json | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_admin: boolean | null
          is_email_exported: boolean | null
          is_email_verified: boolean | null
          is_premium: boolean | null
          last_reminder_at: string | null
          marketing_consent: boolean | null
          marketing_consent_at: string | null
          reminder_count: number | null
          subscription_consent: boolean | null
          subscription_consent_at: string | null
          university_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_admin?: boolean | null
          is_email_exported?: boolean | null
          is_email_verified?: boolean | null
          is_premium?: boolean | null
          last_reminder_at?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          reminder_count?: number | null
          subscription_consent?: boolean | null
          subscription_consent_at?: string | null
          university_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_email_exported?: boolean | null
          is_email_verified?: boolean | null
          is_premium?: boolean | null
          last_reminder_at?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          reminder_count?: number | null
          subscription_consent?: boolean | null
          subscription_consent_at?: string | null
          university_id?: string | null
          username?: string | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          type: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          type?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          type?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      question_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_private: boolean
          parent_id: string | null
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          parent_id?: string | null
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          parent_id?: string | null
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "question_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          ai_commentary_processed_at: string | null
          ai_commentary_queued_at: string | null
          ai_commentary_status: string | null
          case_text: string | null
          comment: string | null
          correct_answer: string
          created_at: string
          difficulty: number | null
          exam_name: string | null
          exam_semester: string | null
          exam_year: string | null
          filename: string
          first_answer_sample_size: number | null
          first_answer_stats: Json | null
          first_answer_stats_updated_at: string | null
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
          question_case: number | null
          question_exam_number: number | null
          show_image_after_answer: boolean | null
          subject: string
          university_id: string | null
          updated_at: string
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          ai_commentary_processed_at?: string | null
          ai_commentary_queued_at?: string | null
          ai_commentary_status?: string | null
          case_text?: string | null
          comment?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: number | null
          exam_name?: string | null
          exam_semester?: string | null
          exam_year?: string | null
          filename: string
          first_answer_sample_size?: number | null
          first_answer_stats?: Json | null
          first_answer_stats_updated_at?: string | null
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
          question_case?: number | null
          question_exam_number?: number | null
          show_image_after_answer?: boolean | null
          subject: string
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          ai_commentary_processed_at?: string | null
          ai_commentary_queued_at?: string | null
          ai_commentary_status?: string | null
          case_text?: string | null
          comment?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: number | null
          exam_name?: string | null
          exam_semester?: string | null
          exam_year?: string | null
          filename?: string
          first_answer_sample_size?: number | null
          first_answer_stats?: Json | null
          first_answer_stats_updated_at?: string | null
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
          question_case?: number | null
          question_exam_number?: number | null
          show_image_after_answer?: boolean | null
          subject?: string
          university_id?: string | null
          updated_at?: string
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
      session_question_progress: {
        Row: {
          attempts_count: number
          created_at: string
          id: string
          initial_answer: string | null
          is_correct: boolean | null
          last_answer: string | null
          question_id: string
          session_id: string
          updated_at: string
          user_id: string
          viewed_solution: boolean
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          id?: string
          initial_answer?: string | null
          is_correct?: boolean | null
          last_answer?: string | null
          question_id: string
          session_id: string
          updated_at?: string
          user_id: string
          viewed_solution?: boolean
        }
        Update: {
          attempts_count?: number
          created_at?: string
          id?: string
          initial_answer?: string | null
          is_correct?: boolean | null
          last_answer?: string | null
          question_id?: string
          session_id?: string
          updated_at?: string
          user_id?: string
          viewed_solution?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "session_question_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_question_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_jobs: {
        Row: {
          available_subjects: string[] | null
          created_at: string
          errors: number
          exam_name: string | null
          id: string
          message: string | null
          only_null_subjects: boolean | null
          payload: Json | null
          progress: number
          result: Json | null
          status: string
          total: number
          type: string
          university_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available_subjects?: string[] | null
          created_at?: string
          errors?: number
          exam_name?: string | null
          id: string
          message?: string | null
          only_null_subjects?: boolean | null
          payload?: Json | null
          progress?: number
          result?: Json | null
          status: string
          total?: number
          type: string
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available_subjects?: string[] | null
          created_at?: string
          errors?: number
          exam_name?: string | null
          id?: string
          message?: string | null
          only_null_subjects?: boolean | null
          payload?: Json | null
          progress?: number
          result?: Json | null
          status?: string
          total?: number
          type?: string
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          created_at: string
          current_index: number
          filter_settings: Json
          id: string
          question_ids: string[]
          status: string
          title: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_index?: number
          filter_settings: Json
          id?: string
          question_ids: string[]
          status?: string
          title: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_index?: number
          filter_settings?: Json
          id?: string
          question_ids?: string[]
          status?: string
          title?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      university_moderators: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_moderators_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_exam_questions: {
        Row: {
          created_at: string
          exam_id: string
          question_id: string
          source: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          question_id: string
          source: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          question_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "upcoming_exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "upcoming_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upcoming_exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_exams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          exam_name: string | null
          id: string
          subject: string | null
          title: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          exam_name?: string | null
          id?: string
          subject?: string | null
          title: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          exam_name?: string | null
          id?: string
          subject?: string | null
          title?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upcoming_exams_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_comment_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_ignored_questions: {
        Row: {
          created_at: string
          id: string
          marked_unclear_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marked_unclear_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marked_unclear_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unclear_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          archived_datasets: string[] | null
          created_at: string | null
          enhanced_ai_version: string | null
          id: string
          immediate_feedback: boolean | null
          keyboard_bindings: Json | null
          selected_ai_models: Json | null
          selected_university_datasets: string[] | null
          statistics_date_range: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived_datasets?: string[] | null
          created_at?: string | null
          enhanced_ai_version?: string | null
          id?: string
          immediate_feedback?: boolean | null
          keyboard_bindings?: Json | null
          selected_ai_models?: Json | null
          selected_university_datasets?: string[] | null
          statistics_date_range?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived_datasets?: string[] | null
          created_at?: string | null
          enhanced_ai_version?: string | null
          id?: string
          immediate_feedback?: boolean | null
          keyboard_bindings?: Json | null
          selected_ai_models?: Json | null
          selected_university_datasets?: string[] | null
          statistics_date_range?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_private_ai_quota: {
        Row: {
          created_at: string
          free_used_count: number
          id: string
          month_start: string
          paid_credits_remaining: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_used_count?: number
          id?: string
          month_start: string
          paid_credits_remaining?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_used_count?: number
          id?: string
          month_start?: string
          paid_credits_remaining?: number
          updated_at?: string
          user_id?: string
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
      ai_commentary_claim_next_batch: {
        Args: { batch_size: number; lease_seconds?: number; worker_id: string }
        Returns: {
          attempts: number
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          last_error: string | null
          lease_expires_at: string | null
          question_id: string
          status: string
          target_level: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_commentary_job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ai_private_credits_remaining: {
        Args: { p_user_id: string }
        Returns: number
      }
      ai_private_full_used_30d: { Args: { p_user_id: string }; Returns: number }
      ai_question_content_hash: {
        Args: { p_question_id: string }
        Returns: string
      }
      check_user_university_match: {
        Args: { university_uuid: string; user_uuid: string }
        Returns: boolean
      }
      exam_recon_assign_tasks: {
        Args: { p_seed?: string; p_workspace_id: string }
        Returns: string
      }
      exam_recon_create_split_canonical: {
        Args: { p_created_by?: string; p_from: string }
        Returns: string
      }
      exam_recon_find_similar_canonicals: {
        Args: {
          p_canonical_id: string
          p_limit?: number
          p_threshold?: number
          p_workspace_id: string
        }
        Returns: {
          candidate_id: string
          normalized_prompt: string
          prompt_hash: string
          similarity: number
        }[]
      }
      exam_recon_is_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      exam_recon_is_moderator: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      exam_recon_mark_stale_tasks: {
        Args: { p_stale_after?: string; p_workspace_id: string }
        Returns: number
      }
      exam_recon_merge_canonicals: {
        Args: { p_from: string; p_reason?: string; p_to: string }
        Returns: undefined
      }
      exam_recon_normalize_text: { Args: { p_text: string }; Returns: string }
      exam_recon_prompt_hash: { Args: { p_text: string }; Returns: string }
      exam_recon_publish_workspace: {
        Args: { p_workspace_id: string }
        Returns: number
      }
      exam_recon_resolve_canonical: {
        Args: { p_canonical_id: string }
        Returns: string
      }
      exam_recon_split_move_slots: {
        Args: {
          p_from: string
          p_new: string
          p_reason?: string
          p_slot_ids: string[]
        }
        Returns: undefined
      }
      get_exam_cohort_stats: {
        Args: { p_exam_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["exam_cohort_stats"]
        SetofOptions: {
          from: "*"
          to: "exam_cohort_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_question_session_id: {
        Args: { question_uuid: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_premium_user: { Args: { p_user_id: string }; Returns: boolean }
      is_verified_in_university: {
        Args: { p_university_id: string }
        Returns: boolean
      }
      update_question_answer_stats: {
        Args: never
        Returns: {
          execution_time_ms: number
          updated_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      exam_cohort_stats: {
        mean_score: number | null
        stddev_score: number | null
        sample_size: number | null
        user_score: number | null
        user_percentile: number | null
        user_answered: number | null
        user_correct: number | null
        user_answered_percentile: number | null
        user_accuracy_percentile: number | null
        cohort_answered_mean: number | null
        cohort_answered_median: number | null
        cohort_answered_p80: number | null
        cohort_accuracy_mean: number | null
        cohort_accuracy_median: number | null
        p0: number | null
        score_distribution: Json | null
        answered_distribution: Json | null
        accuracy_distribution: Json | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
