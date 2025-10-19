"""Check all tickets in the database"""
import sqlite3
from datetime import datetime

db_path = "helpdesk.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n" + "="*80)
print("🎫 ALL TICKETS IN DATABASE")
print("="*80)

cursor.execute("""
    SELECT id, ticket_number, user_name, problem_summary, priority, status, 
           created_at, sla_deadline, sla_status
    FROM tickets 
    ORDER BY created_at DESC
""")

tickets = cursor.fetchall()

if tickets:
    print(f"\nTotal Tickets: {len(tickets)}\n")
    for ticket in tickets:
        ticket_id, number, user_name, summary, priority, status, created, deadline, sla_status = ticket
        
        print(f"Ticket #{number}")
        print(f"  User: {user_name}")
        print(f"  Summary: {summary}")
        print(f"  Priority: {priority}")
        print(f"  Status: {status}")
        print(f"  SLA Status: {sla_status}")
        print(f"  Created: {created}")
        print(f"  SLA Deadline: {deadline}")
        
        # Calculate time difference
        if created:
            try:
                created_dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                now = datetime.utcnow()
                time_diff = now - created_dt
                print(f"  Age: {time_diff}")
            except:
                pass
        
        print("-" * 80)
else:
    print("\n✅ No tickets found in database (clean state)\n")

print("="*80 + "\n")

conn.close()
