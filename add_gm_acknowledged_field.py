"""
Add gm_acknowledged and acknowledged_at fields to sla_escalations table
"""
import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_acknowledgment_fields():
    """Add GM acknowledgment fields to escalations table"""
    conn = sqlite3.connect('helpdesk.db')
    cursor = conn.cursor()
    
    try:
        # Check current table structure
        cursor.execute("PRAGMA table_info(sla_escalations)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add gm_acknowledged field if it doesn't exist
        if 'gm_acknowledged' not in columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN gm_acknowledged INTEGER DEFAULT 0
            """)
            logger.info("✅ Added gm_acknowledged column")
        else:
            logger.info("✓ gm_acknowledged column already exists")
        
        # Add acknowledged_by_id field if it doesn't exist
        if 'acknowledged_by_id' not in columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN acknowledged_by_id INTEGER
            """)
            logger.info("✅ Added acknowledged_by_id column")
        else:
            logger.info("✓ acknowledged_by_id column already exists")
        
        # Add acknowledged_at field if it doesn't exist
        if 'acknowledged_at' not in columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN acknowledged_at TIMESTAMP
            """)
            logger.info("✅ Added acknowledged_at column")
        else:
            logger.info("✓ acknowledged_at column already exists")
        
        # Add acknowledgment_note field if it doesn't exist
        if 'acknowledgment_note' not in columns:
            cursor.execute("""
                ALTER TABLE sla_escalations 
                ADD COLUMN acknowledgment_note TEXT
            """)
            logger.info("✅ Added acknowledgment_note column")
        else:
            logger.info("✓ acknowledgment_note column already exists")
        
        conn.commit()
        
        # Show updated table structure
        cursor.execute("PRAGMA table_info(sla_escalations)")
        columns = cursor.fetchall()
        logger.info("\n📋 Updated table structure:")
        for col in columns:
            logger.info(f"  - {col[1]} ({col[2]})")
            
    except Exception as e:
        logger.error(f"❌ Error updating table: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    logger.info("Adding GM acknowledgment fields to sla_escalations table...")
    add_acknowledgment_fields()
    logger.info("\n✅ Database update complete!")
