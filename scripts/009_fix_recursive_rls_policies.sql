-- Fix infinite recursion in adventure_members RLS policies
-- The problem: policies that query adventure_members to check if user is a member
-- cause infinite recursion when trying to access adventure_members

-- Drop all existing policies on adventure_members to start fresh
DROP POLICY IF EXISTS "Users can view adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Users can view adventure members if they are members" ON adventure_members;
DROP POLICY IF EXISTS "Users can insert adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Users can update adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Users can delete adventure members" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_select_policy" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_insert_policy" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_update_policy" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_delete_policy" ON adventure_members;

-- Create non-recursive policies for adventure_members
-- Strategy: Use adventures table to check permissions, not adventure_members itself

-- SELECT: Users can view members of adventures they created OR their own membership record
CREATE POLICY "adventure_members_select_policy" ON adventure_members
FOR SELECT
USING (
  -- User can see their own membership
  profile_id = (SELECT auth.uid())
  OR
  -- User can see members of adventures they created
  adventure_id IN (
    SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
  )
);

-- INSERT: Only the system (via trigger) or adventure creators can add members
CREATE POLICY "adventure_members_insert_policy" ON adventure_members
FOR INSERT
WITH CHECK (
  -- Allow if user is the creator of the adventure
  adventure_id IN (
    SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
  )
  OR
  -- Allow if inserting their own membership (for trigger)
  profile_id = (SELECT auth.uid())
);

-- UPDATE: Only adventure creators can update member roles
CREATE POLICY "adventure_members_update_policy" ON adventure_members
FOR UPDATE
USING (
  adventure_id IN (
    SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  adventure_id IN (
    SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
  )
);

-- DELETE: Only adventure creators can remove members
CREATE POLICY "adventure_members_delete_policy" ON adventure_members
FOR DELETE
USING (
  adventure_id IN (
    SELECT id FROM adventures WHERE creator_id = (SELECT auth.uid())
  )
);

-- Also fix adventures policies to be non-recursive
DROP POLICY IF EXISTS "Users can view their adventures" ON adventures;
DROP POLICY IF EXISTS "Users can insert adventures" ON adventures;
DROP POLICY IF EXISTS "Users can update their adventures" ON adventures;
DROP POLICY IF EXISTS "Users can delete their adventures" ON adventures;
DROP POLICY IF EXISTS "adventures_select_policy" ON adventures;
DROP POLICY IF EXISTS "adventures_insert_policy" ON adventures;
DROP POLICY IF EXISTS "adventures_update_policy" ON adventures;
DROP POLICY IF EXISTS "adventures_delete_policy" ON adventures;

-- Simple, non-recursive policies for adventures
CREATE POLICY "adventures_select_policy" ON adventures
FOR SELECT
USING (
  -- User created the adventure
  creator_id = (SELECT auth.uid())
  OR
  -- User is a member (check adventure_members without recursion)
  id IN (
    SELECT adventure_id FROM adventure_members WHERE profile_id = (SELECT auth.uid())
  )
);

CREATE POLICY "adventures_insert_policy" ON adventures
FOR INSERT
WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "adventures_update_policy" ON adventures
FOR UPDATE
USING (creator_id = (SELECT auth.uid()))
WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "adventures_delete_policy" ON adventures
FOR DELETE
USING (creator_id = (SELECT auth.uid()));

-- Verify the trigger exists and is correct
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

-- Recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS on_adventure_created ON adventures;
CREATE TRIGGER on_adventure_created
  AFTER INSERT ON adventures
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_adventure();
