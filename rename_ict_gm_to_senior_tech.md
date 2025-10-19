# Renaming ICT GM to Senior Technician - Implementation Plan

## Overview
Rename all occurrences of "ICT GM" / "ICT General Manager" / "ict_gm" to "Senior Technician" / "senior_technician" throughout the entire codebase.

## Impact Analysis
This change affects:
- ✅ Database enum values
- ✅ Backend Python code (20+ files)
- ✅ Frontend JavaScript (5+ files)
- ✅ HTML pages (4+ files)
- ✅ CSS files
- ✅ Configuration files
- ✅ Documentation (40+ markdown files)

## ⚠️ CRITICAL: Database Migration Required

### Current Database State
```python
class UserRole(str, enum.Enum):
    ICT_GM = "ict_gm"  # Currently stored in database
```

### New Database State
```python
class UserRole(str, enum.Enum):
    SENIOR_TECHNICIAN = "senior_technician"
```

**This requires a database migration to update all existing users with `role='ict_gm'` to `role='senior_technician'`**

## Renaming Strategy

### Text Replacement Mapping
| Old Text | New Text | Context |
|----------|----------|---------|
| `ict_gm` | `senior_technician` | Database values, Python vars |
| `ICT_GM` | `SENIOR_TECHNICIAN` | Enum constants |
| `ICT GM` | `Senior Technician` | Display text |
| `ICT General Manager` | `Senior Technician` | Full titles |
| `ict-gm` | `senior-technician` | URLs, file names |
| `General Manager` | `Senior Technician` | Descriptive text |
| `GM` | `Senior Tech` | Abbreviations |
| `Executive` | `Senior Level` | Descriptions |

### Files Requiring Changes

#### 1. **Database & Models** (HIGHEST PRIORITY)
- ❌ `app/models/user.py` - Update UserRole enum
- ❌ `migrate_gm_to_senior.py` - NEW migration script needed

#### 2. **Backend Python Files**
- ❌ `app/api/auth.py` - Login redirects
- ❌ `app/api/escalations.py` - Access control (5 occurrences)
- ❌ `app/services/sla_monitor.py` - Email notifications
- ❌ `app/services/email_service.py` - Email recipients
- ❌ `app/services/whatsapp_service.py` - WhatsApp notifications
- ❌ `app/config.py` - Configuration variables
- ❌ `.env` - Environment variables
- ❌ `init_db.py` - Initial data
- ❌ `fix_users.py` - User creation
- ❌ `add_user.py` - User management
- ❌ `add_real_users.py` - Demo users
- ❌ `setup_production.py` - Production setup

#### 3. **Frontend HTML Files**
- ❌ `static/index.html` - Registration form
- ❌ `static/ict-gm.html` → RENAME to `static/senior-technician.html`
- ❌ `static/ict-gm-reports.html` → RENAME to `static/senior-technician-reports.html`
- ❌ `static/helpdesk-officer.html` - User creation dropdown

#### 4. **Frontend JavaScript Files**
- ❌ `static/js/ict-gm.js` → RENAME to `static/js/senior-technician.js`
- ❌ `static/js/ict-gm-reports.js` → RENAME to `static/js/senior-technician-reports.js`
- ❌ `static/js/app.js` - Login redirect
- ❌ `static/js/helpdesk-officer.js` - Role colors

#### 5. **CSS Files**
- ❌ `static/css/style.css` - Comments
- ❌ `add_paused_css.py` - Comments

#### 6. **Documentation** (Lower Priority - Can be done later)
- 40+ Markdown files with "ICT GM" references

## Implementation Steps

### STEP 1: Stop the Server
```cmd
taskkill /F /PID 2684
```

### STEP 2: Create Database Migration Script
Create `migrate_gm_to_senior.py`:
```python
import sqlite3
from datetime import datetime

conn = sqlite3.connect('helpdesk.db')
cursor = conn.cursor()

# Update all users with ict_gm role
cursor.execute("UPDATE users SET role = 'senior_technician' WHERE role = 'ict_gm'")
affected = cursor.rowcount

conn.commit()
conn.close()

print(f"✅ Updated {affected} user(s) from 'ict_gm' to 'senior_technician'")
```

### STEP 3: Update Backend Files (In Order)
1. `app/models/user.py` - Change enum
2. `app/config.py` - Rename variables
3. `.env` - Rename variables
4. All API files
5. All service files

### STEP 4: Rename & Update Frontend Files
1. Rename HTML files
2. Rename JS files
3. Update all references

### STEP 5: Run Migration
```cmd
python migrate_gm_to_senior.py
```

### STEP 6: Test All Functionality
1. Login as Senior Technician
2. Verify dashboard loads
3. Verify reports work
4. Verify access control
5. Verify emails/notifications

### STEP 7: Restart Server
```cmd
python run_server.py
```

## Risk Assessment

### HIGH RISK
- ❌ Database migration could fail
- ❌ Users might not be able to login
- ❌ File renames might break imports
- ❌ URL changes might break bookmarks

### MITIGATION
- ✅ Backup database before migration
- ✅ Test in development first
- ✅ Keep old filenames as symlinks initially
- ✅ Add redirects for old URLs

## Recommended Approach

Given the complexity and risk, I recommend **OPTION B**:

### OPTION A: Full Rename (High Risk)
- Update everything at once
- Requires database migration
- Breaking change for existing users
- **Timeline: 2-3 hours**

### OPTION B: Display-Only Rename (Low Risk) ⭐ RECOMMENDED
- Keep `ict_gm` in database/code
- Only change display text in HTML/JS
- No database migration needed
- No breaking changes
- **Timeline: 30 minutes**

## Question for User

**Do you want to:**
1. **Full rename** (changes database, all code, file names) - High risk but complete
2. **Display-only** (only changes what users see) - Low risk, quick implementation

Please confirm which approach you prefer before I proceed.
