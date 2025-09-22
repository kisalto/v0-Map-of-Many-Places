-- Add creator_id column to timeline_entries table
ALTER TABLE timeline_entries 
ADD COLUMN creator_id UUID REFERENCES profiles(id);

-- Update existing entries to have a creator_id (set to the adventure creator for now)
UPDATE timeline_entries 
SET creator_id = (
  SELECT creator_id 
  FROM adventures 
  WHERE adventures.id = timeline_entries.adventure_id
);

-- Make creator_id NOT NULL after updating existing records
ALTER TABLE timeline_entries 
ALTER COLUMN creator_id SET NOT NULL;

-- Add RLS policy for timeline_entries with creator access
DROP POLICY IF EXISTS "Users can view timeline entries for their adventures" ON timeline_entries;
DROP POLICY IF EXISTS "Users can insert timeline entries for their adventures" ON timeline_entries;
DROP POLICY IF EXISTS "Users can update timeline entries for their adventures" ON timeline_entries;
DROP POLICY IF EXISTS "Users can delete timeline entries for their adventures" ON timeline_entries;

CREATE POLICY "Users can view timeline entries for their adventures" ON timeline_entries
  FOR SELECT USING (
    creator_id = auth.uid() OR
    adventure_id IN (
      SELECT id FROM adventures WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline entries for their adventures" ON timeline_entries
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    adventure_id IN (
      SELECT id FROM adventures WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline entries for their adventures" ON timeline_entries
  FOR UPDATE USING (
    creator_id = auth.uid() OR
    adventure_id IN (
      SELECT id FROM adventures WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline entries for their adventures" ON timeline_entries
  FOR DELETE USING (
    creator_id = auth.uid() OR
    adventure_id IN (
      SELECT id FROM adventures WHERE creator_id = auth.uid()
    )
  );
