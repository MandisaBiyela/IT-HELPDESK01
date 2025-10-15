# MULTI-ROLE HELPDESK SYSTEM - IMPLEMENTATION PLAN

## 📋 **Executive Summary**

This document outlines the complete implementation plan for transforming the current helpdesk system into a comprehensive multi-role platform with separate pages, dashboards, and workflows for each role.

## 🎯 **Scope of Work**

### Phase 1: Database & Backend (Priority: HIGH)
- **Duration:** 2-3 days
- **Deliverables:**
  1. Update User model with ICT_MANAGER and ICT_GM roles
  2. Add Audit Log model and table
  3. Add last_login, sla_status, updated_at fields
  4. Create migration scripts
  5. Add reassign_reason, time_spent, internal_notes to ticket_updates
  6. Implement forced update blocking logic in API

### Phase 2: Role-Specific Pages (Priority: HIGH)
- **Duration:** 3-4 days
- **Deliverables:**
  1. `helpdesk-officer.html` - Intake & Triage dashboard
  2. `technician.html` - Workbench with Kanban view
  3. `ict-manager.html` - Analytics & Reports dashboard
  4. `ict-gm.html` - Executive Oversight dashboard
  5. Separate JavaScript files for each role
  6. Role-based routing after login

### Phase 3: Enhanced SLA System (Priority: CRITICAL)
- **Duration:** 2 days
- **Deliverables:**
  1. Update SLA monitor to compute sla_status (On Track/At Risk/Breached)
  2. Implement auto-escalation with priority bumping
  3. Add forced update requirement (requires_update flag)
  4. Notification to GM and Manager on escalation
  5. 2-minute pre-expiry warnings
  6. Recompute SLA deadline on priority bump

### Phase 4: Advanced Features (Priority: MEDIUM)
- **Duration:** 3-4 days
- **Deliverables:**
  1. Technician time tracking
  2. Internal notes (private comments)
  3. File attachments
  4. Reassign with mandatory reason
  5. Manager approval workflow for ticket closure
  6. Technician availability/load indicator
  7. GM escalation acknowledgment

### Phase 5: Analytics & Reporting (Priority: MEDIUM)
- **Duration:** 2-3 days
- **Deliverables:**
  1. KPI calculations (Avg Resolution Time, SLA Breach %)
  2. Interactive charts (tickets by category, priority, assignee)
  3. Manager export functionality
  4. GM escalations feed
  5. Audit trail viewer

## 🏗️ **Technical Architecture**

### 1. Database Schema Updates

#### New Tables:
```sql
-- Audit Logs
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    entity_type VARCHAR(50),  -- 'ticket', 'user', 'escalation'
    entity_id INTEGER,
    action VARCHAR(100),
    performed_by_id INTEGER,
    details TEXT,  -- JSON
    created_at DATETIME
);
```

#### Updated Tables:
```sql
-- users table
ALTER TABLE users ADD COLUMN last_login DATETIME;
-- Update role enum to include 'ict_manager', 'ict_gm'

-- tickets table
ALTER TABLE tickets ADD COLUMN sla_status VARCHAR(20);
ALTER TABLE tickets ADD COLUMN updated_at DATETIME;

-- ticket_updates table
ALTER TABLE ticket_updates ADD COLUMN reassign_reason TEXT;
ALTER TABLE ticket_updates ADD COLUMN time_spent INTEGER;  -- minutes
ALTER TABLE ticket_updates ADD COLUMN is_internal INTEGER DEFAULT 0;
```

### 2. API Endpoints Mapping

#### Helpdesk Officer Endpoints:
```
POST   /api/tickets                    - Create ticket
GET    /api/tickets?filter=unassigned  - Get unassigned tickets
PUT    /api/tickets/{id}/assign        - Assign to technician
POST   /api/tickets/{id}/note          - Add internal note
GET    /api/technicians/availability   - Get tech load
```

#### Technician Endpoints:
```
GET    /api/tickets/assigned           - My queue
PUT    /api/tickets/{id}/status        - Change status
POST   /api/tickets/{id}/updates       - Add update (with time tracking)
PUT    /api/tickets/{id}/reassign      - Reassign with reason
POST   /api/tickets/{id}/attachments   - Upload file
GET    /api/tickets/{id}/check-blocked - Check if update required
```

#### ICT Manager Endpoints:
```
GET    /api/reports/kpis               - Dashboard KPIs
GET    /api/reports/tickets            - Filtered tickets
GET    /api/reports/export             - CSV export
GET    /api/reports/sla-breaches       - SLA analytics
POST   /api/tickets/{id}/approve-close - Approve closure
GET    /api/audit-logs                 - View audit trail
```

#### ICT GM Endpoints:
```
GET    /api/escalations                - Get escalated tickets
POST   /api/escalations/{id}/acknowledge - Acknowledge escalation
GET    /api/notifications/all          - All CC'd notifications
POST   /api/tickets/{id}/flag          - Flag for investigation
```

### 3. SLA Escalation Logic (Precise Implementation)

```python
# In SLA Monitor (runs every minute)

def check_sla_status():
    now = datetime.utcnow()
    active_tickets = get_tickets(status=['Open', 'In Progress'])
    
    for ticket in active_tickets:
        time_remaining = (ticket.sla_deadline - now).total_seconds()
        
        # Update SLA status
        if time_remaining <= 0:
            ticket.sla_status = 'Breached'
            handle_breach(ticket)
        elif time_remaining <= 120:  # 2 minutes
            ticket.sla_status = 'At Risk'
            send_pre_expiry_alert(ticket)
        else:
            ticket.sla_status = 'On Track'
        
        db.commit()

def handle_breach(ticket):
    # 1. Escalate priority
    old_priority = ticket.priority
    if old_priority != 'Urgent':
        ticket.priority = 'Urgent'
        
        # 2. Recompute SLA deadline
        ticket.sla_deadline = datetime.utcnow() + timedelta(minutes=20)
    
    # 3. Create escalation record
    escalation = SLAEscalation(
        ticket_id=ticket.id,
        escalated_from_priority=old_priority,
        escalated_to_priority='Urgent',
        escalation_reason='SLA deadline exceeded',
        notified_to=['assignee', 'ict_manager', 'ict_gm']
    )
    db.add(escalation)
    
    # 4. Set forced update flag
    ticket.requires_update = 1
    ticket.escalated = 1
    
    # 5. Send notifications
    send_email(ticket.assignee, 'SLA BREACH', ticket)
    send_email(ict_manager, 'SLA BREACH ALERT', ticket)
    send_email(ict_gm, 'SLA BREACH ESCALATION', ticket)
    send_whatsapp(ticket.assignee, f'URGENT: Ticket {ticket.ticket_number} breached SLA')
    
    # 6. Create audit log
    create_audit_log('ticket', ticket.id, 'sla_escalated', None, {
        'old_priority': old_priority,
        'new_priority': 'Urgent',
        'reason': 'SLA deadline exceeded'
    })
    
    db.commit()
```

### 4. Forced Update Blocking (Frontend & Backend)

#### Backend API Protection:
```python
@router.patch("/api/tickets/{ticket_id}/status")
def update_status(ticket_id, status_data, current_user, db):
    ticket = get_ticket(ticket_id)
    
    # BLOCK if update required
    if ticket.requires_update == 1:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "FORCED_UPDATE_REQUIRED",
                "message": "You must provide an escalation update before performing other actions",
                "ticket_id": ticket_id
            }
        )
    
    # Proceed with status update...
```

#### Frontend Modal:
```javascript
// Check before any action
async function checkIfBlocked(ticketId) {
    const response = await apiGet(`/api/tickets/${ticketId}/check-blocked`);
    if (response.requires_update) {
        showForcedUpdateModal(ticketId, response.escalation_reason);
        return true;
    }
    return false;
}

// Modal blocks all other actions
function showForcedUpdateModal(ticketId, reason) {
    const modal = `
        <div class="forced-modal">
            <h2>⚠️ Mandatory Update Required</h2>
            <p>This ticket has been escalated due to: ${reason}</p>
            <p>You cannot perform any other actions until you provide an update.</p>
            <textarea id="escalationUpdate" required></textarea>
            <button onclick="submitForcedUpdate('${ticketId}')">Submit Update</button>
        </div>
    `;
    // Disable all other buttons on page
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    showModal(modal);
}
```

## 📊 **Role-Specific Dashboards**

### 1. Helpdesk Officer Dashboard (`helpdesk-officer.html`)

**Layout:**
```
+----------------------------------------------------------+
|  [+ Create Ticket]           Ndabase IT Helpdesk    [Logout] |
+----------------------------------------------------------+
| Filters: [Today] [Unassigned] [Urgent] [My Tickets]     |
+----------------------------------------------------------+
|  TICKETS (Main List)          | ON-CALL TECHNICIANS    |
|                               |                        |
|  [NDB-0001] Printer issue     | 🟢 John (2 tickets)    |
|  Priority: High | Unassigned  | 🟡 Sarah (5 tickets)   |
|  Created: 2m ago             | 🔴 Mike (8 tickets)    |
|  [Assign ▼]                   |                        |
|                               |                        |
|  [NDB-0002] Network down      |                        |
|  Priority: Urgent | John      |                        |
|  SLA: 18m remaining 🔴        |                        |
|  [View Details]               |                        |
+----------------------------------------------------------+
```

**Key Features:**
- One-click ticket creation modal
- Quick assign dropdown
- Real-time SLA countdown
- Technician load indicator
- Internal notes only (no status changes)

### 2. Technician Dashboard (`technician.html`)

**Layout (Kanban):**
```
+----------------------------------------------------------+
|  My Queue: 3 Open | 2 In Progress | 1 Urgent    [Logout] |
+----------------------------------------------------------+
| [OPEN]          | [IN PROGRESS]    | [WAITING] | [RESOLVED] |
|                 |                  |           |            |
| NDB-0003       | NDB-0001 🔴      | NDB-0005  | NDB-0002  |
| Network setup  | Printer jam      | Parts     | Wi-Fi fix |
| SLA: 6h 🟢     | SLA: 5m ⚠️       | Pending   | Done ✅    |
| [View]         | [View]           | [View]    | [View]    |
|                 |                  |           |            |
| Drag to change status →         |           |            |
+----------------------------------------------------------+
```

**Ticket Detail Modal:**
- Full update history timeline
- "Add Update" with time tracking
- Reassign button (requires reason)
- Attach files
- "Mark Resolved" (requires resolution notes)
- **FORCED UPDATE MODAL** on escalated tickets

### 3. ICT Manager Dashboard (`ict-manager.html`)

**Layout:**
```
+----------------------------------------------------------+
| KPIs:                                                    |
| [15] Open  | [6.5h] Avg Resolution | [12%] SLA Breach   |
+----------------------------------------------------------+
| 📊 CHARTS                        | Recent Escalations   |
|                                  |                      |
| [Bar chart: Tickets by Category] | NDB-0010 - Network  |
| [Line: SLA Compliance Trend]     | Escalated 5m ago    |
| [Pie: Tickets by Priority]       | Assignee: John      |
|                                  | [Reassign] [View]   |
|                                  |                      |
|                                  | NDB-0008 - Server   |
| Filters: [Date Range] [Status]  | Escalated 1h ago    |
| [Export to CSV]                  | [View]              |
+----------------------------------------------------------+
```

**Key Features:**
- Interactive charts with Chart.js
- Date range filtering
- CSV export with all fields
- Escalation quick actions
- Audit trail viewer
- Approve ticket closures

### 4. ICT GM Dashboard (`ict-gm.html`)

**Layout:**
```
+----------------------------------------------------------+
|  EXECUTIVE OVERVIEW                              [Logout] |
+----------------------------------------------------------+
| SLA Compliance: 88%  | Urgent Escalations This Week: 3  |
+----------------------------------------------------------+
| 🚨 ESCALATIONS REQUIRING ATTENTION                       |
|                                                          |
| NDB-0015 - Critical Server Outage                       |
| Escalated: 15 minutes ago | Assignee: Sarah             |
| Reason: SLA deadline exceeded                           |
| Status: In Progress (no update for 10m)                 |
| [Acknowledge] [Request Audit] [View Full Details]       |
|                                                          |
| NDB-0012 - Network Infrastructure Failure               |
| Escalated: 2 hours ago | Assignee: Mike                 |
| Acknowledged: Yes (by GM at 10:30 AM)                   |
| Latest Update: "Waiting on vendor" (30m ago)            |
| [View] [Flag for Investigation]                         |
+----------------------------------------------------------+
| 📧 CC'd Notifications (Last 24h): 12                     |
| [View All Notifications]                                 |
+----------------------------------------------------------+
```

**Key Features:**
- High-level KPIs only
- Escalations feed with acknowledgment
- No ticket editing (oversight only)
- Request immediate audits
- View all CC'd email notifications
- Flag tickets for investigation

## 🔐 **Permissions Matrix**

| Action                  | Helpdesk | Technician | ICT Manager | ICT GM | System |
|-------------------------|----------|------------|-------------|--------|--------|
| Create Ticket           | ✅       | ❌         | ✅          | ❌     | ❌     |
| Assign/Reassign         | ✅       | ✅*        | ✅          | ❌     | ❌     |
| Change Status           | ❌       | ✅         | ✅          | ❌     | ✅     |
| Add Update              | ✅**     | ✅         | ✅          | ❌     | ✅     |
| Change Priority         | ✅***    | ❌         | ✅          | ❌     | ✅     |
| Close Ticket            | ❌****   | ✅         | ✅          | ❌     | ❌     |
| Export CSV              | ❌       | ❌         | ✅          | ✅     | ❌     |
| View Audit Logs         | ❌       | ❌         | ✅          | ✅     | ❌     |
| Acknowledge Escalation  | ❌       | ❌         | ❌          | ✅     | ❌     |
| Trigger SLA Escalation  | ❌       | ❌         | ❌          | ❌     | ✅     |

*Technician can reassign with mandatory reason  
**Helpdesk can only add internal notes  
***Only within first 5 minutes of creation  
****Requires manager approval (policy option)

## 🚀 **Implementation Timeline**

### Week 1: Foundation
- [ ] Day 1-2: Database migrations
- [ ] Day 3: Update API with new endpoints
- [ ] Day 4-5: Enhanced SLA monitor with forced updates

### Week 2: UI Development
- [ ] Day 1-2: Helpdesk Officer page
- [ ] Day 3: Technician Kanban dashboard
- [ ] Day 4-5: ICT Manager analytics

### Week 3: Advanced Features
- [ ] Day 1-2: ICT GM dashboard
- [ ] Day 3: File attachments & time tracking
- [ ] Day 4-5: Testing & bug fixes

### Week 4: Polish & Deploy
- [ ] Day 1-2: Audit logging
- [ ] Day 3: Performance optimization
- [ ] Day 4: Documentation
- [ ] Day 5: Production deployment

## 📝 **Next Immediate Steps**

1. **Run migration:** `python migrate_multirole.py`
2. **Update init_db.py:** Add ICT Manager and GM test users
3. **Create routing logic:** Redirect users to role-specific pages after login
4. **Build Helpdesk Officer page first** (highest priority for daily operations)

## ⚠️ **Critical Notes**

- **Windows clock sync:** Essential for SLA accuracy (use `w32tm /resync`)
- **Background worker:** Must run as Windows Service or scheduled task
- **Database locks:** Use pessimistic locking for escalation logic
- **Notification retries:** Implement exponential backoff
- **Audit everything:** Every action must create an audit log entry

---

**This is a production-grade implementation plan. Would you like me to proceed with implementing any specific phase first?**
