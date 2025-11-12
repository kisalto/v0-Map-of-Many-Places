import { neon } from "@neondatabase/serverless"

async function executeMigration() {
  const databaseUrl = process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error("Error: POSTGRES_URL environment variable not found")
    return
  }

  const sql = neon(databaseUrl)

  try {
    console.log("Connected to database successfully")

    // Check if creator_id column already exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timeline_entries' 
      AND column_name = 'creator_id'
    `

    if (columnCheck.length > 0) {
      console.log("creator_id column already exists in timeline_entries table")
    } else {
      console.log("Adding creator_id column to timeline_entries table...")

      // Add creator_id column
      await sql`
        ALTER TABLE timeline_entries 
        ADD COLUMN creator_id UUID REFERENCES profiles(id)
      `

      console.log("creator_id column added successfully")

      // Update existing entries to have a creator_id
      await sql`
        UPDATE timeline_entries 
        SET creator_id = (
          SELECT creator_id 
          FROM adventures 
          WHERE adventures.id = timeline_entries.adventure_id
        )
      `

      console.log("Updated existing timeline entries with creator_id")

      // Make creator_id NOT NULL
      await sql`
        ALTER TABLE timeline_entries 
        ALTER COLUMN creator_id SET NOT NULL
      `

      console.log("Set creator_id as NOT NULL")
    }

    // Update RLS policies
    console.log("Updating RLS policies...")

    // Drop existing policies
    await sql`DROP POLICY IF EXISTS "Users can view timeline entries for their adventures" ON timeline_entries`
    await sql`DROP POLICY IF EXISTS "Users can insert timeline entries for their adventures" ON timeline_entries`
    await sql`DROP POLICY IF EXISTS "Users can update timeline entries for their adventures" ON timeline_entries`
    await sql`DROP POLICY IF EXISTS "Users can delete timeline entries for their adventures" ON timeline_entries`

    // Create new policies
    await sql`
      CREATE POLICY "Users can view timeline entries for their adventures" ON timeline_entries
        FOR SELECT USING (
          creator_id = auth.uid() OR
          adventure_id IN (
            SELECT id FROM adventures WHERE creator_id = auth.uid()
          )
        )
    `

    await sql`
      CREATE POLICY "Users can insert timeline entries for their adventures" ON timeline_entries
        FOR INSERT WITH CHECK (
          creator_id = auth.uid() AND
          adventure_id IN (
            SELECT id FROM adventures WHERE creator_id = auth.uid()
          )
        )
    `

    await sql`
      CREATE POLICY "Users can update timeline entries for their adventures" ON timeline_entries
        FOR UPDATE USING (
          creator_id = auth.uid() OR
          adventure_id IN (
            SELECT id FROM adventures WHERE creator_id = auth.uid()
          )
        )
    `

    await sql`
      CREATE POLICY "Users can delete timeline entries for their adventures" ON timeline_entries
        FOR DELETE USING (
          creator_id = auth.uid() OR
          adventure_id IN (
            SELECT id FROM adventures WHERE creator_id = auth.uid()
          )
        )
    `

    console.log("RLS policies updated successfully")
    console.log("Migration completed successfully!")

    // Verify the schema
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'timeline_entries'
      ORDER BY ordinal_position
    `

    console.log("\nCurrent timeline_entries schema:")
    columns.forEach((col: any) => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "NULL" : "NOT NULL"})`)
    })
  } catch (error) {
    console.error("Error executing migration:", error)
    throw error
  }
}

executeMigration()
