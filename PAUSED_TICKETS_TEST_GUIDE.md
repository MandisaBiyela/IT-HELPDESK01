# Paused Tickets Dashboard - Quick Test Guide

## Testing the Paused Tickets Feature

### Prerequisites
✅ Server running on http://localhost:8000  
✅ Have accounts for: Technician, ICT GM  
✅ At least one test ticket created  

---

## Test Scenario: Create a Paused Ticket

### Step 1: Login as Technician
1. Navigate to http://localhost:8000/static/index.html
2. Login as technician
3. Go to "My Tickets" tab

### Step 2: Change Ticket to "Waiting on User"
1. Click on any ticket to open details
2. Click "Update Status" button
3. Select status: **"Waiting on User"**
4. In the update notes, type: **"Waiting for replacement part delivery"**
5. Click "Update Status"

**Expected Result:**
- Ticket status changes to "Waiting on User"
- SLA timer pauses (remaining time saved)
- Status badge shows yellow "Waiting on User"

### Step 3: Verify in ICT GM Dashboard
1. Logout from technician account
2. Login as ICT GM
3. Click on "Escalations" tab

**Expected Result - Two Sections Should Appear:**

```
🚨 Active Escalations (SLA Breached) [0]
(empty if no breached tickets)

⏸️ Paused Tickets (Waiting on User/Parts) [1]
┌──────────────────────────────────────────────────────────┐
│ TKT-001  | Computer not starting                          │
│          | ⏸️ SLA Paused - Waiting for replacement part... │
│ Paused (0h 18m saved) | John Technician                   │
└──────────────────────────────────────────────────────────┘
```

### Step 4: Test Filters
1. Click **"Pending"** button

**Expected Result:**
- Paused ticket STILL visible (paused tickets always show in pending)

2. Click **"Acknowledged"** button

**Expected Result:**
- Paused ticket HIDDEN (only acknowledged escalations show)

3. Click **"All"** button

**Expected Result:**
- Paused ticket visible again

### Step 5: Resume Ticket
1. Logout from ICT GM
2. Login back as technician
3. Open the paused ticket
4. Change status to **"In Progress"**
5. Add note: "Part arrived, resuming work"

**Expected Result:**
- Status changes to "In Progress"
- SLA timer resumes (18 minutes added back to deadline)
- Ticket disappears from ICT GM "Paused Tickets" section

---

## Visual Checklist

### Paused Ticket Appearance
- [ ] Gray background (not white like active tickets)
- [ ] 4px gray left border
- [ ] Status badge says "Paused (Xh Ym saved)"
- [ ] Shows waiting reason below ticket title
- [ ] Gray pause icon (⏸️) in section header

### Active Escalation Appearance
- [ ] White/standard background
- [ ] Red left border indicator
- [ ] Status badge says "Overdue" or "Update Required"
- [ ] Red warning icon (⚠️) in section header

---

## API Response Verification

### Open Browser Console (F12)
1. Go to ICT GM dashboard
2. Open Network tab
3. Refresh page
4. Find `/api/escalations` request
5. Check response

**Expected JSON Structure:**
```json
{
  "total": 5,
  "active_escalations": 3,
  "paused_tickets": 2,
  "active": [
    {
      "ticket_id": 10,
      "ticket_number": "TKT-010",
      "status": "in_progress",
      "sla_breached": true,
      ...
    }
  ],
  "paused": [
    {
      "ticket_id": 15,
      "ticket_number": "TKT-015",
      "type": "paused",
      "sla_status": "Paused",
      "escalation_reason": "⏸️ SLA Paused - Waiting for replacement part delivery",
      "sla_paused_minutes": 18,
      ...
    }
  ]
}
```

---

## Troubleshooting

### Issue: Paused tickets not showing
**Solution:**
1. Check browser console for JavaScript errors
2. Hard refresh: Ctrl+F5 (force cache clear)
3. Verify script version is v=4.0 in HTML
4. Check server logs for API errors

### Issue: Sections not appearing
**Solution:**
1. Verify CSS loaded correctly
2. Check `style.css` has `.escalations-section` styles
3. Inspect element to see if HTML is being generated

### Issue: Old layout still showing
**Solution:**
1. Clear browser cache completely
2. Check `ict-gm.html` uses `ict-gm.js?v=4.0`
3. Restart server: `python run_server.py`

---

## Success Criteria
✅ Two distinct sections render  
✅ Paused tickets show time saved  
✅ Paused tickets show waiting reason  
✅ Pending filter includes paused tickets  
✅ Visual styling clearly differentiates sections  
✅ Clicking ticket opens detail modal  
✅ Auto-refresh maintains data  

---

## Quick Database Check

### Verify Paused Ticket in Database
```python
python -c "from app.database import SessionLocal; from app.models.ticket import Ticket; db = SessionLocal(); ticket = db.query(Ticket).filter(Ticket.status == 'waiting_on_user').first(); print(f'Found: {ticket.ticket_number if ticket else 'No paused tickets'}'); print(f'Paused minutes: {ticket.sla_paused_minutes if ticket else 0}')"
```

**Expected Output:**
```
Found: TKT-015
Paused minutes: 18
```

---

## Test Complete! 🎉
If all checkboxes pass, the feature is working perfectly!
