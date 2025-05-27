
export interface AIAnswerComments {
  id: string;
  question_id: string;
  
  // General Comments (3 columns)
  openai_general_comment?: string;
  claude_general_comment?: string;
  gemini_general_comment?: string;
  
  // OpenAI Answer Comments (5 columns)
  openai_comment_a?: string;
  openai_comment_b?: string;
  openai_comment_c?: string;
  openai_comment_d?: string;
  openai_comment_e?: string;
  
  // Claude Answer Comments (5 columns)
  claude_comment_a?: string;
  claude_comment_b?: string;
  claude_comment_c?: string;
  claude_comment_d?: string;
  claude_comment_e?: string;
  
  // Gemini Answer Comments (5 columns)
  gemini_comment_a?: string;
  gemini_comment_b?: string;
  gemini_comment_c?: string;
  gemini_comment_d?: string;
  gemini_comment_e?: string;
  
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface AICommentarySummaryExtended {
  id: string;
  question_id: string;
  
  // Summary Comments (6 columns)
  summary_general_comment?: string;
  summary_comment_a?: string;
  summary_comment_b?: string;
  summary_comment_c?: string;
  summary_comment_d?: string;
  summary_comment_e?: string;
  
  // Agreement Analysis (1 column)
  model_agreement_analysis?: string;
  
  created_at: string;
  updated_at: string;
}

export type ModelName = 'openai' | 'claude' | 'gemini';
export type AnswerOption = 'a' | 'b' | 'c' | 'd' | 'e';

export interface ModelComments {
  general?: string;
  answers: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  };
}

export interface AICommentaryData {
  answerComments?: AIAnswerComments;
  summary?: AICommentarySummaryExtended;
  models: {
    openai: ModelComments;
    claude: ModelComments;
    gemini: ModelComments;
  };
}
