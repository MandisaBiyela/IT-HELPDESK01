"""
Create the sla_escalations table that was missing from initial setup
"""
import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_escalations_table():
    """Create the sla_escalations table"""
    conn = sqlite3.connect('helpdesk.db')
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sla_escalations'")
        if cursor.fetchone():
            logger.info("✅ sla_escalations table already exists")
        else:
            # Create the table
            cursor.execute("""
                CREATE TABLE sla_escalations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER NOT NULL,
                    escalation_reason TEXT NOT NULL,
                    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    previous_priority VARCHAR(50),
                    new_priority VARCHAR(50),
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
                )
            """)
            conn.commit()
            logger.info("✅ Created sla_escalations table successfully!")
        
        # Show table info
        cursor.execute("PRAGMA table_info(sla_escalations)")
        columns = cursor.fetchall()
        logger.info("\nTable structure:")
        for col in columns:
            logger.info(f"  - {col[1]} ({col[2]})")
            
    except Exception as e:
        logger.error(f"❌ Error creating table: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    logger.info("Creating sla_escalations table...")
    create_escalations_table()
    logger.info("\n✅ Database update complete!")
