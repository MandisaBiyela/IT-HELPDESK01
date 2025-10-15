"""
Migration script to add technician_type column to users table
Run this after updating the model
"""
import logging
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models.user import User, TechnicianType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add technician_type column if it doesn't exist"""
    db = SessionLocal()
    
    try:
        # Check if column exists
        with engine.connect() as conn:
            # For SQLite
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            
            if 'technician_type' not in columns:
                logger.info("Adding technician_type column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN technician_type VARCHAR(50)
                """))
                conn.commit()
                logger.info("✓ technician_type column added successfully")
            else:
                logger.info("✓ technician_type column already exists")
        
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting database migration...")
    migrate()
