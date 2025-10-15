"""
Database initialization script
Creates tables and seeds initial data
"""
from app.database import init_db, SessionLocal
from app.models.user import User, UserRole
from app.utils.auth import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_initial_users():
    """Create initial admin and technician users"""
    db = SessionLocal()
    
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@ndabase.com").first()
        
        if existing_admin:
            logger.info("Admin user already exists")
        else:
            # Create admin user
            admin = User(
                name="System Administrator",
                email="admin@ndabase.com",
                phone="+27123456789",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=1
            )
            db.add(admin)
            logger.info("Created admin user: admin@ndabase.com / admin123")
        
        # Create sample users for all roles
        users_to_create = [
            {
                "name": "John Technician",
                "email": "tech1@ndabase.com",
                "phone": "+27123456780",
                "password": "tech123",
                "role": UserRole.TECHNICIAN
            },
            {
                "name": "Jane Helpdesk",
                "email": "helpdesk1@ndabase.com",
                "phone": "+27123456781",
                "password": "help123",
                "role": UserRole.HELPDESK_OFFICER
            },
            {
                "name": "Mike Manager",
                "email": "manager@ndabase.com",
                "phone": "+27123456782",
                "password": "manager123",
                "role": UserRole.ICT_MANAGER
            },
            {
                "name": "Sarah GM",
                "email": "gm@ndabase.com",
                "phone": "+27123456783",
                "password": "gm123",
                "role": UserRole.ICT_GM
            }
        ]
        
        for tech_data in users_to_create:
            existing = db.query(User).filter(User.email == tech_data["email"]).first()
            if not existing:
                tech = User(
                    name=tech_data["name"],
                    email=tech_data["email"],
                    phone=tech_data["phone"],
                    hashed_password=get_password_hash(tech_data["password"]),
                    role=tech_data["role"],
                    is_active=1
                )
                db.add(tech)
                logger.info(f"Created user: {tech_data['email']} / {tech_data['password']}")
        
        db.commit()
        logger.info("Database seeding completed successfully")
        
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        db.rollback()
    finally:
        db.close()


def main():
    """Initialize database"""
    logger.info("Initializing database...")
    
    # Create tables
    init_db()
    logger.info("Database tables created")
    
    # Seed initial data
    create_initial_users()
    
    logger.info("Database initialization complete!")
    logger.info("\n" + "="*50)
    logger.info("Default Login Credentials:")
    logger.info("="*50)
    logger.info("Admin:")
    logger.info("  Email: admin@ndabase.com")
    logger.info("  Password: admin123")
    logger.info("\nHelpdesk Officer:")
    logger.info("  Email: helpdesk1@ndabase.com")
    logger.info("  Password: help123")
    logger.info("\nTechnician:")
    logger.info("  Email: tech1@ndabase.com")
    logger.info("  Password: tech123")
    logger.info("\nICT Manager:")
    logger.info("  Email: manager@ndabase.com")
    logger.info("  Password: manager123")
    logger.info("\nICT GM:")
    logger.info("  Email: gm@ndabase.com")
    logger.info("  Password: gm123")
    logger.info("="*50)
    logger.info("\nIMPORTANT: Change these passwords in production!")
    logger.info("="*50)


if __name__ == "__main__":
    main()
