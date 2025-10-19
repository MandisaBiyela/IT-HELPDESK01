# Quick Guide: Using "Waiting on User" Status to Pause SLA

## When to Use This Feature

Use "Waiting on User" status when the ticket cannot progress due to **external factors beyond technician control:**

✅ **Waiting for parts/hardware delivery**
- Printer toner cartridge ordered (3-day delivery)
- RAM modules being shipped
- Replacement monitor on backorder

✅ **Waiting for user response**
- Need software version confirmation
- Require access credentials
- Awaiting user availability for on-site visit

✅ **Waiting for vendor/external service**
- ISP investigating network issue
- Software vendor support escalation
- Third-party contractor response

✅ **Waiting for procurement approval**
- Purchase order pending
- Budget approval needed
- Equipment rental confirmation

## How to Use (Technician Steps)

### Step 1: Change Status to "Waiting on User"
1. Open the urgent/high priority ticket
2. Click **"Update Status"** button
3. Select **"Waiting on User"** from dropdown
4. ⚠️ **IMPORTANT**: Add detailed update explaining:
   - What you're waiting for
   - Expected timeline (ETA)
   - What you'll do next

**Example Update:**
```
"Diagnosed faulty network card. Replacement ordered from supplier.
Expected delivery: 2-3 business days.
Will install immediately upon arrival and test connectivity."
```

### Step 2: SLA Timer Pauses Automatically
- ✅ Remaining SLA time is stored (e.g., "12 minutes left")
- ⏸️ Escalation monitoring stops
- 🔕 No more SLA breach alerts
- 📊 Ticket shows "SLA Paused" status

### Step 3: When Parts/Response Arrives
1. Open the same ticket
2. Click **"Update Status"** button  
3. Select **"In Progress"**
4. Add update about resuming work

**Example Update:**
```
"Network card arrived. Installing now."
```

### Step 4: SLA Timer Resumes
- ▶️ Original SLA time restored (12 minutes remaining)
- ⏱️ Escalation monitoring restarts
- 📢 You have the stored time to complete the fix

### Step 5: Complete and Resolve
1. Finish the repair/fix
2. Update status to **"Resolved"**
3. Add resolution details

## What NOT to Do

❌ **Don't use "Waiting on User" for:**
- You're busy with other tickets (reassign instead)
- Need to research the issue (keep as "In Progress")
- Waiting for internal IT team member
- Taking a break/lunch

❌ **Don't pause without detailed explanation:**
```
BAD: "Waiting for parts"  ← Too vague!

GOOD: "Waiting for replacement toner cartridge (HP LaserJet 1020) 
       ordered from supplier XYZ. ETA: 3 business days. 
       Order #12345. Will install and test upon arrival."
```

## Real Example Workflow

**Scenario: Urgent Printer Issue - Missing Toner**

```
10:00 AM - Ticket NDB-0005 created (URGENT - 20 min SLA)
           "Printer not working - urgent reports needed"

10:10 AM - Sifundo (Technician) arrives
           Diagnoses: Toner cartridge empty
           
10:15 AM - Changes status to "Waiting on User"
           Update: "Printer requires new toner cartridge (HP 78A).
                   Ordered from stationery supplier.
                   Expected delivery: Tomorrow 2 PM.
                   Will install and test immediately upon arrival."
           
           ✅ SLA PAUSED - 5 minutes remaining stored

Next Day:
02:00 PM - Toner arrives

02:05 PM - Sifundo changes status to "In Progress"
           Update: "Toner cartridge arrived, installing now"
           
           ▶️ SLA RESUMED - 5 minutes remaining

02:08 PM - Installation complete, test print successful

02:10 PM - Status changed to "Resolved"
           Update: "Toner cartridge installed. Printer working perfectly.
                   Test print successful. Issue resolved."

RESULT: ✅ Ticket resolved ON TIME (wait time excluded from SLA)
```

## Dashboard View

**While Waiting (Paused):**
- Status Badge: 🟡 "Waiting on User"
- SLA Indicator: ⏸️ "SLA Paused - 5 min remaining"
- No escalation alerts sent

**After Resuming:**
- Status Badge: 🔵 "In Progress"  
- SLA Indicator: ⏱️ "5 min remaining" (counts down)
- Escalation alerts resume if deadline approaches

## Benefits

**For Technicians:**
- ✅ Fair SLA measurement (no penalties for external delays)
- ✅ Can focus on actionable tickets
- ✅ Better work-life balance (no weekend alerts for parts delivery)

**For Managers:**
- ✅ See which tickets are blocked
- ✅ Identify supply chain issues
- ✅ Track vendor/supplier performance
- ✅ More accurate team metrics

## Important Reminders

1. **Always add detailed updates** - Explain what, why, when
2. **Update as soon as resolved** - Don't forget to resume status
3. **SLA time is preserved** - You get back exactly what you had left
4. **Only for external blockers** - Not for internal delays

## Migration Complete

✅ Database updated with `sla_paused_minutes` column
✅ SLA Monitor now skips "Waiting on User" tickets
✅ Status change logic automatically handles pause/resume
✅ Feature ready to use immediately

**Date Implemented:** October 18, 2025
**Status:** ACTIVE ✅
