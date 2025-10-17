"""
Fix user passwords in database
"""
import sqlite3
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Convert password to bytes and hash it
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def fix_users():
    """Update user passwords in database"""
    conn = sqlite3.connect('helpdesk.db')
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("Users table not found!")
        conn.close()
        return
    
    # Delete all existing users
    cursor.execute("DELETE FROM users")
    
    # Create users with proper password hashing
    # IMPORTANT: Role values must match exactly what's in UserRole enum
    # Using South African names
    users = [
        ("Thabo Mbeki", "admin@ndabase.com", "+27123456789", "admin123", "admin"),
        ("Sipho Nkosi", "tech1@ndabase.com", "+27123456780", "tech123", "technician"),
        ("Nomvula Dlamini", "helpdesk1@ndabase.com", "+27123456781", "help123", "helpdesk_officer"),
        ("Mandla Radebe", "manager@ndabase.com", "+27123456782", "manager123", "ict_manager"),
        ("Zanele Khumalo", "gm@ndabase.com", "+27123456783", "gm123", "ict_gm"),
    ]
    
    for name, email, phone, password, role in users:
        hashed_password = hash_password(password)
        cursor.execute("""
            INSERT INTO users (name, email, phone, hashed_password, role, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (name, email, phone, hashed_password, role))
        print(f"Created user: {email} / {password}")
    
    conn.commit()
    conn.close()
    print("\n✅ Users created successfully!")
    print("\nLogin Credentials:")
    print("==================")
    for name, email, phone, password, role in users:
        print(f"{role.upper()}:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print()

if __name__ == "__main__":
    fix_users()
