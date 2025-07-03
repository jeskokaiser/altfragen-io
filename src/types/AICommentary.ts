export interface AICommentary {
  id: string;
  question_id: string;
  model_name: string;
  commentary_text: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface AICommentarySummary {
  id: string;
  question_id: string;
  summary_text: string;
  created_at: string;
  updated_at: string;
}

export interface AICommentarySettings {
  id: string;
  feature_enabled: boolean;
  models_enabled: {
    openai: boolean;
    claude: boolean;
    gemini: boolean;
  };
  auto_trigger_enabled: boolean;
  batch_size: number;
  processing_delay_minutes: number;
  rate_limit_per_user_per_day: number;
  free_ai_daily_limit?: number;
  created_at: string;
  updated_at: string;
}
