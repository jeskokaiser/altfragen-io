
-- Create table for user unclear questions
CREATE TABLE public.user_unclear_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  marked_unclear_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Add Row Level Security
ALTER TABLE public.user_unclear_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for user unclear questions
CREATE POLICY "Users can view their own unclear questions" 
  ON public.user_unclear_questions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unclear questions" 
  ON public.user_unclear_questions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unclear questions" 
  ON public.user_unclear_questions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_user_unclear_questions_user_id ON public.user_unclear_questions(user_id);
CREATE INDEX idx_user_unclear_questions_question_id ON public.user_unclear_questions(question_id);
