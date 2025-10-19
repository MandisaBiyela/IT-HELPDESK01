import sqlite3
from datetime import datetime

conn = sqlite3.connect('helpdesk.db')
cursor = conn.cursor()

# Check escalations
cursor.execute('''
    SELECT e.id, e.ticket_id, e.escalation_reason, e.escalated_at, 
           e.previous_priority, e.new_priority, t.ticket_number, t.status,
           t.escalated
    FROM sla_escalations e 
    JOIN tickets t ON e.ticket_id = t.id 
    ORDER BY e.escalated_at DESC
''')

escalations = cursor.fetchall()

print("\n=== ESCALATIONS IN DATABASE ===")
print(f"Total escalations found: {len(escalations)}\n")

for esc in escalations:
    print(f"📋 Ticket: {esc[6]} (ID: {esc[1]})")
    print(f"   Reason: {esc[2]}")
    print(f"   Escalated At: {esc[3]}")
    print(f"   Priority Change: {esc[4]} → {esc[5]}")
    print(f"   Current Status: {esc[7]}")
    print(f"   Escalated Flag: {esc[8]}")
    print()

# Check all tickets with escalated flag
cursor.execute("SELECT ticket_number, status, escalated, sla_status FROM tickets WHERE escalated = 1")
esc_tickets = cursor.fetchall()

print(f"=== TICKETS WITH ESCALATED FLAG ===")
print(f"Found {len(esc_tickets)} ticket(s)\n")

for ticket in esc_tickets:
    print(f"{ticket[0]}: Status={ticket[1]}, SLA={ticket[3]}")

conn.close()
