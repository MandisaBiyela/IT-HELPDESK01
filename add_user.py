"""Add a custom user directly to the database"""
import sqlite3
from passlib.context import CryptContext
from datetime import datetime

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db_path = "helpdesk.db"

print("\n" + "="*70)
print("👤 ADD NEW USER TO DATABASE")
print("="*70)

# Get user details
print("\nEnter user details:")
name = input("Full Name: ").strip()
email = input("Email: ").strip().lower()
phone = input("Phone (e.g., +27123456789): ").strip()
password = input("Password: ").strip()

print("\nAvailable Roles:")
print("1. helpdesk_officer - Can create and manage tickets")
print("2. technician - Can work on assigned tickets")
print("3. ict_manager - Can view reports and manage tickets")
print("4. ict_gm - General Manager with full access")
print("5. admin - System administrator")

role_choice = input("\nSelect role (1-5): ").strip()

role_map = {
    "1": "helpdesk_officer",
    "2": "technician",
    "3": "ict_manager",
    "4": "ict_gm",
    "5": "admin"
}

role = role_map.get(role_choice, "helpdesk_officer")

# Validation
if not name or not email or not phone or not password:
    print("\n❌ All fields are required!")
    exit(1)

if len(password) < 6:
    print("\n❌ Password must be at least 6 characters!")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if email exists
cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
if cursor.fetchone():
    print(f"\n❌ Email {email} already exists in database!")
    conn.close()
    exit(1)

# Hash password
hashed_password = pwd_context.hash(password)

# Insert user
cursor.execute("""
    INSERT INTO users (name, email, phone, hashed_password, role, is_active, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (name, email, phone, hashed_password, role, 1, None))

conn.commit()
user_id = cursor.lastrowid

print("\n" + "="*70)
print("✅ USER ADDED SUCCESSFULLY!")
print("="*70)
print(f"ID: {user_id}")
print(f"Name: {name}")
print(f"Email: {email}")
print(f"Phone: {phone}")
print(f"Role: {role}")
print(f"Password: {password}")
print("="*70)
print("\nYou can now login with these credentials!")
print("="*70 + "\n")

conn.close()
