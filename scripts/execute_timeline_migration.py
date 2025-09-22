import os
import psycopg2
from psycopg2.extras import RealDictCursor

def execute_migration():
    # Get database connection from environment variables
    database_url = os.getenv('POSTGRES_URL')
    
    if not database_url:
        print("Error: POSTGRES_URL environment variable not found")
        return
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Connected to database successfully")
        
        # Check if creator_id column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'timeline_entries' 
            AND column_name = 'creator_id'
        """)
        
        if cursor.fetchone():
            print("creator_id column already exists in timeline_entries table")
        else:
            print("Adding creator_id column to timeline_entries table...")
            
            # Add creator_id column
            cursor.execute("""
                ALTER TABLE timeline_entries 
                ADD COLUMN creator_id UUID REFERENCES profiles(id);
            """)
            
            print("creator_id column added successfully")
            
            # Update existing entries to have a creator_id
            cursor.execute("""
                UPDATE timeline_entries 
                SET creator_id = (
                  SELECT creator_id 
                  FROM adventures 
                  WHERE adventures.id = timeline_entries.adventure_id
                );
            """)
            
            print("Updated existing timeline entries with creator_id")
            
            # Make creator_id NOT NULL
            cursor.execute("""
                ALTER TABLE timeline_entries 
                ALTER COLUMN creator_id SET NOT NULL;
            """)
            
            print("Set creator_id as NOT NULL")
        
        # Update RLS policies
        print("Updating RLS policies...")
        
        # Drop existing policies
        cursor.execute('DROP POLICY IF EXISTS "Users can view timeline entries for their adventures" ON timeline_entries;')
        cursor.execute('DROP POLICY IF EXISTS "Users can insert timeline entries for their adventures" ON timeline_entries;')
        cursor.execute('DROP POLICY IF EXISTS "Users can update timeline entries for their adventures" ON timeline_entries;')
        cursor.execute('DROP POLICY IF EXISTS "Users can delete timeline entries for their adventures" ON timeline_entries;')
        
        # Create new policies
        cursor.execute("""
            CREATE POLICY "Users can view timeline entries for their adventures" ON timeline_entries
              FOR SELECT USING (
                creator_id = auth.uid() OR
                adventure_id IN (
                  SELECT id FROM adventures WHERE creator_id = auth.uid()
                )
              );
        """)
        
        cursor.execute("""
            CREATE POLICY "Users can insert timeline entries for their adventures" ON timeline_entries
              FOR INSERT WITH CHECK (
                creator_id = auth.uid() AND
                adventure_id IN (
                  SELECT id FROM adventures WHERE creator_id = auth.uid()
                )
              );
        """)
        
        cursor.execute("""
            CREATE POLICY "Users can update timeline entries for their adventures" ON timeline_entries
              FOR UPDATE USING (
                creator_id = auth.uid() OR
                adventure_id IN (
                  SELECT id FROM adventures WHERE creator_id = auth.uid()
                )
              );
        """)
        
        cursor.execute("""
            CREATE POLICY "Users can delete timeline entries for their adventures" ON timeline_entries
              FOR DELETE USING (
                creator_id = auth.uid() OR
                adventure_id IN (
                  SELECT id FROM adventures WHERE creator_id = auth.uid()
                )
              );
        """)
        
        print("RLS policies updated successfully")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify the schema
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'timeline_entries'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\nCurrent timeline_entries schema:")
        for col in columns:
            print(f"  {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
        
    except Exception as e:
        print(f"Error executing migration: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    execute_migration()
