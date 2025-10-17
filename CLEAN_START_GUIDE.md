# 🚀 CLEAN START GUIDE
## Ndabase IT Helpdesk System - Fresh Installation

---

## ✅ WHAT'S BEEN UPDATED

### 1. **NEW LOGIN PAGE** 
- ✨ Uses official **Ndabase Printing Solutions** logo
- 🎨 Professional clean design
- 🔗 "Create account" link added

### 2. **NEW SIGN UP PAGE**
- 📝 Self-registration for all user roles:
  - ICT GM (Executive)
  - ICT Manager
  - Helpdesk Officer
  - Technician
- ✅ Password confirmation
- 🔒 Secure password hashing

### 3. **DATABASE CLEANING SCRIPT**
- 🗑️ Removes ALL test data
- 🔄 Resets ticket numbers to start from NDB-0001
- 🆕 Fresh start for production

---

## 📋 STEP-BY-STEP: START FRESH

### **Step 1: Stop the Current Server**
If the server is running:
1. Press **`Ctrl + C`** in the terminal where the server is running
2. Wait for it to shut down completely

### **Step 2: Clean the Database**
Open a **NEW** PowerShell/CMD terminal and run:

```cmd
cd C:\Users\Student\Desktop\IT-HELPDESK01\IT-HELPDESK01
venv\Scripts\activate
python clean_database.py
```

When prompted:
- Type **`YES`** (all caps) and press Enter
- This will delete ALL test users and tickets

### **Step 3: Restart the Server**
```cmd
python run_server.py
```

Or use the start.bat file:
```cmd
start.bat
```

### **Step 4: Open the Application**
Go to: **http://localhost:8000/static/index.html**

You'll see the beautiful new login page with:
- ✅ Official Ndabase logo
- ✅ Clean white design
- ✅ "Create account" link

---

## 👥 CREATE YOUR ACCOUNTS

### **Option 1: Using Sign Up Page (Recommended)**

1. **Click "Create account"** on the login page
2. **Fill in the form:**
   - Full Name
   - Email
   - Phone Number
   - Role (select from dropdown)
   - Password (min 6 characters)
   - Confirm Password
3. **Click "Create Account"**
4. **Login** with your new credentials

### **Option 2: Manual Account Creation Order**

If you prefer a hierarchy:

**First - Create ICT GM:**
- Go to sign up page
- Select Role: "ICT GM (Executive)"
- Fill in details
- Create account

**Then - ICT GM can create others:**
- Login as ICT GM
- Use User Management to create:
  - ICT Managers
  - Helpdesk Officers

**Next - Helpdesk Officers create:**
- Login as Helpdesk Officer
- Create Technician accounts

---

## 🎯 AVAILABLE ROLES & DASHBOARDS

### 1. **ICT GM (Executive)** 
- **Dashboard:** Executive Overview
- **Can do:**
  - View all escalated tickets
  - Acknowledge escalations
  - View system-wide KPIs
  - Create users (Helpdesk Officers, ICT Managers)

### 2. **ICT Manager**
- **Dashboard:** Reports & Analytics
- **Can do:**
  - View comprehensive reports
  - Export data to CSV
  - Filter by date range, status, priority
  - View charts and statistics

### 3. **Helpdesk Officer**
- **Dashboard:** Ticket Management
- **Can do:**
  - Create new tickets
  - Assign tickets to technicians
  - View all tickets
  - Create technician accounts
  - Track ticket progress

### 4. **Technician**
- **Dashboard:** Kanban Board
- **Can do:**
  - View assigned tickets (Open, In Progress, Resolved)
  - Update ticket status
  - Add comments and updates
  - Upload attachments
  - Reassign tickets
  - Close resolved tickets

---

## 📊 STARTING FRESH - WHAT TO EXPECT

### **After Database Cleaning:**
- ❌ **No users** in system
- ❌ **No tickets** in system
- ❌ **No statistics** to display
- ✅ **Ticket numbering** starts from **NDB-0001**
- ✅ **Clean dashboards** ready for real data

### **As You Create Tickets:**
- ✅ Statistics will build up naturally
- ✅ Charts will populate with real data
- ✅ KPIs will reflect actual performance
- ✅ Your own data, your own metrics!

---

## 🔧 QUICK COMMANDS REFERENCE

### Start Server:
```cmd
cd C:\Users\Student\Desktop\IT-HELPDESK01\IT-HELPDESK01
venv\Scripts\activate
python run_server.py
```

### Clean Database:
```cmd
cd C:\Users\Student\Desktop\IT-HELPDESK01\IT-HELPDESK01
venv\Scripts\activate
python clean_database.py
```
Type `YES` when prompted

### Backup Database (before cleaning):
```cmd
backup_db.bat
```

---

## ✨ NEW FEATURES

### **Self-Service Registration**
- Users can create their own accounts
- Choose their role during signup
- Secure password validation
- Email-based login

### **Professional Branding**
- Official Ndabase Printing Solutions logo
- Clean, modern interface
- Company colors and styling
- Mobile-responsive design

### **Clean Slate**
- No test data
- Fresh statistics
- Real production environment
- Your data, your way

---

## 🆘 TROUBLESHOOTING

### **Can't access the page?**
- Make sure server is running
- Check: http://localhost:8000/static/index.html
- Try: http://127.0.0.1:8000/static/index.html

### **Signup not working?**
- Check server is running
- Clear browser cache (Ctrl+Shift+Delete)
- Try different browser

### **Need to reset everything?**
1. Stop server (Ctrl+C)
2. Run `python clean_database.py`
3. Type `YES`
4. Restart server

---

## 📞 SUPPORT

For issues or questions:
- Check server logs in terminal
- Ensure all dependencies installed
- Database must be accessible
- Network connection active

---

## 🎉 YOU'RE READY!

Your system is now configured for:
- ✅ Professional branding
- ✅ Self-service account creation
- ✅ Clean production data
- ✅ All roles and dashboards
- ✅ Real-world usage

**Go ahead and create your first account!** 🚀

