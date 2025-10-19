import sqlite3

conn = sqlite3.connect('helpdesk.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE sla_escalations ADD COLUMN gm_acknowledged INTEGER DEFAULT 0")
    print("Added gm_acknowledged")
except:
    print("gm_acknowledged already exists")

try:
    cursor.execute("ALTER TABLE sla_escalations ADD COLUMN acknowledged_by_id INTEGER")
    print("Added acknowledged_by_id")
except:
    print("acknowledged_by_id already exists")

try:
    cursor.execute("ALTER TABLE sla_escalations ADD COLUMN acknowledged_at_gm TIMESTAMP")
    print("Added acknowledged_at_gm")
except:
    print("acknowledged_at_gm already exists")

try:
    cursor.execute("ALTER TABLE sla_escalations ADD COLUMN acknowledgment_note TEXT")
    print("Added acknowledgment_note")
except:
    print("acknowledgment_note already exists")

conn.commit()
conn.close()
print("\nMigration complete!")
