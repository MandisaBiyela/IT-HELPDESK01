import sqlite3

conn = sqlite3.connect('helpdesk.db')
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(sla_escalations)")
columns = [col[1] for col in cursor.fetchall()]
print(f"\nCurrent columns: {columns}\n")

# Add new columns
try:
    if 'gm_acknowledged' not in columns:
        cursor.execute("ALTER TABLE sla_escalations ADD COLUMN gm_acknowledged INTEGER DEFAULT 0")
        print("✅ Added gm_acknowledged")
    
    if 'acknowledged_by_id' not in columns:
        cursor.execute("ALTER TABLE sla_escalations ADD COLUMN acknowledged_by_id INTEGER")
        print("✅ Added acknowledged_by_id")
    
    if 'acknowledged_at_gm' not in columns:
        cursor.execute("ALTER TABLE sla_escalations ADD COLUMN acknowledged_at_gm TIMESTAMP")
        print("✅ Added acknowledged_at_gm")
    
    if 'acknowledgment_note' not in columns:
        cursor.execute("ALTER TABLE sla_escalations ADD COLUMN acknowledgment_note TEXT")
        print("✅ Added acknowledgment_note")
    
    conn.commit()
    print("\n✅ All fields added successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()
