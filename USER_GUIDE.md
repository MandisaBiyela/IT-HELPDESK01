# Ndabase IT Helpdesk - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Creating Tickets](#creating-tickets)
5. [Managing Tickets](#managing-tickets)
6. [SLA Management](#sla-management)
7. [Reports and Analytics](#reports-and-analytics)
8. [Notifications](#notifications)
9. [Best Practices](#best-practices)

## Introduction

The Ndabase IT Helpdesk System is an internal ticketing platform designed to streamline IT support operations. It provides:

- **Ticket Management**: Create, track, and resolve IT support tickets
- **SLA Enforcement**: Automatic monitoring and escalation of overdue tickets
- **Multi-Channel Notifications**: Email and WhatsApp alerts for key events
- **Historical Reporting**: Analytics and CSV exports for performance tracking
- **Accountability**: Complete audit trail of all ticket changes

## Getting Started

### Accessing the System

1. Open your web browser
2. Navigate to: `http://your-server:8000/static/index.html`
3. You will see the login page

### Logging In

1. Enter your email address
2. Enter your password
3. Click "Login"

Your role determines what features you can access.

## User Roles

### Admin
- Full system access
- Can create and manage users
- Access all tickets and reports
- Configure system settings

### Helpdesk Officer
- Create new tickets
- Assign tickets to technicians
- View all tickets
- Generate reports

### Technician
- View assigned tickets
- Update ticket status
- Add updates and notes
- Resolve tickets
- Reassign tickets

## Creating Tickets

### Step-by-Step Guide

1. **Click "Create Ticket"** in the navigation menu
2. **Fill in the form**:
   - **User Name**: Name of the person with the issue (required)
   - **User Email**: Their email address for notifications (required)
   - **User Phone**: Phone number for WhatsApp notifications (required)
   - **Problem Summary**: Brief description of the issue (required)
   - **Detailed Description**: Full explanation of the problem (optional)
   - **Priority**: Select urgency level (required)
     - **Normal**: Standard issues (24 hour SLA)
     - **High**: Important issues (8 hour SLA)
     - **Urgent**: Critical issues (20 minute SLA)
   - **Assign To**: Select the technician to handle this ticket (required)

3. **Click "Create Ticket"**

4. A unique ticket number will be generated (e.g., NDB-0001)

5. **Notifications Sent**:
   - Email to the assigned technician
   - Email to the user
   - WhatsApp notification to assignee
   - CC to ICT GM and ICT Manager

## Managing Tickets

### Viewing Tickets

1. Click "Tickets" in the navigation menu
2. You'll see a list of all tickets (or those assigned to you)
3. Use filters to narrow down:
   - **Status**: Open, In Progress, Resolved, Closed
   - **Priority**: Urgent, High, Normal

### Viewing Ticket Details

1. Click on any ticket card
2. A modal will open showing:
   - Full ticket information
   - User contact details
   - Current status and priority
   - SLA deadline
   - Complete update history
   - Update form

### Updating a Ticket

1. Open the ticket detail modal
2. Scroll to "Update Ticket" section
3. You can:
   - **Change Status**:
     - Open: Newly created
     - In Progress: Being worked on
     - Resolved: Issue fixed
     - Closed: Ticket completed
   - **Change Priority**: Escalate or de-escalate
   - **Reassign**: Transfer to another technician
   - **Add Update**: Provide progress notes

4. **Update Description**:
   - Explain what you did
   - Document troubleshooting steps
   - Note any blockers or delays

5. Click "Update Ticket"

6. **Notifications Sent**:
   - Email to user with update
   - WhatsApp notification (if status changed)
   - CC to management

### Resolving a Ticket

1. Open the ticket
2. Change status to "Resolved"
3. **Must** add an update explaining:
   - What the problem was
   - How it was fixed
   - Any follow-up needed

4. Click "Update Ticket"

5. User receives resolution notification

### Reassigning a Ticket

If you can't resolve a ticket:

1. Open the ticket
2. Select new assignee from "Reassign To" dropdown
3. Add update explaining why (e.g., "Requires network specialist")
4. Click "Update Ticket"
5. New assignee receives notification

## SLA Management

### Understanding SLA Deadlines

Each priority level has a resolution deadline:

- **Urgent**: 20 minutes
- **High**: 8 hours
- **Normal**: 24 hours

The deadline is calculated from ticket creation time.

### SLA Warning (2 Minutes Before Breach)

When a ticket is 2 minutes from its SLA deadline:
- System checks if it's still Open or In Progress
- Warning logged internally

### SLA Breach (Escalation)

When the SLA deadline passes:

1. **Automatic Actions**:
   - Priority escalated to next level
   - Ticket flagged as "escalated"
   - Compulsory update required

2. **Notifications Sent**:
   - 🚨 Urgent email to assignee
   - 🚨 Email to ICT GM
   - 🚨 Email to ICT Manager
   - WhatsApp alerts to all

3. **Required Action**:
   - Technician **MUST** provide an update
   - Cannot change status/priority until update given
   - Update should explain the delay

### Handling Escalated Tickets

If you receive an escalation alert:

1. **Immediately** open the ticket
2. Review the current situation
3. Add an update explaining:
   - Why the delay occurred
   - Current status
   - Expected resolution time
   - Any help needed

4. This clears the "compulsory update" flag
5. Continue working on resolution

## Reports and Analytics

### Viewing Statistics

1. Click "Reports" in navigation
2. Set date range (optional):
   - Start Date
   - End Date
3. Click "Load Statistics"

### Available Metrics

- **Overall Statistics**:
  - Total tickets
  - Escalated count
  - Average resolution time (hours)

- **Status Breakdown**:
  - Open tickets
  - In Progress tickets
  - Resolved tickets
  - Closed tickets

- **Priority Breakdown**:
  - Urgent tickets
  - High priority tickets
  - Normal tickets

- **Technician Performance**:
  - Total tickets per technician
  - In progress count
  - Resolved count
  - Escalated count

### Exporting to CSV

1. In Reports section, set filters:
   - Status (optional)
   - Priority (optional)
   - Date range (optional)

2. Click "Export to CSV"

3. File downloads with all ticket data:
   - Ticket ID
   - Created Date
   - User details
   - Problem summary and description
   - Priority and Status
   - Assignee information
   - SLA deadline
   - Resolution date
   - Escalation status
   - Update count

4. Open in Excel for analysis

## Notifications

### Email Notifications

You'll receive emails for:

1. **Ticket Created** (if assigned):
   - Ticket number and priority
   - User contact information
   - Problem details
   - SLA deadline
   - Link to view ticket

2. **Ticket Updated** (if you're the user):
   - Current status
   - Latest update text
   - Who made the update

3. **Ticket Resolved** (if you're the user):
   - Confirmation of resolution
   - Who resolved it

4. **SLA Escalation**:
   - ⚠️ Critical alert
   - Ticket details
   - Escalation reason
   - Required action

**Note**: ICT GM and ICT Manager are CC'd on ALL emails.

### WhatsApp Notifications

Simpler notifications sent for:

- Ticket assigned to you
- Ticket updated (for user)
- Ticket resolved (for user)
- SLA escalation (urgent)

## Best Practices

### For Helpdesk Officers

1. **Accurate Triage**:
   - Assess priority correctly
   - Urgent = system down, critical business impact
   - High = important but not critical
   - Normal = routine requests

2. **Right Assignee**:
   - Match issue to technician expertise
   - Balance workload

3. **Complete Information**:
   - Get all details from user
   - Document problem clearly
   - Include screenshots if possible

### For Technicians

1. **Regular Updates**:
   - Update tickets every 30-60 minutes
   - Keep users informed
   - Document your steps

2. **Status Management**:
   - Change to "In Progress" when you start
   - Only mark "Resolved" when truly fixed
   - Verify with user before closing

3. **SLA Awareness**:
   - Check ticket deadlines
   - Prioritize by SLA, not just priority
   - Request help before escalation

4. **Clear Documentation**:
   - Explain what you did
   - Note solutions for future reference
   - Document any workarounds

5. **Reassign When Needed**:
   - Don't sit on tickets you can't solve
   - Escalate to senior tech or specialist
   - Add context in reassignment note

### For Managers

1. **Monitor Dashboard**:
   - Check for escalated tickets daily
   - Review pending tickets
   - Identify bottlenecks

2. **Team Performance**:
   - Use reports to track resolution times
   - Identify training needs
   - Balance workload

3. **SLA Compliance**:
   - Review escalation trends
   - Address systemic issues
   - Adjust priorities as needed

## Common Scenarios

### Scenario 1: User Reports Email Not Working

1. Create ticket
2. Priority: High (affects productivity)
3. Assign to email specialist
4. SLA: 8 hours
5. Technician troubleshoots and updates ticket
6. Resolved within 2 hours
7. User notified

### Scenario 2: Server Down

1. Create ticket
2. Priority: Urgent (critical system)
3. Assign to senior technician
4. SLA: 20 minutes
5. Status to "In Progress" immediately
6. Update every 5-10 minutes
7. If can't fix in 15 minutes, request help
8. Mark resolved when server back up

### Scenario 3: Routine Software Install

1. Create ticket
2. Priority: Normal
3. Assign to available technician
4. SLA: 24 hours
5. Schedule installation
6. Complete and mark resolved
7. Document software version installed

### Scenario 4: Ticket About to Breach SLA

1. Technician receives warning (2 min before)
2. Options:
   - If almost done: finish and resolve
   - If need more time: add update explaining delay
   - If stuck: reassign to someone who can help
3. Avoid escalation by being proactive

## Troubleshooting

### Can't Login

- Verify email and password
- Check with admin if account is active
- Clear browser cache and try again

### Don't See Tickets

- Check filters (Status, Priority)
- Click "Refresh"
- Verify your role permissions

### Can't Update Ticket

- Check if compulsory update is required
- Ensure you're the assignee or have permissions
- Refresh the page

### Notifications Not Received

- Check spam/junk folder
- Verify email address in system
- Contact admin to check SMTP settings

## Support

For system issues or questions:
- Contact: IT Administrator
- Email: admin@ndabase.com
- Phone: [Your contact number]

## Version History

- **v1.0.0** - Initial release (October 2025)
  - Core ticketing functionality
  - SLA monitoring and escalation
  - Email and WhatsApp notifications
  - Reporting and CSV export
