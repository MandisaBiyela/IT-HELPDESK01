"""Remove specific users from the database"""
import sqlite3

db_path = "helpdesk.db"

# Users to remove (test accounts)
users_to_remove = [
    "tech1@ndabase.com",  # John Technician
]

print("\n" + "="*70)
print("🗑️  REMOVING USERS FROM DATABASE")
print("="*70)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for email in users_to_remove:
    # Check if user exists
    cursor.execute("SELECT id, name, email, role FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user:
        user_id, name, email, role = user
        print(f"\n🗑️  Deleting: {name}")
        print(f"   Email: {email}")
        print(f"   Role: {role}")
        
        # Delete the user
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        print(f"   ✅ Deleted successfully!")
    else:
        print(f"\n⚠️  User not found: {email}")

conn.close()

print("\n" + "="*70)
print("✅ USER REMOVAL COMPLETE")
print("="*70 + "\n")
