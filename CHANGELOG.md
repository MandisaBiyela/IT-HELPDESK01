# Changelog

All notable changes to the Ndabase IT Helpdesk System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-15

### Initial Release

#### Added

**Core Ticket Management**
- Create tickets with user details and problem description
- Assign tickets to technicians
- Update ticket status (Open, In Progress, Resolved, Closed)
- Add update notes and progress tracking
- Reassign tickets to different technicians
- Complete audit trail of all changes
- Unique ticket numbering system (NDB-0001, NDB-0002, etc.)

**User Authentication & Authorization**
- JWT-based authentication
- Three user roles: Admin, Technician, Helpdesk Officer
- Secure password hashing with bcrypt
- Token-based session management (8 hour default)
- Role-based access control

**SLA Management & Enforcement**
- Automatic SLA deadline calculation based on priority
- Background monitoring service (runs every minute)
- Three priority levels with different SLAs:
  - Urgent: 20 minutes
  - High: 8 hours
  - Normal: 24 hours
- Automatic escalation on SLA breach
- Priority elevation when deadlines exceeded
- Compulsory update requirement for escalated tickets
- Warning system (2 minutes before breach)

**Multi-Channel Notifications**
- Email notifications via SMTP:
  - Ticket created (to assignee and user)
  - Ticket updated (to user)
  - Ticket resolved (to user)
  - SLA escalation (to assignee, GM, and Manager)
- WhatsApp notifications via Twilio:
  - Key status updates
  - Critical escalations
- Professional HTML email templates
- Mandatory CC to ICT GM and ICT Manager on all emails

**Reporting & Analytics**
- Comprehensive statistics dashboard
- Ticket filtering by status, priority, assignee, and date range
- Performance metrics:
  - Total tickets
  - Status breakdown
  - Priority breakdown
  - Average resolution time
  - Technician performance
- CSV export functionality with full ticket data
- Historical data analysis

**Frontend Interface**
- Responsive web interface
- Login page with authentication
- Ticket list view with filtering
- Ticket creation form
- Ticket detail modal with update history
- Real-time status updates
- Reports and analytics dashboard
- CSV export functionality

**Database**
- PostgreSQL database with proper schema
- Four main tables: users, tickets, ticket_updates, sla_escalations
- Proper foreign key relationships
- Audit trail for all changes
- Optimized queries and indexing

**Windows Deployment**
- Windows Server compatible
- Batch scripts for setup and deployment
- NSSM service configuration
- Task Scheduler alternative
- Database backup script
- Comprehensive deployment documentation

**Documentation**
- Complete README with quick start guide
- Detailed user guide
- API documentation
- Deployment guide for Windows Server
- Quick reference card
- Installation checklist

**Security Features**
- Password hashing with bcrypt
- JWT token authentication
- SQL injection protection via ORM
- CORS configuration
- Environment variable security
- HTTPS ready

#### Technical Stack
- FastAPI 0.104.1 (Python 3.9+)
- PostgreSQL 12+
- SQLAlchemy 2.0.23 for ORM
- Pydantic for validation
- APScheduler for background tasks
- aiosmtplib for async email
- Twilio for WhatsApp integration
- Vanilla JavaScript frontend
- Uvicorn ASGI server

#### Configuration
- Environment-based configuration via .env
- Configurable SLA timers
- Customizable email templates
- Flexible SMTP settings
- Optional WhatsApp integration

#### Known Limitations
- No file attachments support
- Single-server deployment only
- No real-time websocket updates
- No mobile app
- No customer self-service portal
- WhatsApp requires Twilio account

---

## Future Roadmap

### [1.1.0] - Planned
- File attachment support for tickets
- Enhanced search functionality
- Email reply parsing
- Ticket templates
- Custom fields

### [1.2.0] - Planned
- Mobile-responsive improvements
- Real-time updates via WebSockets
- Advanced analytics dashboard
- Knowledge base integration
- Canned responses

### [2.0.0] - Planned
- Customer self-service portal
- Mobile applications (iOS/Android)
- Active Directory integration
- Multi-language support
- Advanced reporting with charts
- SLA customization per ticket category

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-10-15 | Initial release with core features |

---

## Upgrade Instructions

### From Nothing to 1.0.0
Follow INSTALLATION_CHECKLIST.md

---

## Support

For questions about changes or upgrades:
- Email: admin@ndabase.com
- Documentation: See README.md

---

**Note**: Always backup your database before upgrading to a new version!
