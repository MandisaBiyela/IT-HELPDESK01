# 🎫 Ndabase IT Helpdesk - Quick Reference

## 🚀 Quick Start Commands

```cmd
# First Time Setup
setup.bat                    # Install dependencies and create .env
python init_db.py           # Initialize database

# Start Application
start.bat                    # Start the server

# Maintenance
backup_db.bat               # Backup database
```

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ndabase.com | admin123 |
| Technician | tech1@ndabase.com | tech123 |
| Helpdesk | helpdesk1@ndabase.com | help123 |

## 🌐 URLs

- **Application**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## ⏱️ SLA Deadlines

| Priority | Deadline | Use When |
|----------|----------|----------|
| 🔴 **Urgent** | 20 min | System down, critical |
| 🟡 **High** | 8 hours | Important, affects work |
| 🟢 **Normal** | 24 hours | Routine requests |

## 📊 Ticket Workflow

```
Create Ticket → Assign → In Progress → Update → Resolve → Close
                  ↓
            SLA Monitoring
                  ↓
         Escalate if Breached
```

## 🔔 Notification Events

✅ Ticket Created  
✅ Ticket Updated  
✅ Ticket Resolved  
🚨 SLA Escalation (2 min warning + breach)

**Recipients**: User, Assignee, ICT GM, ICT Manager

## 🎯 Key Features

### Ticket Management
- ✅ Create with user details
- ✅ Assign to technicians
- ✅ Update status/priority
- ✅ Add progress notes
- ✅ Reassign if needed
- ✅ Complete audit trail

### SLA Enforcement
- ✅ Auto-monitoring every minute
- ✅ Escalation on breach
- ✅ Compulsory updates
- ✅ Priority elevation

### Notifications
- 📧 Email (HTML templates)
- 📱 WhatsApp (Twilio)
- 👔 Management CC'd on all

### Reporting
- 📊 Statistics dashboard
- 🔍 Advanced filters
- 📥 CSV export
- 📈 Performance metrics

## 🛠️ Maintenance Tasks

### Daily
- [ ] Check escalated tickets
- [ ] Review pending tickets
- [ ] Monitor SLA compliance

### Weekly
- [ ] Review statistics
- [ ] Export reports
- [ ] Check system logs

### Monthly
- [ ] Database backup
- [ ] Performance review
- [ ] Update dependencies

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login | Check credentials, verify user is active |
| No emails | Check SMTP settings in .env |
| WhatsApp fails | Verify Twilio credentials |
| DB error | Check PostgreSQL is running |
| Port in use | Change port or kill process |

## 📁 Important Files

```
.env                    # Configuration (SECRET!)
helpdesk.log           # Application logs
backups/               # Database backups
requirements.txt       # Python dependencies
```

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Restrict database access
- [ ] Regular backups
- [ ] Update dependencies
- [ ] Monitor logs

## 📞 Support

**Email**: admin@ndabase.com  
**Documentation**: 
- User Guide: USER_GUIDE.md
- API Docs: API_DOCUMENTATION.md
- Deployment: DEPLOYMENT.md

## 🎨 Status Codes

| Status | Meaning |
|--------|---------|
| Open | New ticket |
| In Progress | Being worked on |
| Resolved | Issue fixed |
| Closed | Completed |

## 🏷️ Priority Badges

🔴 Urgent → 🟡 High → 🟢 Normal

## 📝 Update Best Practices

1. **Be Specific**: "Replaced network cable" not "Fixed it"
2. **Add Context**: Explain what you did and why
3. **Regular Updates**: Every 30-60 minutes for urgent
4. **Document Solutions**: Help future tickets
5. **Before Resolve**: Always verify with user

## ⚡ Keyboard Shortcuts (Frontend)

- **F5**: Refresh tickets
- **Ctrl+Click**: Open ticket in modal
- **Esc**: Close modal

## 📊 Reports Filters

```
Status: Open | In Progress | Resolved | Closed
Priority: Urgent | High | Normal
Assignee: [Dropdown]
Date Range: Start → End
```

## 🎯 API Endpoints (Quick)

```
POST   /api/auth/login          # Login
GET    /api/auth/me             # Current user
GET    /api/tickets             # List tickets
POST   /api/tickets             # Create ticket
GET    /api/tickets/{number}    # Get ticket
PATCH  /api/tickets/{number}    # Update ticket
GET    /api/reports/statistics  # Get stats
GET    /api/reports/tickets/export  # Export CSV
```

## 🔄 SLA Escalation Flow

```
Ticket Created
     ↓
SLA Deadline Set
     ↓
Monitor Every Minute
     ↓
[2 min before] → Warning Logged
     ↓
[Deadline passed] → ESCALATE
     ↓
- Priority ↑
- Compulsory Update Required
- Notifications Sent
- New SLA Set
```

## 💡 Pro Tips

1. **Triage Correctly**: Wrong priority = missed SLA
2. **Update Often**: Keep users informed
3. **Use Templates**: Save common responses
4. **Tag Knowledge**: Build solutions database
5. **Monitor Dashboard**: Stay ahead of escalations

---

**Need Help?** Check USER_GUIDE.md or contact IT Admin
**Version**: 1.0.0 | **Updated**: Oct 2025
