"""
Database migration script for multi-role system
Adds: last_login to users, sla_status and updated_at to tickets, creates audit_logs table
"""
import logging
from sqlalchemy import text
from app.database import engine, SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add new columns and tables"""
    db = SessionLocal()
    
    try:
        with engine.connect() as conn:
            # Check and add last_login to users
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            
            if 'last_login' not in columns:
                logger.info("Adding last_login column to users...")
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME"))
                conn.commit()
                logger.info("✓ last_login column added")
            
            # Check and add sla_status to tickets
            result = conn.execute(text("PRAGMA table_info(tickets)"))
            columns = [row[1] for row in result]
            
            if 'sla_status' not in columns:
                logger.info("Adding sla_status column to tickets...")
                conn.execute(text("ALTER TABLE tickets ADD COLUMN sla_status VARCHAR(20) DEFAULT 'On Track'"))
                conn.commit()
                logger.info("✓ sla_status column added")
            
            if 'updated_at' not in columns:
                logger.info("Adding updated_at column to tickets...")
                conn.execute(text("ALTER TABLE tickets ADD COLUMN updated_at DATETIME"))
                # Set updated_at to created_at for existing tickets
                conn.execute(text("UPDATE tickets SET updated_at = created_at WHERE updated_at IS NULL"))
                conn.commit()
                logger.info("✓ updated_at column added and initialized")
            
            # Create audit_logs table
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'"))
            if not result.fetchone():
                logger.info("Creating audit_logs table...")
                conn.execute(text("""
                    CREATE TABLE audit_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        entity_type VARCHAR(50) NOT NULL,
                        entity_id INTEGER NOT NULL,
                        action VARCHAR(100) NOT NULL,
                        performed_by_id INTEGER,
                        details TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (performed_by_id) REFERENCES users(id)
                    )
                """))
                conn.commit()
                logger.info("✓ audit_logs table created")
            
        logger.info("\n✅ Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting database migration for multi-role system...")
    migrate()
