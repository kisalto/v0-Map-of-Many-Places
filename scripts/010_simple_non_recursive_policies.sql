-- Complete fix for infinite recursion in RLS policies
-- Strategy: Break the circular dependency between adventures and adventure_members
-- by using very simple policies without cross-table queries

-- ============================================================================
-- STEP 1: Drop ALL existing policies to start completely fresh
-- ============================================================================

-- Drop all adventure_members policies
DROP POLICY IF EXISTS "Users can view adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Users can view adventure members if they are members" ON adventure_members;
DROP POLICY IF EXISTS "Users can insert adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Users can update adventure members" ON adventure_members;
DROP POLICY IF EXISTS "Users can delete adventure members" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_select_policy" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_insert_policy" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_update_policy" ON adventure_members;
DROP POLICY IF EXISTS "adventure_members_delete_policy" ON adventure_members;

-- Drop all adventures policies
DROP POLICY IF EXISTS "Users can view their adventures" ON adventures;
DROP POLICY IF EXISTS "Users can insert adventures" ON adventures;
DROP POLICY IF EXISTS "Users can update their adventures" ON adventures;
DROP POLICY IF EXISTS "Users can delete their adventures" ON adventures;
DROP POLICY IF EXISTS "adventures_select_policy" ON adventures;
DROP POLICY IF EXISTS "adventures_insert_policy" ON adventures;
DROP POLICY IF EXISTS "adventures_update_policy" ON adventures;
DROP POLICY IF EXISTS "adventures_delete_policy" ON adventures;

-- ============================================================================
-- STEP 2: Create SIMPLE policies for adventures (no subqueries to adventure_members)
-- ============================================================================

-- SELECT: Users can only see adventures they created
-- We'll handle member access through a separate query in the application
CREATE POLICY "adventures_select_policy" ON adventures
FOR SELECT
USING (creator_id = (SELECT auth.uid()));

-- INSERT: Any authenticated user can create an adventure
CREATE POLICY "adventures_insert_policy" ON adventures
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL 
  AND creator_id = (SELECT auth.uid())
);

-- UPDATE: Only the creator can update
CREATE POLICY "adventures_update_policy" ON adventures
FOR UPDATE
USING (creator_id = (SELECT auth.uid()))
WITH CHECK (creator_id = (SELECT auth.uid()));

-- DELETE: Only the creator can delete
CREATE POLICY "adventures_delete_policy" ON adventures
FOR DELETE
USING (creator_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 3: Create SIMPLE policies for adventure_members (no subqueries to adventures)
-- ============================================================================

-- SELECT: Users can see their own memberships
-- For seeing other members, we'll query through the application after checking adventure access
CREATE POLICY "adventure_members_select_policy" ON adventure_members
FOR SELECT
USING (profile_id = (SELECT auth.uid()));

-- INSERT: Allow authenticated users to insert (trigger will use this)
-- The trigger runs with SECURITY DEFINER so it bypasses RLS, but we need this for manual invites
CREATE POLICY "adventure_members_insert_policy" ON adventure_members
FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- UPDATE: Users can only update their own membership
CREATE POLICY "adventure_members_update_policy" ON adventure_members
FOR UPDATE
USING (profile_id = (SELECT auth.uid()))
WITH CHECK (profile_id = (SELECT auth.uid()));

-- DELETE: Users can only delete their own membership (leave adventure)
CREATE POLICY "adventure_members_delete_policy" ON adventure_members
FOR DELETE
USING (profile_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 4: Ensure trigger is correct and uses SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_adventure()
RETURNS TRIGGER
SECURITY DEFINER -- This allows the trigger to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add the creator as a member with 'creator' role
  -- This will work because SECURITY DEFINER bypasses RLS
  INSERT INTO adventure_members (adventure_id, profile_id, role)
  VALUES (NEW.id, NEW.creator_id, 'creator');
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_adventure_created ON adventures;
CREATE TRIGGER on_adventure_created
  AFTER INSERT ON adventures
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_adventure();

-- ============================================================================
-- STEP 5: Create a helper function to get user's adventures (including as member)
-- ============================================================================

-- This function will be used by the application to get all adventures
-- a user has access to (either as creator or member)
CREATE OR REPLACE FUNCTION get_user_adventures(user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  creator_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_role text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.creator_id,
    a.created_at,
    a.updated_at,
    COALESCE(am.role, 'none') as user_role
  FROM adventures a
  LEFT JOIN adventure_members am ON a.id = am.adventure_id AND am.profile_id = user_id
  WHERE a.creator_id = user_id OR am.profile_id = user_id;
END;
$$;
