-- Fix RLS policies for adventures table to allow creation
-- This script ensures users can create adventures and be automatically added as members

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view adventures they are members of" ON adventures;
DROP POLICY IF EXISTS "Users can create adventures" ON adventures;
DROP POLICY IF EXISTS "Users can update their own adventures" ON adventures;
DROP POLICY IF EXISTS "Users can delete their own adventures" ON adventures;

-- Create simple, working policies for adventures
CREATE POLICY "Users can create adventures"
  ON adventures
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Users can view adventures they created or are members of"
  ON adventures
  FOR SELECT
  TO authenticated
  USING (
    creator_id = (SELECT auth.uid())
    OR
    id IN (
      SELECT adventure_id 
      FROM adventure_members 
      WHERE profile_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can update their adventures"
  ON adventures
  FOR UPDATE
  TO authenticated
  USING (creator_id = (SELECT auth.uid()))
  WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Creators can delete their adventures"
  ON adventures
  FOR DELETE
  TO authenticated
  USING (creator_id = (SELECT auth.uid()));

-- Ensure adventure_members policies exist
DROP POLICY IF EXISTS "Users can view adventure members" ON adventure_members;
DROP POLICY IF EXISTS "System can insert adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Creators can manage adventure members" ON adventure_members;

CREATE POLICY "Users can view adventure members"
  ON adventure_members
  FOR SELECT
  TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR
    adventure_id IN (
      SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can insert adventure members"
  ON adventure_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Creators can manage adventure members"
  ON adventure_members
  FOR ALL
  TO authenticated
  USING (
    adventure_id IN (
      SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
    )
  );

-- Recreate the trigger function to add creator as member
CREATE OR REPLACE FUNCTION handle_new_adventure()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add the creator as a member with 'creator' role
  INSERT INTO adventure_members (adventure_id, profile_id, role)
  VALUES (NEW.id, NEW.creator_id, 'creator');
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_adventure_created ON adventures;

CREATE TRIGGER on_adventure_created
  AFTER INSERT ON adventures
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_adventure();
