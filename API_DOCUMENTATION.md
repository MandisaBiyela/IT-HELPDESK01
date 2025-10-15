# API Documentation

Complete API reference for the Ndabase IT Helpdesk System.

## Base URL

```
http://your-server:8000
```

## Authentication

All API endpoints (except login) require authentication using JWT Bearer tokens.

### Getting a Token

**Endpoint**: `POST /api/auth/login`

**Request Body** (form-data):
```
username: user@example.com
password: yourpassword
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Using the Token**:

Include in request headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Authentication Endpoints

### POST /api/auth/login

Login and receive access token.

**Request Body**:
```
username=user@example.com&password=pass123
```

**Response**: Token object

### POST /api/auth/register

Register a new user (admin only).

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+27123456789",
  "password": "securepass123",
  "role": "technician"
}
```

**Roles**: `admin`, `technician`, `helpdesk_officer`

### GET /api/auth/me

Get current user information.

**Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+27123456789",
  "role": "technician",
  "is_active": true
}
```

### GET /api/auth/users

Get all active users (for assignee dropdown).

**Response**: Array of user objects

## Ticket Endpoints

### POST /api/tickets

Create a new ticket.

**Request Body**:
```json
{
  "user_name": "Jane Smith",
  "user_email": "jane@example.com",
  "user_phone": "+27987654321",
  "problem_summary": "Email not working",
  "problem_description": "Cannot send or receive emails since this morning",
  "priority": "High",
  "assignee_id": 2
}
```

**Priority Values**: `Normal`, `High`, `Urgent`

**Response**:
```json
{
  "id": 1,
  "ticket_number": "NDB-0001",
  "user_name": "Jane Smith",
  "user_email": "jane@example.com",
  "user_phone": "+27987654321",
  "problem_summary": "Email not working",
  "problem_description": "Cannot send or receive emails since this morning",
  "priority": "High",
  "status": "Open",
  "assignee_id": 2,
  "assignee_name": "John Doe",
  "created_at": "2025-10-15T10:30:00",
  "resolved_at": null,
  "sla_deadline": "2025-10-15T18:30:00",
  "requires_update": false,
  "escalated": false,
  "updates": []
}
```

### GET /api/tickets

Get all tickets with optional filters.

**Query Parameters**:
- `status` (optional): Filter by status (`Open`, `In Progress`, `Resolved`, `Closed`)
- `priority` (optional): Filter by priority (`Normal`, `High`, `Urgent`)
- `assignee_id` (optional): Filter by assignee ID

**Example**:
```
GET /api/tickets?status=Open&priority=Urgent
```

**Response**: Array of ticket list objects

### GET /api/tickets/{ticket_number}

Get a specific ticket with full details and update history.

**Example**:
```
GET /api/tickets/NDB-0001
```

**Response**: Full ticket object with updates array

### PATCH /api/tickets/{ticket_number}

Update a ticket (status, priority, assignee, or add update).

**Request Body** (all fields optional):
```json
{
  "status": "In Progress",
  "priority": "Urgent",
  "assignee_id": 3,
  "update_text": "Investigating the email server issue"
}
```

**Status Values**: `Open`, `In Progress`, `Resolved`, `Closed`

**Response**: Updated ticket object

**Notes**:
- If ticket has `requires_update: true`, you MUST provide `update_text`
- Changing status to `Resolved` sets `resolved_at` timestamp
- Notifications are sent automatically

### GET /api/tickets/{ticket_number}/updates

Get all updates for a specific ticket.

**Response**:
```json
[
  {
    "id": 1,
    "ticket_id": 1,
    "update_text": "Investigating the email server issue",
    "updated_by_id": 2,
    "updated_by_name": "John Doe",
    "created_at": "2025-10-15T10:45:00",
    "old_status": "Open",
    "new_status": "In Progress",
    "old_assignee_id": null,
    "new_assignee_id": null,
    "old_priority": null,
    "new_priority": null
  }
]
```

## Reports Endpoints

### GET /api/reports/statistics

Get ticket statistics and analytics.

**Query Parameters**:
- `start_date` (optional): ISO format datetime
- `end_date` (optional): ISO format datetime

**Example**:
```
GET /api/reports/statistics?start_date=2025-10-01T00:00:00&end_date=2025-10-31T23:59:59
```

**Response**:
```json
{
  "total_tickets": 150,
  "status_breakdown": {
    "open": 20,
    "in_progress": 30,
    "resolved": 80,
    "closed": 20
  },
  "priority_breakdown": {
    "urgent": 10,
    "high": 40,
    "normal": 100
  },
  "escalated_count": 5,
  "average_resolution_hours": 6.5,
  "assignee_performance": {
    "John Doe": {
      "total": 50,
      "resolved": 40,
      "in_progress": 8,
      "escalated": 2
    },
    "Jane Smith": {
      "total": 45,
      "resolved": 38,
      "in_progress": 6,
      "escalated": 1
    }
  }
}
```

### GET /api/reports/tickets/export

Export tickets to CSV file.

**Query Parameters** (all optional):
- `status`: Filter by status
- `priority`: Filter by priority
- `assignee_id`: Filter by assignee
- `start_date`: ISO format datetime
- `end_date`: ISO format datetime

**Example**:
```
GET /api/reports/tickets/export?priority=Urgent&start_date=2025-10-01T00:00:00
```

**Response**: CSV file download

**CSV Columns**:
- Ticket ID
- Created Date
- User Name
- User Email
- User Phone
- Problem Summary
- Problem Description
- Priority
- Status
- Assignee
- Assignee Email
- SLA Deadline
- Resolved Date
- Escalated
- Updates Count

## Error Responses

### 400 Bad Request

Invalid request data.

```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden

User doesn't have permission for this action.

```json
{
  "detail": "You don't have permission to perform this action"
}
```

### 404 Not Found

Resource not found.

```json
{
  "detail": "Ticket NDB-9999 not found"
}
```

### 500 Internal Server Error

Server error.

```json
{
  "detail": "Internal server error"
}
```

## Data Models

### User

```typescript
{
  id: number
  name: string
  email: string
  phone: string | null
  role: "admin" | "technician" | "helpdesk_officer"
  is_active: boolean
}
```

### Ticket

```typescript
{
  id: number
  ticket_number: string
  user_name: string
  user_email: string
  user_phone: string
  problem_summary: string
  problem_description: string | null
  priority: "Normal" | "High" | "Urgent"
  status: "Open" | "In Progress" | "Resolved" | "Closed"
  assignee_id: number
  assignee_name: string
  created_at: datetime
  resolved_at: datetime | null
  sla_deadline: datetime
  requires_update: boolean
  escalated: boolean
  updates: TicketUpdate[]
}
```

### TicketUpdate

```typescript
{
  id: number
  ticket_id: number
  update_text: string
  updated_by_id: number
  updated_by_name: string
  created_at: datetime
  old_status: string | null
  new_status: string | null
  old_assignee_id: number | null
  new_assignee_id: number | null
  old_priority: string | null
  new_priority: string | null
}
```

## Rate Limiting

Currently no rate limiting is enforced. May be added in future versions.

## Webhooks

Not currently supported. May be added in future versions.

## Interactive Documentation

For interactive API documentation with the ability to test endpoints:

- **Swagger UI**: http://your-server:8000/docs
- **ReDoc**: http://your-server:8000/redoc

## Code Examples

### Python Example

```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login', data={
    'username': 'admin@ndabase.com',
    'password': 'admin123'
})
token = response.json()['access_token']

# Get tickets
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/tickets', headers=headers)
tickets = response.json()

# Create ticket
new_ticket = {
    'user_name': 'John User',
    'user_email': 'john@example.com',
    'user_phone': '+27123456789',
    'problem_summary': 'Printer not working',
    'priority': 'Normal',
    'assignee_id': 2
}
response = requests.post('http://localhost:8000/api/tickets', 
                        json=new_ticket, headers=headers)
ticket = response.json()
```

### JavaScript Example

```javascript
// Login
const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    body: new URLSearchParams({
        username: 'admin@ndabase.com',
        password: 'admin123'
    })
});
const { access_token } = await loginResponse.json();

// Get tickets
const ticketsResponse = await fetch('http://localhost:8000/api/tickets', {
    headers: {
        'Authorization': `Bearer ${access_token}`
    }
});
const tickets = await ticketsResponse.json();

// Update ticket
const updateResponse = await fetch('http://localhost:8000/api/tickets/NDB-0001', {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        status: 'In Progress',
        update_text: 'Working on it'
    })
});
const updated = await updateResponse.json();
```

## Support

For API questions or issues:
- Email: admin@ndabase.com
- Documentation: http://your-server:8000/docs
