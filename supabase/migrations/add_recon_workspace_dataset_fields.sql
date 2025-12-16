-- Add new fields to exam_recon_workspaces table (nullable first)
ALTER TABLE exam_recon_workspaces
ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dataset_filename TEXT,
ADD COLUMN IF NOT EXISTS dataset_semester TEXT,
ADD COLUMN IF NOT EXISTS dataset_year TEXT,
ADD COLUMN IF NOT EXISTS dataset_subject TEXT;

-- Update existing rows to have valid defaults (if any exist)
-- For due_at, set to a future date if not already set
UPDATE exam_recon_workspaces
SET due_at = NOW() + INTERVAL '30 days'
WHERE due_at IS NULL;

-- For dataset_filename, use title as fallback
UPDATE exam_recon_workspaces
SET dataset_filename = COALESCE(title, 'Unnamed Dataset')
WHERE dataset_filename IS NULL;

-- Now make due_at and dataset_filename NOT NULL
ALTER TABLE exam_recon_workspaces
ALTER COLUMN due_at SET NOT NULL,
ALTER COLUMN due_at SET DEFAULT NOW(),
ALTER COLUMN dataset_filename SET NOT NULL,
ALTER COLUMN dataset_filename SET DEFAULT '';

-- Create index on due_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_exam_recon_workspaces_due_at 
ON exam_recon_workspaces(due_at);

-- Create index on dataset fields for efficient lookups
CREATE INDEX IF NOT EXISTS idx_exam_recon_workspaces_dataset 
ON exam_recon_workspaces(dataset_filename, dataset_semester, dataset_year, dataset_subject);

-- Update the exam_recon_publish_workspace function to use dataset fields
-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS exam_recon_publish_workspace(UUID);

-- Recreate the function with dataset field support
CREATE OR REPLACE FUNCTION exam_recon_publish_workspace(p_workspace_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace RECORD;
  v_slot RECORD;
  v_canonical RECORD;
  v_draft RECORD;
  v_question_count INTEGER := 0;
  v_exam_name TEXT;
BEGIN
  -- Get workspace details
  SELECT * INTO v_workspace
  FROM exam_recon_workspaces
  WHERE id = p_workspace_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found: %', p_workspace_id;
  END IF;
  
  -- Determine exam_name: use dataset_filename if available, otherwise workspace title
  v_exam_name := COALESCE(v_workspace.dataset_filename, v_workspace.title);
  
  -- Get all complete or auto_linked slots
  FOR v_slot IN
    SELECT s.*
    FROM exam_recon_variant_slots s
    JOIN exam_recon_variants v ON v.id = s.variant_id
    WHERE v.workspace_id = p_workspace_id
      AND s.status IN ('complete', 'auto_linked')
      AND s.canonical_question_id IS NOT NULL
  LOOP
    -- Get canonical question
    SELECT * INTO v_canonical
    FROM exam_recon_canonical_questions
    WHERE id = v_slot.canonical_question_id;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    -- Get draft content
    SELECT * INTO v_draft
    FROM exam_recon_question_drafts
    WHERE canonical_question_id = v_canonical.id;
    
    IF NOT FOUND OR v_draft.content IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Extract question data from draft content
    -- Insert into questions table with dataset metadata
    INSERT INTO questions (
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      subject,
      correct_answer,
      comment,
      filename,
      difficulty,
      visibility,
      university_id,
      exam_name,
      exam_semester,
      exam_year,
      show_image_after_answer,
      ai_commentary_status
    ) VALUES (
      COALESCE(v_draft.content->>'prompt', ''),
      COALESCE((v_draft.content->'options'->0->>'text')::TEXT, ''),
      COALESCE((v_draft.content->'options'->1->>'text')::TEXT, ''),
      COALESCE((v_draft.content->'options'->2->>'text')::TEXT, ''),
      COALESCE((v_draft.content->'options'->3->>'text')::TEXT, ''),
      COALESCE((v_draft.content->'options'->4->>'text')::TEXT, ''),
      COALESCE(v_workspace.dataset_subject, v_workspace.subject, ''),
      COALESCE(v_draft.content->>'correct_answer', ''),
      COALESCE(v_draft.content->>'solution_explanation', ''),
      v_exam_name,
      3, -- default difficulty
      'university',
      v_workspace.university_id,
      v_exam_name,
      v_workspace.dataset_semester,
      v_workspace.dataset_year,
      COALESCE((v_draft.content->>'show_image_after_answer')::BOOLEAN, true),
      'pending'
    );
    
    v_question_count := v_question_count + 1;
  END LOOP;
  
  -- Update workspace status to published
  UPDATE exam_recon_workspaces
  SET status = 'published',
      published_at = NOW()
  WHERE id = p_workspace_id;
  
  RETURN v_question_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exam_recon_publish_workspace(UUID) TO authenticated;

