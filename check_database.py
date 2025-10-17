"""
Database Status Check
Shows current users and tickets in the system
"""
from app.database import SessionLocal
from app.models.user import User
from app.models.ticket import Ticket
from sqlalchemy import func
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_database_status():
    """Display current database status"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*60)
        print("📊 DATABASE STATUS CHECK")
        print("="*60)
        
        # Count users by role
        users = db.query(User).all()
        user_counts = {}
        
        for user in users:
            role = user.role
            if role not in user_counts:
                user_counts[role] = 0
            user_counts[role] += 1
        
        print(f"\n👥 TOTAL USERS: {len(users)}")
        print("-" * 60)
        
        if users:
            for role, count in sorted(user_counts.items()):
                print(f"   • {role.upper()}: {count}")
            
            print("\n📋 USER DETAILS:")
            print("-" * 60)
            for user in users:
                status = "✅ Active" if user.is_active else "❌ Inactive"
                print(f"   [{user.role.upper()}] {user.name}")
                print(f"      Email: {user.email}")
                print(f"      Phone: {user.phone}")
                print(f"      Status: {status}")
                print()
        else:
            print("   No users found in database")
        
        # Count tickets
        total_tickets = db.query(Ticket).count()
        open_tickets = db.query(Ticket).filter(Ticket.status == 'Open').count()
        in_progress = db.query(Ticket).filter(Ticket.status == 'In Progress').count()
        resolved = db.query(Ticket).filter(Ticket.status == 'Resolved').count()
        closed = db.query(Ticket).filter(Ticket.status == 'Closed').count()
        
        print("=" * 60)
        print(f"🎫 TOTAL TICKETS: {total_tickets}")
        print("-" * 60)
        
        if total_tickets > 0:
            print(f"   • Open: {open_tickets}")
            print(f"   • In Progress: {in_progress}")
            print(f"   • Resolved: {resolved}")
            print(f"   • Closed: {closed}")
        else:
            print("   No tickets found in database (clean state ✅)")
        
        print("\n" + "="*60)
        
        # Status summary
        if len(users) == 0 and total_tickets == 0:
            print("✅ DATABASE IS CLEAN - Ready for production setup")
        elif len(users) > 0 and total_tickets == 0:
            print("✅ DATABASE HAS USERS - Ready for ticket creation")
        else:
            print("📊 DATABASE HAS DATA - System in use")
        
        print("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"❌ Error checking database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    check_database_status()
