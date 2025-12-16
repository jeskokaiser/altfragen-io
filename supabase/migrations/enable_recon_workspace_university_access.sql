-- Create table for university-wide moderator roles
CREATE TABLE IF NOT EXISTS university_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(university_id, user_id)
);

-- Enable RLS on university_moderators
ALTER TABLE university_moderators ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view moderators of their university
CREATE POLICY IF NOT EXISTS "Users can view moderators of their university"
ON university_moderators
FOR SELECT
USING (
  university_id IN (
    SELECT university_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Only admins can manage university moderators
CREATE POLICY IF NOT EXISTS "Only admins can manage university moderators"
ON university_moderators
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Enable RLS on exam_recon_workspaces if not already enabled
ALTER TABLE exam_recon_workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view workspaces from their university" ON exam_recon_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces for their university" ON exam_recon_workspaces;
DROP POLICY IF EXISTS "Only moderators can create workspaces for their university" ON exam_recon_workspaces;
DROP POLICY IF EXISTS "Users can update workspaces they created or are moderators" ON exam_recon_workspaces;
DROP POLICY IF EXISTS "Users can delete workspaces they created" ON exam_recon_workspaces;

-- Policy: Users can view all workspaces from their university
CREATE POLICY "Users can view workspaces from their university"
ON exam_recon_workspaces
FOR SELECT
USING (
  university_id IN (
    SELECT university_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Only moderators can create workspaces for their university
-- A user is a moderator if they are in the university_moderators table for that university
CREATE POLICY "Only moderators can create workspaces for their university"
ON exam_recon_workspaces
FOR INSERT
WITH CHECK (
  university_id IN (
    SELECT university_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM university_moderators 
    WHERE university_id = exam_recon_workspaces.university_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Users can update workspaces they created, are workspace moderators, or are university moderators
CREATE POLICY "Users can update workspaces they created or are moderators"
ON exam_recon_workspaces
FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM exam_recon_memberships 
    WHERE workspace_id = exam_recon_workspaces.id 
    AND user_id = auth.uid() 
    AND role = 'moderator'
    AND active = true
  )
  OR EXISTS (
    SELECT 1 
    FROM university_moderators 
    WHERE university_id = exam_recon_workspaces.university_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Users can delete workspaces they created
CREATE POLICY "Users can delete workspaces they created"
ON exam_recon_workspaces
FOR DELETE
USING (created_by = auth.uid());

-- ============================================================================
-- RLS Policies for exam_recon_variants
-- ============================================================================

-- Enable RLS on exam_recon_variants if not already enabled
ALTER TABLE exam_recon_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view variants from their university" ON exam_recon_variants;
DROP POLICY IF EXISTS "Moderators can create variants" ON exam_recon_variants;
DROP POLICY IF EXISTS "Moderators can update variants" ON exam_recon_variants;
DROP POLICY IF EXISTS "Moderators can delete variants" ON exam_recon_variants;

-- Policy: Users can view variants from workspaces of their university
CREATE POLICY "Users can view variants from their university"
ON exam_recon_variants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM exam_recon_workspaces 
    WHERE exam_recon_workspaces.id = exam_recon_variants.workspace_id
    AND exam_recon_workspaces.university_id IN (
      SELECT university_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Policy: Only moderators can create variants
CREATE POLICY "Moderators can create variants"
ON exam_recon_variants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM exam_recon_workspaces 
    WHERE exam_recon_workspaces.id = exam_recon_variants.workspace_id
    AND (
      exam_recon_workspaces.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM exam_recon_memberships 
        WHERE workspace_id = exam_recon_workspaces.id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
        AND active = true
      )
      OR EXISTS (
        SELECT 1 
        FROM university_moderators 
        WHERE university_id = exam_recon_workspaces.university_id 
        AND user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only moderators can update variants
CREATE POLICY "Moderators can update variants"
ON exam_recon_variants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM exam_recon_workspaces 
    WHERE exam_recon_workspaces.id = exam_recon_variants.workspace_id
    AND (
      exam_recon_workspaces.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM exam_recon_memberships 
        WHERE workspace_id = exam_recon_workspaces.id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
        AND active = true
      )
      OR EXISTS (
        SELECT 1 
        FROM university_moderators 
        WHERE university_id = exam_recon_workspaces.university_id 
        AND user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only moderators can delete variants
CREATE POLICY "Moderators can delete variants"
ON exam_recon_variants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM exam_recon_workspaces 
    WHERE exam_recon_workspaces.id = exam_recon_variants.workspace_id
    AND (
      exam_recon_workspaces.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM exam_recon_memberships 
        WHERE workspace_id = exam_recon_workspaces.id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
        AND active = true
      )
      OR EXISTS (
        SELECT 1 
        FROM university_moderators 
        WHERE university_id = exam_recon_workspaces.university_id 
        AND user_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- RLS Policies for exam_recon_variant_slots
-- ============================================================================

-- Enable RLS on exam_recon_variant_slots if not already enabled
ALTER TABLE exam_recon_variant_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view slots from their university" ON exam_recon_variant_slots;
DROP POLICY IF EXISTS "Moderators can create slots" ON exam_recon_variant_slots;
DROP POLICY IF EXISTS "Moderators can update slots" ON exam_recon_variant_slots;
DROP POLICY IF EXISTS "Moderators can delete slots" ON exam_recon_variant_slots;

-- Policy: Users can view slots from variants of their university
CREATE POLICY "Users can view slots from their university"
ON exam_recon_variant_slots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM exam_recon_variants
    JOIN exam_recon_workspaces ON exam_recon_workspaces.id = exam_recon_variants.workspace_id
    WHERE exam_recon_variants.id = exam_recon_variant_slots.variant_id
    AND exam_recon_workspaces.university_id IN (
      SELECT university_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Policy: Only moderators can create slots
CREATE POLICY "Moderators can create slots"
ON exam_recon_variant_slots
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM exam_recon_variants
    JOIN exam_recon_workspaces ON exam_recon_workspaces.id = exam_recon_variants.workspace_id
    WHERE exam_recon_variants.id = exam_recon_variant_slots.variant_id
    AND (
      exam_recon_workspaces.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM exam_recon_memberships 
        WHERE workspace_id = exam_recon_workspaces.id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
        AND active = true
      )
      OR EXISTS (
        SELECT 1 
        FROM university_moderators 
        WHERE university_id = exam_recon_workspaces.university_id 
        AND user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only moderators can update slots
CREATE POLICY "Moderators can update slots"
ON exam_recon_variant_slots
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM exam_recon_variants
    JOIN exam_recon_workspaces ON exam_recon_workspaces.id = exam_recon_variants.workspace_id
    WHERE exam_recon_variants.id = exam_recon_variant_slots.variant_id
    AND (
      exam_recon_workspaces.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM exam_recon_memberships 
        WHERE workspace_id = exam_recon_workspaces.id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
        AND active = true
      )
      OR EXISTS (
        SELECT 1 
        FROM university_moderators 
        WHERE university_id = exam_recon_workspaces.university_id 
        AND user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only moderators can delete slots
CREATE POLICY "Moderators can delete slots"
ON exam_recon_variant_slots
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM exam_recon_variants
    JOIN exam_recon_workspaces ON exam_recon_workspaces.id = exam_recon_variants.workspace_id
    WHERE exam_recon_variants.id = exam_recon_variant_slots.variant_id
    AND (
      exam_recon_workspaces.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM exam_recon_memberships 
        WHERE workspace_id = exam_recon_workspaces.id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
        AND active = true
      )
      OR EXISTS (
        SELECT 1 
        FROM university_moderators 
        WHERE university_id = exam_recon_workspaces.university_id 
        AND user_id = auth.uid()
      )
    )
  )
);


