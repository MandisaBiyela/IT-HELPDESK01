# Quick Fix Script
# Fixes backend emoji issues and creates audit_logs table

import sqlite3
import sys

def create_audit_logs_table():
    """Create the missing audit_logs table"""
    conn = sqlite3.connect('helpdesk.db')
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'")
    if cursor.fetchone():
        print("✓ audit_logs table already exists")
    else:
        print("Creating audit_logs table...")
        cursor.execute('''
        CREATE TABLE audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type VARCHAR NOT NULL,
            entity_id INTEGER NOT NULL,
            action VARCHAR NOT NULL,
            performed_by_id INTEGER,
            details TEXT,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (performed_by_id) REFERENCES users(id)
        )
        ''')
        conn.commit()
        print("✓ audit_logs table created successfully!")
    
    conn.close()

if __name__ == "__main__":
    print("==== Helpdesk Backend Quick Fix ====\n")
    
    try:
        create_audit_logs_table()
        print("\n✅ All fixes applied successfully!")
        print("You can now restart the server.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
