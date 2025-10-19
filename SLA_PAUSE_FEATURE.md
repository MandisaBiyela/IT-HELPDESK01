# SLA Pause Feature - "Waiting on User" Status

## Problem Solved
When a technician is working on an URGENT ticket but needs to wait for:
- Missing hardware parts to arrive
- User feedback/approval
- External vendor response
- Procurement to deliver equipment

The ticket would keep escalating even though the technician is doing everything possible. This feature **pauses the SLA clock** while waiting.

## How It Works

### 1. **Pausing SLA** (When Parts Not Available)
When technician changes status to "Waiting on User":
```
Scenario: Urgent printer issue - waiting for replacement toner (3 days delivery)

1. Technician opens ticket NDB-0002 (URGENT - 20 min SLA)
2. Diagnoses: "Need replacement toner cartridge"
3. Changes status to "Waiting on User"
4. Adds update: "Ordered toner cartridge - ETA 3 days"

✅ SLA clock PAUSES - remaining time stored (e.g., 12 minutes left)
✅ Ticket will NOT escalate during wait period
✅ Technician can work on other tickets
```

### 2. **Resuming SLA** (When Parts Arrive)
When parts arrive and technician resumes work:
```
3 days later - parts arrived

1. Technician changes status back to "In Progress"  
2. Adds update: "Toner arrived, installing now"

✅ SLA clock RESUMES with original 12 minutes remaining
✅ Escalation monitoring restarts
✅ Technician has 12 minutes to complete and resolve
```

### 3. **SLA Monitor Behavior**
The background SLA Monitor now:
- ✅ **Checks ONLY** tickets with status: "Open" or "In Progress"
- ❌ **IGNORES** tickets with status: "Waiting on User"
- ⏸️ No escalation emails sent while waiting
- 📊 Reporting shows tickets as "paused" not "breached"

## Technical Implementation

### Database Changes
New column added to `tickets` table:
```sql
ALTER TABLE tickets ADD COLUMN sla_paused_minutes INTEGER DEFAULT 0;
```

### SLA Monitor Update (app/services/sla_monitor.py)
```python
# OLD: Check all open/in-progress tickets
tickets = db.query(Ticket).filter(
    Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
).all()

# NEW: Exclude "Waiting on User" (SLA exempt)
tickets = db.query(Ticket).filter(
    Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
    Ticket.status != TicketStatus.WAITING_ON_USER  # ✅ SLA PAUSED
).all()
```

### Status Change Logic (app/api/tickets.py)
```python
# Moving TO "Waiting on User" - Store remaining time
if status == "Waiting on User":
    time_remaining = (ticket.sla_deadline - now).total_seconds() / 60
    ticket.sla_paused_minutes = int(time_remaining)  # Store it
    logger.info(f"⏸️ SLA PAUSED - {time_remaining} minutes stored")

# Moving FROM "Waiting on User" - Restore remaining time
if was_waiting and status != "Waiting on User":
    ticket.sla_deadline = now + timedelta(minutes=ticket.sla_paused_minutes)
    logger.info(f"▶️ SLA RESUMED - {ticket.sla_paused_minutes} minutes restored")
    ticket.sla_paused_minutes = 0  # Clear stored time
```

## User Workflow

### For Technicians:

**Scenario: Waiting for Parts**
1. Open the urgent ticket
2. Click "Update Status"
3. Select "Waiting on User" from dropdown
4. Add detailed update:
   ```
   "Printer requires new fuser unit. Part ordered from supplier.
   Expected delivery: 2-3 business days.
   Will resume repair immediately upon arrival."
   ```
5. Click "Save"

✅ **Result**: SLA timer pauses, no escalation, ticket stays assigned to you

**When Parts Arrive:**
1. Open the ticket again
2. Click "Update Status"
3. Select "In Progress"
4. Add update:
   ```
   "Fuser unit arrived. Installing now."
   ```
5. Complete the repair
6. Change status to "Resolved"

✅ **Result**: SLA timer resumed with original time, ticket resolved successfully

### For Managers/GMs:

**Dashboard View:**
- Tickets with "Waiting on User" status show as:
  - 🟡 **Status Badge**: "Waiting on User"
  - ⏸️ **SLA Indicator**: "SLA Paused - 15 min remaining"
  - 📝 **Last Update**: Shows reason for wait

**Reports:**
- Waiting tickets appear in separate category
- Time spent waiting tracked separately
- SLA compliance calculated excluding wait time

## Real-World Examples

### Example 1: Hardware Replacement
```
Ticket: NDB-0003 - Desktop won't boot
Priority: URGENT (20 min SLA)
Issue: Motherboard failure

Timeline:
10:00 AM - Ticket created
10:15 AM - Technician diagnoses motherboard failure
10:20 AM - Status → "Waiting on User" (💰 parts order)
         Update: "Motherboard ordered - 2 day delivery"
         SLA paused with 5 minutes remaining

Day 3:
09:00 AM - Parts arrive
09:05 AM - Status → "In Progress" (▶️ SLA resumes: 5 min left)
09:08 AM - Motherboard installed and tested
09:10 AM - Status → "Resolved" ✅
```
**SLA Status**: ✅ ON TIME (wait time excluded from SLA)

### Example 2: Waiting for User Response
```
Ticket: NDB-0004 - Software installation request
Priority: NORMAL (24 hour SLA)
Issue: Unclear which software version needed

Timeline:
Monday 2:00 PM - Ticket created
Monday 2:30 PM - Status → "Waiting on User"
                Update: "Emailed user to confirm software version (Pro vs Enterprise).
                        Waiting for response."
                SLA paused with 23.5 hours remaining

Tuesday 10:00 AM - User responds
Tuesday 10:05 AM - Status → "In Progress" (SLA resumes: 23.5 hours)
Tuesday 11:00 AM - Software installed
Tuesday 11:15 AM - Status → "Resolved" ✅
```
**SLA Status**: ✅ ON TIME (user delay excluded)

## Configuration

### Status Options Available:
- **Open** - Newly created, SLA active ⏱️
- **In Progress** - Technician working, SLA active ⏱️
- **Waiting on User** - External delay, SLA paused ⏸️
- **Resolved** - Fixed, SLA complete ✅
- **Closed** - Confirmed by user, archived 📁

### SLA Pause Triggers:
Status change TO "Waiting on User" automatically:
- Stores remaining SLA time
- Stops escalation monitoring
- Adds visual "paused" indicator

### SLA Resume Triggers:
Status change FROM "Waiting on User" TO any active status:
- Restores original SLA remaining time
- Restarts escalation monitoring
- Updates SLA deadline = now + paused_minutes

## Benefits

### For Technicians:
✅ No unfair escalations while waiting for parts
✅ Can focus on actionable tickets
✅ Accurate workload tracking
✅ Better SLA compliance metrics

### For Managers:
✅ Clear visibility on blocked tickets
✅ Identify supply chain bottlenecks
✅ Accurate performance reporting
✅ Better resource planning

### For Organization:
✅ Fair SLA measurement
✅ Realistic performance metrics
✅ Improved technician morale
✅ Better procurement insights

## Migration Steps

1. **Run the migration script:**
   ```bash
   python migrate_sla_pause.py
   ```

2. **Restart the server:**
   ```bash
   python run_server.py
   ```

3. **Test the feature:**
   - Create an urgent ticket
   - Change status to "Waiting on User"
   - Verify SLA monitor skips it
   - Change back to "In Progress"
   - Verify SLA time restored

## Monitoring & Reports

### Dashboard Indicators:
- **Active SLA**: ⏱️ Green/Yellow/Red timer
- **Paused SLA**: ⏸️ Gray badge with "Paused - X min remaining"
- **Waiting Reason**: 💬 Last update shows why waiting

### Reports Include:
- Total wait time per ticket
- Common waiting reasons
- Average delivery times
- Supplier performance

## Important Notes

⚠️ **Use "Waiting on User" only for external blockers:**
- ✅ Parts delivery
- ✅ User feedback needed
- ✅ Vendor response
- ✅ Procurement delays
- ❌ NOT for internal delays (technician busy, etc.)

⚠️ **Always add detailed update when pausing:**
- What are you waiting for?
- When is it expected?
- What will you do when it arrives?

⚠️ **SLA time is preserved, not reset:**
- If you had 5 minutes left, you'll have 5 minutes when resumed
- Not a way to get more time, just pauses the clock

## Files Modified

1. `app/services/sla_monitor.py` - Exclude "Waiting on User" from checks
2. `app/api/tickets.py` - Add pause/resume logic
3. `app/models/ticket.py` - Add `sla_paused_minutes` column
4. `migrate_sla_pause.py` - Database migration script

## Date Implemented
October 18, 2025

## Status
✅ READY TO USE
