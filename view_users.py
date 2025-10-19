"""Quick script to view all users in the database"""
import sqlite3
import os

db_path = "helpdesk.db"

if not os.path.exists(db_path):
    print(f"❌ Database file '{db_path}' not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n" + "="*70)
print("👥 ALL USERS IN DATABASE")
print("="*70)

cursor.execute("SELECT id, name, email, phone, role, is_active FROM users ORDER BY id")
users = cursor.fetchall()

if users:
    print(f"\nTotal Users: {len(users)}\n")
    for user in users:
        user_id, name, email, phone, role, is_active = user
        status = "✅ Active" if is_active else "❌ Inactive"
        print(f"ID: {user_id}")
        print(f"Name: {name}")
        print(f"Email: {email}")
        print(f"Phone: {phone}")
        print(f"Role: {role}")
        print(f"Status: {status}")
        print("-" * 70)
else:
    print("\n❌ No users found in database!\n")

print("="*70 + "\n")

conn.close()
