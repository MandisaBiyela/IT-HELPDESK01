"""
Migration script to add new fields to ticket_updates table
- reassign_reason: TEXT
- time_spent: INTEGER
- is_internal: INTEGER (default 0)
"""

import logging
from sqlalchemy import create_engine, text
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add new columns to ticket_updates table"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Get current columns
            result = conn.execute(text("PRAGMA table_info(ticket_updates)"))
            columns = [row[1] for row in result]
            
            if 'reassign_reason' not in columns:
                logger.info("Adding reassign_reason column to ticket_updates...")
                conn.execute(text("ALTER TABLE ticket_updates ADD COLUMN reassign_reason TEXT"))
                conn.commit()
                logger.info("✓ reassign_reason column added")
            
            if 'time_spent' not in columns:
                logger.info("Adding time_spent column to ticket_updates...")
                conn.execute(text("ALTER TABLE ticket_updates ADD COLUMN time_spent INTEGER"))
                conn.commit()
                logger.info("✓ time_spent column added")
            
            if 'is_internal' not in columns:
                logger.info("Adding is_internal column to ticket_updates...")
                conn.execute(text("ALTER TABLE ticket_updates ADD COLUMN is_internal INTEGER DEFAULT 0"))
                conn.commit()
                logger.info("✓ is_internal column added")
        
        logger.info("\n✅ Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    logger.info("Starting ticket_updates table migration...")
    migrate()
