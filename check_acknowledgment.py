import sqlite3
from datetime import datetime

conn = sqlite3.connect('helpdesk.db')
cursor = conn.cursor()

cursor.execute("""
    SELECT id, ticket_id, gm_acknowledged, acknowledged_by_id, 
           acknowledged_at_gm, acknowledgment_note
    FROM sla_escalations
    ORDER BY escalated_at DESC
""")

escalations = cursor.fetchall()

print("\n=== ESCALATION ACKNOWLEDGMENT STATUS ===")
print("=" * 60)

for esc in escalations:
    print(f"\nEscalation ID: {esc[0]}")
    print(f"Ticket ID: {esc[1]}")
    print(f"GM Acknowledged: {'YES ✓' if esc[2] else 'NO (Pending)'}")
    print(f"Acknowledged By ID: {esc[3] or 'N/A'}")
    print(f"Acknowledged At: {esc[4] or 'N/A'}")
    print(f"Note: {esc[5] or 'No note'}")
    print("-" * 60)

conn.close()
