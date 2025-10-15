# Installation Checklist

Complete this checklist to ensure proper deployment of the Ndabase IT Helpdesk System.

## Pre-Installation

### System Requirements
- [ ] Windows Server 2016+ or Windows 10/11
- [ ] 4GB RAM minimum (8GB recommended)
- [ ] 20GB free disk space
- [ ] Administrator access
- [ ] Internet connection

### Software Prerequisites
- [ ] Python 3.9+ installed
- [ ] Python added to PATH
- [ ] PostgreSQL 12+ installed
- [ ] PostgreSQL service running

### Network Requirements
- [ ] Port 80 available (HTTP)
- [ ] Port 443 available (HTTPS)
- [ ] Port 8000 available (API)
- [ ] Firewall rules configured

### External Services
- [ ] SMTP server access (Gmail, Outlook, etc.)
- [ ] Email account for sending notifications
- [ ] Twilio account (for WhatsApp - optional)
- [ ] Management email addresses confirmed

## Installation Steps

### 1. Download & Extract
- [ ] Project files copied to: `C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK`
- [ ] All files and folders present
- [ ] No corrupted files

### 2. Database Setup
- [ ] PostgreSQL installed
- [ ] Database `helpdesk_db` created
- [ ] User `helpdesk_user` created
- [ ] Permissions granted
- [ ] Connection tested

```sql
-- Run these commands
CREATE DATABASE helpdesk_db;
CREATE USER helpdesk_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk_user;
```

### 3. Python Environment
- [ ] Opened Command Prompt as Administrator
- [ ] Navigated to project directory
- [ ] Ran `setup.bat`
- [ ] Virtual environment created successfully
- [ ] All dependencies installed without errors

### 4. Configuration
- [ ] `.env` file created
- [ ] DATABASE_URL configured with correct credentials
- [ ] SECRET_KEY generated (use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] APP_BASE_URL set to server URL
- [ ] SMTP settings configured
- [ ] SMTP credentials tested
- [ ] Management emails set (ICT_GM_EMAIL, ICT_MANAGER_EMAIL)
- [ ] Twilio credentials configured (if using WhatsApp)

### 5. Database Initialization
- [ ] Activated virtual environment: `venv\Scripts\activate`
- [ ] Ran `python init_db.py`
- [ ] No errors displayed
- [ ] Tables created successfully
- [ ] Default users created
- [ ] Default credentials noted

### 6. First Test Run
- [ ] Ran `start.bat`
- [ ] Server started without errors
- [ ] Opened browser to `http://localhost:8000`
- [ ] Redirected to login page
- [ ] Logged in with admin credentials
- [ ] Dashboard loaded successfully
- [ ] No console errors

## Post-Installation

### Security Configuration
- [ ] Changed admin password
- [ ] Changed all default passwords
- [ ] Reviewed user roles
- [ ] Tested authentication
- [ ] Verified token expiration

### Email Testing
- [ ] Created test ticket
- [ ] Verified email received
- [ ] Checked email formatting
- [ ] Confirmed management CC'd
- [ ] Tested all notification types:
  - [ ] Ticket created
  - [ ] Ticket updated
  - [ ] Ticket resolved
  - [ ] SLA escalation (create urgent ticket and wait)

### WhatsApp Testing (if enabled)
- [ ] Created test ticket
- [ ] Verified WhatsApp message received
- [ ] Tested escalation notification
- [ ] Confirmed message format

### Functionality Testing
- [ ] Create ticket
- [ ] Assign ticket
- [ ] Update ticket status
- [ ] Add update notes
- [ ] Reassign ticket
- [ ] Resolve ticket
- [ ] View ticket history
- [ ] Filter tickets
- [ ] Export to CSV
- [ ] View statistics

### SLA Testing
- [ ] Created urgent test ticket (20 min SLA)
- [ ] Monitored SLA countdown
- [ ] Verified escalation after deadline
- [ ] Confirmed escalation notifications sent
- [ ] Tested compulsory update requirement
- [ ] Verified priority elevation

### Performance Testing
- [ ] Created 10+ test tickets
- [ ] Tested with concurrent users
- [ ] Verified response times acceptable
- [ ] Checked database performance
- [ ] Reviewed log files for errors

## Production Deployment

### Windows Service Setup
- [ ] NSSM downloaded and extracted
- [ ] Service installed with NSSM
- [ ] Service configured
- [ ] Service set to auto-start
- [ ] Service started successfully
- [ ] Service tested after reboot

OR

- [ ] Task Scheduler configured
- [ ] Task runs at startup
- [ ] Task runs with highest privileges
- [ ] Task tested

### Firewall Configuration
- [ ] Windows Firewall rules added
- [ ] Port 80 accessible
- [ ] Port 443 accessible
- [ ] Port 8000 accessible
- [ ] External access tested

### Backup Configuration
- [ ] Backup script tested
- [ ] Backup location configured
- [ ] Scheduled task created for daily backup
- [ ] Backup restoration tested

### Monitoring Setup
- [ ] Log rotation configured
- [ ] Disk space monitoring enabled
- [ ] Email alert testing completed
- [ ] Performance monitoring established

### SSL/HTTPS (Recommended)
- [ ] SSL certificate obtained
- [ ] IIS configured as reverse proxy
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] HTTP to HTTPS redirect configured

## User Training

### Documentation Distributed
- [ ] README.md shared
- [ ] USER_GUIDE.md shared
- [ ] QUICK_REFERENCE.md shared
- [ ] API_DOCUMENTATION.md shared (for developers)

### Training Sessions
- [ ] Helpdesk officers trained on ticket creation
- [ ] Technicians trained on ticket management
- [ ] Managers trained on reporting
- [ ] All users trained on SLA expectations

### Support Established
- [ ] Support contact information shared
- [ ] Escalation procedures documented
- [ ] FAQ created
- [ ] Feedback mechanism established

## Go-Live Checklist

### Final Verification
- [ ] All default passwords changed
- [ ] All test tickets deleted
- [ ] Production users created
- [ ] Email notifications working
- [ ] WhatsApp notifications working (if enabled)
- [ ] SLA monitoring active
- [ ] Backup running
- [ ] Monitoring in place

### Communication
- [ ] Launch announcement sent
- [ ] User guide distributed
- [ ] Support channels announced
- [ ] Quick reference cards printed

### Day 1 Monitoring
- [ ] Monitor for errors
- [ ] Check email delivery
- [ ] Verify SLA monitoring
- [ ] Monitor system performance
- [ ] Respond to user feedback

## Ongoing Maintenance

### Daily Tasks
- [ ] Review escalated tickets
- [ ] Check system logs
- [ ] Monitor disk space
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Review statistics
- [ ] Export performance reports
- [ ] Check for failed notifications
- [ ] Review user feedback

### Monthly Tasks
- [ ] Database backup verification
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Performance optimization
- [ ] User account audit

### Quarterly Tasks
- [ ] System security audit
- [ ] Disaster recovery test
- [ ] Performance review
- [ ] Feature evaluation

## Troubleshooting Reference

### Common Issues

**Service won't start**
- [ ] Check helpdesk.log
- [ ] Verify PostgreSQL running
- [ ] Check .env configuration
- [ ] Verify port availability

**Database connection fails**
- [ ] Verify PostgreSQL service
- [ ] Check DATABASE_URL
- [ ] Test with pgAdmin
- [ ] Check firewall

**Emails not sending**
- [ ] Verify SMTP settings
- [ ] Test SMTP credentials
- [ ] Check spam folder
- [ ] Review email logs

**Performance issues**
- [ ] Check database performance
- [ ] Review log file size
- [ ] Monitor CPU/RAM usage
- [ ] Check disk space

## Sign-Off

### Installation Team
- [ ] System Administrator: _________________ Date: _______
- [ ] Database Administrator: _________________ Date: _______
- [ ] Network Administrator: _________________ Date: _______

### Testing Team
- [ ] QA Lead: _________________ Date: _______
- [ ] Helpdesk Officer: _________________ Date: _______
- [ ] Technician: _________________ Date: _______

### Management Approval
- [ ] ICT Manager: _________________ Date: _______
- [ ] ICT GM: _________________ Date: _______

### Final Notes

Installation completed: _______________ (Date)
Installed by: _______________
Production URL: _______________
Database server: _______________
Backup location: _______________

---

**Congratulations!** Your Ndabase IT Helpdesk System is now live! 🎉
