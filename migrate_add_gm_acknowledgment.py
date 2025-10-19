"""
Migration: Add GM acknowledgment fields to sla_escalations table
Run this once to update your database
"""
import sqlite3
from datetime import datetime

def migrate():
    conn = sqlite3.connect('helpdesk.db')
    cursor = conn.cursor()
    
    print("\n🔄 Starting database migration...")
    print("=" * 50)
    
    try:
        # Get current table structure
        cursor.execute("PRAGMA table_info(sla_escalations)")
        existing_columns = {col[1] for col in cursor.fetchall()}
        
        migrations_applied = []
        
        # Add gm_acknowledged column
        if 'gm_acknowledged' not in existing_columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN gm_acknowledged INTEGER DEFAULT 0
            """)
            migrations_applied.append("✅ Added gm_acknowledged column")
        
        # Add acknowledged_by_id column
        if 'acknowledged_by_id' not in existing_columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN acknowledged_by_id INTEGER
            """)
            migrations_applied.append("✅ Added acknowledged_by_id column")
        
        # Add acknowledged_at_gm column
        if 'acknowledged_at_gm' not in existing_columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN acknowledged_at_gm TIMESTAMP
            """)
            migrations_applied.append("✅ Added acknowledged_at_gm column")
        
        # Add acknowledgment_note column
        if 'acknowledgment_note' not in existing_columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN acknowledgment_note TEXT
            """)
            migrations_applied.append("✅ Added acknowledgment_note column")
        
        conn.commit()
        
        if migrations_applied:
            print("\n📝 Applied migrations:")
            for migration in migrations_applied:
                print(f"  {migration}")
        else:
            print("\n✓ All columns already exist - no migration needed")
        
        # Show final table structure
        print("\n📋 Final table structure:")
        cursor.execute("PRAGMA table_info(sla_escalations)")
        for col in cursor.fetchall():
            print(f"  • {col[1]:25} {col[2]}")
        
        print("\n" + "=" * 50)
        print("✅ Migration completed successfully!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("✓ Columns already exist - migration not needed")
        else:
            print(f"❌ Error: {e}")
            conn.rollback()
            raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
