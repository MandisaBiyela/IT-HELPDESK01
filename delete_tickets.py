"""Delete all tickets from database"""
import sqlite3

db_path = "helpdesk.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Count tickets before deletion
cursor.execute("SELECT COUNT(*) FROM tickets")
count_before = cursor.fetchone()[0]

print(f"\n🗑️  Tickets before: {count_before}")

# Delete all tickets
cursor.execute("DELETE FROM tickets")
conn.commit()

# Count tickets after deletion
cursor.execute("SELECT COUNT(*) FROM tickets")
count_after = cursor.fetchone()[0]

print(f"✅ Tickets after: {count_after}")
print(f"✅ Deleted {count_before} ticket(s)\n")

conn.close()
