"""
Migration: Add sla_paused_minutes column to tickets table
This enables SLA clock pausing when ticket status is "Waiting on User"
"""

import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'helpdesk.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔄 Starting SLA Pause Migration...")
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'sla_paused_minutes' in columns:
            print("✅ Column 'sla_paused_minutes' already exists - skipping")
        else:
            # Add the column
            cursor.execute("""
                ALTER TABLE tickets
                ADD COLUMN sla_paused_minutes INTEGER DEFAULT 0
            """)
            print("✅ Added column 'sla_paused_minutes' to tickets table")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("\n📋 What this does:")
        print("   - When ticket status changes to 'Waiting on User', remaining SLA time is stored")
        print("   - SLA Monitor will skip tickets with 'Waiting on User' status (no escalation)")
        print("   - When ticket returns to active status, stored SLA time is restored")
        print("   - Perfect for waiting on parts delivery, user feedback, etc.")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
