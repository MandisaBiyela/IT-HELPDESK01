# 🚀 PRODUCTION DEPLOYMENT GUIDE

## ⚠️ IMPORTANT: Read Before Proceeding

This guide will help you transition from test environment to production by:
- Removing all test data (users, tickets, logs)
- Setting up 2 ICT General Manager accounts
- Preparing system for real company use

---

## 📋 STEP-BY-STEP PRODUCTION SETUP

### **STEP 1: Backup Current Database** ✅

**CRITICAL: Always backup before making changes!**

```cmd
backup_db.bat
```

This creates a timestamped backup in `backups/` folder.

---

### **STEP 2: Run Production Setup** 🎯

**What this does:**
- ✅ Deletes ALL test users
- ✅ Deletes ALL test tickets  
- ✅ Deletes ALL audit logs
- ✅ Resets database to clean state
- ✅ Creates 2 ICT GM accounts (your real users)

**Run the setup:**

```cmd
venv\Scripts\activate
python setup_production.py
```

**You will be prompted for:**

**ICT GM #1:**
- Full Name: (e.g., "Mandisa Biyela")
- Email Address: (e.g., "mandisa.b@company.co.za")
- Phone Number: (e.g., "+27823456789")
- Password: (choose a strong password)

**ICT GM #2:**
- Full Name: (e.g., "Thabo Dlamini")
- Email Address: (e.g., "thabo.d@company.co.za")
- Phone Number: (e.g., "+27821234567")
- Password: (choose a strong password)

---

### **STEP 3: Start the Server** 🖥️

```cmd
start.bat
```

Server will run at: `http://localhost:8000`

---

### **STEP 4: ICT GMs Login** 👥

1. Open browser: `http://localhost:8000`
2. Login with ICT GM credentials you just created
3. Dashboard will be empty (no tickets yet - this is correct!)

---

## 📊 CREATING OTHER ACCOUNTS

### **Who Can Create What:**

```
ICT GM → Can create:
  ├── Helpdesk Officers
  ├── ICT Managers
  └── Other ICT GMs

Helpdesk Officers → Can create:
  ├── Technicians
  └── Regular Users (ticket reporters)

Technicians → Cannot create users
```

---

## 🎯 FIRST ACCOUNTS TO CREATE

**Recommended order:**

1. **ICT GMs** (Already created ✅)
   - 2 accounts created during setup

2. **Helpdesk Officers** (Create 2-3)
   - Login as ICT GM
   - Go to User Management
   - Create Helpdesk Officer accounts
   - These will handle ticket creation and assignment

3. **Technicians** (Create 5-10)
   - Login as Helpdesk Officer
   - Go to User Management  
   - Create Technician accounts
   - These will work on tickets

4. **ICT Manager** (Create 1-2)
   - Login as ICT GM
   - Go to User Management
   - Create ICT Manager accounts
   - These will view reports

---

## 🔐 ACCOUNT CREATION WORKFLOW

### **Creating Helpdesk Officers:**

1. Login as **ICT GM**
2. Navigate to dashboard
3. Click **"User Management"** or **"Add User"**
4. Fill in details:
   - Name: Full name
   - Email: Company email
   - Phone: Contact number
   - Role: **Helpdesk Officer**
   - Password: Temporary password (user should change)
5. Click **"Create User"**

### **Creating Technicians:**

1. Login as **Helpdesk Officer**
2. Navigate to dashboard
3. Click **"User Management"** or **"Add User"**
4. Fill in details:
   - Name: Full name
   - Email: Company email
   - Phone: Contact number
   - Role: **Technician**
   - Password: Temporary password
5. Click **"Create User"**

---

## 📝 PRODUCTION CHECKLIST

**Before going live:**

- [✅] Database backed up
- [✅] Test data cleared
- [✅] 2 ICT GM accounts created
- [ ] Create 2-3 Helpdesk Officers
- [ ] Create 5-10 Technicians
- [ ] Create 1-2 ICT Managers
- [ ] Test ticket creation workflow
- [ ] Test ticket assignment
- [ ] Test escalation process
- [ ] Test reporting features
- [ ] Verify all users can login
- [ ] Brief staff on how to use system

---

## 🆘 TROUBLESHOOTING

### **Problem: "I made a mistake during setup"**

**Solution:**
```cmd
# Restore backup
copy backups\helpdesk_YYYYMMDD_HHMMSS.db helpdesk.db

# Run setup again
python setup_production.py
```

### **Problem: "Forgot ICT GM password"**

**Solution:**
```cmd
# Reset password manually
venv\Scripts\activate
python
>>> from app.database import SessionLocal
>>> from app.models.user import User
>>> from app.utils.auth import get_password_hash
>>> db = SessionLocal()
>>> user = db.query(User).filter(User.email == "gm@email.com").first()
>>> user.hashed_password = get_password_hash("newpassword123")
>>> db.commit()
>>> exit()
```

### **Problem: "Need to add more ICT GMs later"**

**Solution:**
- Login as existing ICT GM
- Use User Management to create additional ICT GM accounts
- No need to re-run setup script

---

## 📞 CONTACT & SUPPORT

**System Information:**
- Database: SQLite (`helpdesk.db`)
- Backup Location: `backups/`
- Server Port: 8000
- Server URL: `http://localhost:8000`

**Important Files:**
- `setup_production.py` - Production setup script
- `backup_db.bat` - Database backup script
- `start.bat` - Start server
- `helpdesk.db` - Main database file

---

## 🎉 YOU'RE READY!

Once you complete these steps:
1. ✅ Test data is cleared
2. ✅ ICT GMs can login
3. ✅ System is ready for real use
4. ✅ Staff can create accounts
5. ✅ Tickets can be created and managed

**Start creating your team accounts and begin using the system!** 🚀

---

**Last Updated:** October 17, 2025  
**Version:** Production 1.0
