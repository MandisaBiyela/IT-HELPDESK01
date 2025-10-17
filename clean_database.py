"""
Clean Database Script
Removes all test data from the database for a fresh start
"""
from sqlalchemy import text
from app.database import SessionLocal
from app.models.user import User
from app.models.ticket import Ticket, TicketUpdate, SLAEscalation
from app.models.audit_log import AuditLog

def clean_database():
    """Remove all data from the database"""
    db = SessionLocal()
    
    try:
        print("\n🧹 CLEANING DATABASE...")
        print("=" * 50)
        
        # Count existing data
        users_count = db.query(User).count()
        tickets_count = db.query(Ticket).count()
        updates_count = db.query(TicketUpdate).count()
        escalations_count = db.query(SLAEscalation).count()
        audit_count = db.query(AuditLog).count()
        
        print(f"\n📊 Current Data:")
        print(f"   - Users: {users_count}")
        print(f"   - Tickets: {tickets_count}")
        print(f"   - Ticket Updates: {updates_count}")
        print(f"   - Escalations: {escalations_count}")
        print(f"   - Audit Logs: {audit_count}")
        
        # Confirm deletion
        print("\n⚠️  WARNING: This will delete ALL data from the database!")
        confirm = input("Type 'YES' to confirm deletion: ")
        
        if confirm != 'YES':
            print("\n❌ Operation cancelled.")
            return
        
        print("\n🗑️  Deleting data...")
        
        # Delete in correct order (respecting foreign key constraints)
        db.query(AuditLog).delete()
        print("   ✓ Deleted audit logs")
        
        db.query(SLAEscalation).delete()
        print("   ✓ Deleted escalations")
        
        db.query(TicketUpdate).delete()
        print("   ✓ Deleted ticket updates")
        
        db.query(Ticket).delete()
        print("   ✓ Deleted tickets")
        
        db.query(User).delete()
        print("   ✓ Deleted users")
        
        # Reset auto-increment sequences
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='users'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='tickets'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='ticket_updates'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='sla_escalations'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='audit_logs'"))
        print("   ✓ Reset ID sequences")
        
        db.commit()
        
        print("\n✅ DATABASE CLEANED SUCCESSFULLY!")
        print("=" * 50)
        print("\n📝 Next Steps:")
        print("   1. Restart the server if it's running")
        print("   2. Go to: http://localhost:8000/static/index.html")
        print("   3. Click 'Create account' to sign up")
        print("   4. Start fresh with your own data!")
        print("\n" + "=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error cleaning database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
