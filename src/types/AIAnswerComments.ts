
export interface AIAnswerComments {
  id: string;
  question_id: string;
  
  // Legacy General Comments (3 columns)
  openai_general_comment?: string;
  claude_general_comment?: string;
  gemini_general_comment?: string;
  
  // Legacy OpenAI Answer Comments (5 columns)
  openai_comment_a?: string;
  openai_comment_b?: string;
  openai_comment_c?: string;
  openai_comment_d?: string;
  openai_comment_e?: string;
  
  // Legacy Claude Answer Comments (5 columns)
  claude_comment_a?: string;
  claude_comment_b?: string;
  claude_comment_c?: string;
  claude_comment_d?: string;
  claude_comment_e?: string;
  
  // Legacy Gemini Answer Comments (5 columns)
  gemini_comment_a?: string;
  gemini_comment_b?: string;
  gemini_comment_c?: string;
  gemini_comment_d?: string;
  gemini_comment_e?: string;
  
  // New ChatGPT Comments
  chatgpt_chosen_answer?: string;
  chatgpt_general_comment?: string;
  chatgpt_comment_a?: string;
  chatgpt_comment_b?: string;
  chatgpt_comment_c?: string;
  chatgpt_comment_d?: string;
  chatgpt_comment_e?: string;
  chatgpt_regenerated_question?: string;
  chatgpt_regenerated_option_a?: string;
  chatgpt_regenerated_option_b?: string;
  chatgpt_regenerated_option_c?: string;
  chatgpt_regenerated_option_d?: string;
  chatgpt_regenerated_option_e?: string;
  
  // New Gemini Comments (new-gemini)
  gemini_chosen_answer?: string;
  gemini_new_general_comment?: string;
  gemini_new_comment_a?: string;
  gemini_new_comment_b?: string;
  gemini_new_comment_c?: string;
  gemini_new_comment_d?: string;
  gemini_new_comment_e?: string;
  gemini_regenerated_question?: string;
  gemini_regenerated_option_a?: string;
  gemini_regenerated_option_b?: string;
  gemini_regenerated_option_c?: string;
  gemini_regenerated_option_d?: string;
  gemini_regenerated_option_e?: string;
  
  // New Mistral Comments
  mistral_chosen_answer?: string;
  mistral_general_comment?: string;
  mistral_comment_a?: string;
  mistral_comment_b?: string;
  mistral_comment_c?: string;
  mistral_comment_d?: string;
  mistral_comment_e?: string;
  
  // New Perplexity Comments
  perplexity_chosen_answer?: string;
  perplexity_general_comment?: string;
  perplexity_comment_a?: string;
  perplexity_comment_b?: string;
  perplexity_comment_c?: string;
  perplexity_comment_d?: string;
  perplexity_comment_e?: string;
  
  // New DeepSeek Comments
  deepseek_chosen_answer?: string;
  deepseek_general_comment?: string;
  deepseek_comment_a?: string;
  deepseek_comment_b?: string;
  deepseek_comment_c?: string;
  deepseek_comment_d?: string;
  deepseek_comment_e?: string;
  
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

export type ModelName = 'openai' | 'claude' | 'gemini' | 'chatgpt' | 'new-gemini' | 'mistral' | 'perplexity' | 'deepseek';
export type AnswerOption = 'a' | 'b' | 'c' | 'd' | 'e';

export interface ModelComments {
  general?: string;
  chosenAnswer?: string;
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
    openai?: ModelComments;
    claude?: ModelComments;
    gemini?: ModelComments;
    chatgpt?: ModelComments;
    'new-gemini'?: ModelComments;
    mistral?: ModelComments;
    perplexity?: ModelComments;
    deepseek?: ModelComments;
  };
}
