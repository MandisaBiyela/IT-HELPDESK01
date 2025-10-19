"""Add real Ndabase users to the database"""
import sqlite3
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db_path = "helpdesk.db"

# Real users to add
users_to_add = [
    {
        "name": "Simphiwe (ICT GM)",
        "email": "simphiwe@ndabaseprinting.co.za",
        "phone": "+27123456784",
        "password": "simphiwe@supportndabase.com",
        "role": "ict_gm"
    },
    {
        "name": "Sthembiso (ICT Manager)",
        "email": "sthembiso@ndabaseprinting.co.za",
        "phone": "+27123456785",
        "password": "manager@ndabaseict123",
        "role": "ict_manager"
    },
    {
        "name": "Support Team (Helpdesk)",
        "email": "support@ndabaseprinting.co.za",
        "phone": "+27123456786",
        "password": "helpdesk@ndabase123",
        "role": "helpdesk_officer"
    },
    {
        "name": "Sifundo (Technician)",
        "email": "sifundo@ndabaseprinting.co.za",
        "phone": "+27123456787",
        "password": "sifundo@ndabaseict123",
        "role": "technician"
    }
]

print("\n" + "="*70)
print("👥 ADDING REAL NDABASE USERS TO DATABASE")
print("="*70)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

added_count = 0
skipped_count = 0

for user_data in users_to_add:
    email = user_data["email"]
    
    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = cursor.fetchone()
    
    if existing:
        print(f"\n⚠️  SKIPPED: {user_data['name']}")
        print(f"   Email {email} already exists in database")
        skipped_count += 1
        continue
    
    # Hash password
    hashed_password = pwd_context.hash(user_data["password"])
    
    # Insert user
    cursor.execute("""
        INSERT INTO users (name, email, phone, hashed_password, role, is_active, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        user_data["name"],
        user_data["email"],
        user_data["phone"],
        hashed_password,
        user_data["role"],
        1,
        None
    ))
    
    conn.commit()
    user_id = cursor.lastrowid
    
    print(f"\n✅ ADDED: {user_data['name']}")
    print(f"   ID: {user_id}")
    print(f"   Email: {user_data['email']}")
    print(f"   Role: {user_data['role']}")
    added_count += 1

conn.close()

print("\n" + "="*70)
print("📊 SUMMARY")
print("="*70)
print(f"✅ Added: {added_count} users")
print(f"⚠️  Skipped: {skipped_count} users (already exist)")
print("="*70)

print("\n" + "="*70)
print("🔑 LOGIN CREDENTIALS")
print("="*70)
print("\n1. ICT GM (Simphiwe)")
print("   Email: simphiwe@ndabaseprinting.co.za")
print("   Password: simphiwe@supportndabase.com")
print("\n2. ICT Manager (Sthembiso)")
print("   Email: sthembiso@ndabaseprinting.co.za")
print("   Password: manager@ndabaseict123")
print("\n3. Helpdesk Officer (Support)")
print("   Email: support@ndabaseprinting.co.za")
print("   Password: helpdesk@ndabase123")
print("\n4. Technician (Sifundo)")
print("   Email: sifundo@ndabaseprinting.co.za")
print("   Password: sifundo@ndabaseict123")
print("="*70)
print("\n✅ All users ready! You can now login at http://localhost:8000")
print("="*70 + "\n")
