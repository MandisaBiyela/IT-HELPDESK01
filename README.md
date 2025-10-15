# 🎫 Ndabase IT Helpdesk Ticketing System

A comprehensive, internal Helpdesk Ticketing System built with FastAPI for Ndabase Printing Solutions. This system streamlines IT support operations with automated SLA enforcement, multi-channel notifications, and detailed reporting.

## ✨ Features

### Core Functionality
- **Complete Ticket Management**: Create, assign, update, track, and resolve IT support tickets
- **Smart Assignment**: Assign tickets to technicians with role-based access control
- **Real-time Updates**: Add progress notes and track all ticket changes with complete audit trail
- **Ticket Reassignment**: Transfer tickets to specialists when needed

### SLA Enforcement
- **Automated Monitoring**: Background service checks SLA deadlines every minute
- **Priority-Based Timers**:
  - 🔴 **Urgent**: 20 minutes
  - 🟡 **High**: 8 hours  
  - 🟢 **Normal**: 24 hours
- **Auto-Escalation**: Tickets automatically escalate when SLA breached
- **Compulsory Updates**: System requires explanation for delayed tickets

### Notifications
- **Email Notifications**: 
  - Ticket created/updated/resolved
  - SLA escalation alerts
  - Management always CC'd
  - Professional HTML templates
- **WhatsApp Integration**:
  - Key status updates via Twilio
  - Critical escalation alerts
  - User-friendly messages

### Reporting & Analytics
- **Comprehensive Statistics**: 
  - Ticket counts by status/priority
  - Average resolution time
  - Technician performance metrics
- **Advanced Filtering**: By status, priority, assignee, date range
- **CSV Export**: Full data export for Excel analysis

### Security & Accountability
- **JWT Authentication**: Secure token-based login
- **Role-Based Access**: Admin, Technician, Helpdesk Officer roles
- **Complete Audit Trail**: Every change logged with timestamp and user
- **Password Hashing**: Bcrypt encryption for credentials

## 🏗️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | FastAPI (Python 3.9+) |
| **Database** | PostgreSQL 12+ |
| **Authentication** | JWT (JSON Web Tokens) |
| **Email** | SMTP (aiosmtplib) |
| **WhatsApp** | Twilio WhatsApp Business API |
| **Background Tasks** | APScheduler |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Deployment** | Windows Server, Uvicorn |

## 📋 Prerequisites

- **Operating System**: Windows Server (any recent version) or Windows 10/11
- **Python**: 3.9 or higher
- **PostgreSQL**: 12 or higher
- **Network**: Open ports 80, 443, and 8000
- **Email**: SMTP server access (Gmail, Outlook, etc.)
- **WhatsApp** (optional): Twilio account with WhatsApp Business API

## 🚀 Quick Start

### 1. Run Setup Script

```cmd
setup.bat
```

This will:
- Create virtual environment
- Install all dependencies
- Create `.env` file from template

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# Database
DATABASE_URL=postgresql://helpdesk_user:your_password@localhost/helpdesk_db

# Security (generate new secret!)
SECRET_KEY=your-secret-key-here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=helpdesk@ndabase.com

# Management Contacts
ICT_GM_EMAIL=gm@ndabase.com
ICT_MANAGER_EMAIL=manager@ndabase.com

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Set Up Database

**Install PostgreSQL** if not already installed, then:

```sql
-- Create database and user
CREATE DATABASE helpdesk_db;
CREATE USER helpdesk_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk_user;
```

**Initialize tables and seed data**:

```cmd
python init_db.py
```

### 4. Start the Application

```cmd
start.bat
```

Or manually:

```cmd
venv\Scripts\activate
python run_server.py
```

### 5. Access the System

- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 👤 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@ndabase.com | admin123 |
| **Technician** | tech1@ndabase.com | tech123 |
| **Helpdesk** | helpdesk1@ndabase.com | help123 |

⚠️ **IMPORTANT**: Change these passwords immediately in production!

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)**: Complete guide for end users
- **[API Documentation](API_DOCUMENTATION.md)**: REST API reference
- **[Deployment Guide](DEPLOYMENT.md)**: Windows Server production deployment

## 🎯 Key User Stories

### Helpdesk Officer
- Create tickets with user details and problem description
- Assign to appropriate technician
- Set priority level (Urgent/High/Normal)
- Track ticket status

### Technician
- View assigned tickets
- Update ticket status (Open → In Progress → Resolved)
- Add progress notes and updates
- Reassign to specialists if needed
- Meet SLA deadlines

### ICT Manager
- View all tickets and statistics
- Monitor SLA compliance
- Export data to CSV for analysis
- Receive escalation alerts
- Track team performance

## 🔧 Project Structure

```
IT-HELPDESK/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py       # Authentication routes
│   │   ├── tickets.py    # Ticket management
│   │   └── reports.py    # Reports & analytics
│   ├── models/           # Database models
│   │   ├── user.py
│   │   └── ticket.py
│   ├── schemas/          # Pydantic validation
│   │   ├── user.py
│   │   └── ticket.py
│   ├── services/         # Business logic
│   │   ├── email_service.py
│   │   ├── whatsapp_service.py
│   │   └── sla_monitor.py
│   ├── utils/            # Utilities
│   │   ├── auth.py
│   │   └── ticket_helpers.py
│   ├── config.py         # Settings
│   ├── database.py       # DB connection
│   └── main.py           # FastAPI app
├── static/               # Frontend
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── init_db.py            # Database initialization
├── run_server.py         # Production runner
├── setup.bat             # Windows setup script
├── start.bat             # Windows start script
├── backup_db.bat         # Database backup
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
└── README.md
```

## 🔄 SLA Workflow

1. **Ticket Created** → SLA deadline calculated based on priority
2. **2 Minutes Before Breach** → System checks ticket status
3. **SLA Breached** → Automatic escalation:
   - Priority elevated (Normal→High→Urgent)
   - Compulsory update required
   - Notifications sent to assignee, GM, Manager
   - New SLA deadline set
4. **Technician Updates** → Compulsory flag cleared
5. **Ticket Resolved** → SLA timer stops

## 📊 Database Schema

### Users
```sql
- id (PK)
- name
- email (unique)
- phone
- hashed_password
- role (admin/technician/helpdesk_officer)
- is_active
```

### Tickets
```sql
- id (PK)
- ticket_number (unique, e.g., NDB-0001)
- user_name, user_email, user_phone
- problem_summary, problem_description
- priority, status
- assignee_id (FK)
- created_at, resolved_at, sla_deadline
- requires_update, escalated
```

### Ticket Updates
```sql
- id (PK)
- ticket_id (FK)
- update_text
- updated_by_id (FK)
- created_at
- old_status, new_status
- old_assignee_id, new_assignee_id
- old_priority, new_priority
```

### SLA Escalations
```sql
- id (PK)
- ticket_id (FK)
- escalation_reason
- escalated_at
- previous_priority, new_priority
```

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: Secure authentication
- **Token Expiration**: 8 hours (configurable)
- **Role-Based Access**: Granular permissions
- **SQL Injection Protection**: SQLAlchemy ORM
- **HTTPS Support**: SSL/TLS ready
- **CORS Configuration**: Customizable origins

## 🛠️ Maintenance

### Database Backup

```cmd
backup_db.bat
```

Or manually:
```cmd
pg_dump -U helpdesk_user -h localhost helpdesk_db > backup.sql
```

### View Logs

Check `helpdesk.log` in project directory for:
- Application events
- SLA escalations
- Email/WhatsApp delivery status
- Errors and warnings

### Update Application

1. Stop the service
2. Pull new code
3. Activate venv: `venv\Scripts\activate`
4. Update dependencies: `pip install -r requirements.txt`
5. Run migrations if needed
6. Restart service

## 🐛 Troubleshooting

### Common Issues

**Can't connect to database**
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database and user exist

**Email notifications not working**
- Check SMTP credentials
- For Gmail: Use App Password (not regular password)
- Check spam folder
- Review logs for errors

**WhatsApp not working**
- Verify Twilio credentials
- Check sandbox approval (development)
- For production: Apply for WhatsApp Business API

**Port 8000 already in use**
- Find process: `netstat -ano | findstr :8000`
- Kill process or change port in `run_server.py`

## 📈 Performance

- Handles **1000+ concurrent tickets**
- SLA checks run every **60 seconds**
- Background tasks don't block API
- PostgreSQL connection pooling
- Async email/notification sending

## 🔮 Future Enhancements

- [ ] File attachments for tickets
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Knowledge base integration
- [ ] Customer portal (self-service)
- [ ] Integration with Active Directory
- [ ] Multi-language support

## 📝 License

Internal use only - Ndabase Printing Solutions

## 👥 Support

For questions or issues:

- **Email**: admin@ndabase.com
- **Documentation**: See USER_GUIDE.md
- **API Docs**: http://your-server:8000/docs

## 🙏 Acknowledgments

Built with ❤️ for Ndabase Printing Solutions IT Department

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Author**: IT Development Team
