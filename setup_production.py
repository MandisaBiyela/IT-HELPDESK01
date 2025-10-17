"""
Production Setup Script
Clears all test data and creates production-ready accounts
"""
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.ticket import Ticket, TicketUpdate, SLAEscalation
from app.models.audit_log import AuditLog
from app.utils.auth import get_password_hash
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clear_all_data():
    """Remove all test data from the database"""
    db = SessionLocal()
    
    try:
        logger.info("🗑️  Clearing all test data...")
        
        # Delete in correct order (respect foreign key constraints)
        db.query(AuditLog).delete()
        logger.info("   ✓ Cleared audit logs")
        
        db.query(SLAEscalation).delete()
        logger.info("   ✓ Cleared SLA escalations")
        
        db.query(TicketUpdate).delete()
        logger.info("   ✓ Cleared ticket updates")
        
        db.query(Ticket).delete()
        logger.info("   ✓ Cleared tickets")
        
        db.query(User).delete()
        logger.info("   ✓ Cleared users")
        
        # Reset auto-increment counters
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='users'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='tickets'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='ticket_updates'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='sla_escalations'"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='audit_logs'"))
        
        db.commit()
        logger.info("✅ All test data cleared successfully!")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error clearing data: {e}")
        raise
    finally:
        db.close()


def create_production_users():
    """Create production ICT GM accounts"""
    db = SessionLocal()
    
    try:
        logger.info("\n👥 Creating production user accounts...")
        
        print("\n" + "="*60)
        print("ICT GENERAL MANAGER ACCOUNT SETUP")
        print("="*60)
        
        # First ICT GM
        print("\n📋 ICT GM #1 Information:")
        gm1_name = input("   Full Name: ").strip()
        gm1_email = input("   Email Address: ").strip()
        gm1_phone = input("   Phone Number: ").strip()
        gm1_password = input("   Password: ").strip()
        
        if not all([gm1_name, gm1_email, gm1_phone, gm1_password]):
            logger.error("❌ All fields are required for ICT GM #1")
            return
        
        # Second ICT GM
        print("\n📋 ICT GM #2 Information:")
        gm2_name = input("   Full Name: ").strip()
        gm2_email = input("   Email Address: ").strip()
        gm2_phone = input("   Phone Number: ").strip()
        gm2_password = input("   Password: ").strip()
        
        if not all([gm2_name, gm2_email, gm2_phone, gm2_password]):
            logger.error("❌ All fields are required for ICT GM #2")
            return
        
        # Create ICT GM #1
        gm1 = User(
            name=gm1_name,
            email=gm1_email,
            phone=gm1_phone,
            hashed_password=get_password_hash(gm1_password),
            role="ict_gm",
            is_active=1
        )
        db.add(gm1)
        logger.info(f"   ✓ Created ICT GM: {gm1_name} ({gm1_email})")
        
        # Create ICT GM #2
        gm2 = User(
            name=gm2_name,
            email=gm2_email,
            phone=gm2_phone,
            hashed_password=get_password_hash(gm2_password),
            role="ict_gm",
            is_active=1
        )
        db.add(gm2)
        logger.info(f"   ✓ Created ICT GM: {gm2_name} ({gm2_email})")
        
        db.commit()
        
        print("\n" + "="*60)
        print("✅ PRODUCTION SETUP COMPLETE!")
        print("="*60)
        print("\n📊 Created Accounts:")
        print(f"\n   ICT GM #1:")
        print(f"   • Name: {gm1_name}")
        print(f"   • Email: {gm1_email}")
        print(f"   • Phone: {gm1_phone}")
        print(f"\n   ICT GM #2:")
        print(f"   • Name: {gm2_name}")
        print(f"   • Email: {gm2_email}")
        print(f"   • Phone: {gm2_phone}")
        print("\n" + "="*60)
        print("\n📝 NEXT STEPS:")
        print("   1. ICT GMs can now login at: http://localhost:8000")
        print("   2. They can create Helpdesk Officer accounts")
        print("   3. Helpdesk Officers can create Technician accounts")
        print("   4. ICT Managers can be created as needed")
        print("\n" + "="*60)
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error creating users: {e}")
        raise
    finally:
        db.close()


def main():
    """Main execution"""
    print("\n" + "="*60)
    print("🚀 NDABASE IT HELPDESK - PRODUCTION SETUP")
    print("="*60)
    print("\n⚠️  WARNING: This will DELETE ALL test data!")
    print("   • All test users will be removed")
    print("   • All test tickets will be removed")
    print("   • All audit logs will be removed")
    print("   • Database will be reset to production-ready state")
    
    confirm = input("\n❓ Are you sure you want to continue? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        logger.info("❌ Setup cancelled by user")
        return
    
    try:
        # Step 1: Clear all test data
        clear_all_data()
        
        # Step 2: Create production ICT GM accounts
        create_production_users()
        
        logger.info("\n✅ Production setup completed successfully!")
        logger.info("🚀 System is ready for production use!")
        
    except Exception as e:
        logger.error(f"\n❌ Setup failed: {e}")
        logger.error("Please contact support or try again.")


if __name__ == "__main__":
    main()
