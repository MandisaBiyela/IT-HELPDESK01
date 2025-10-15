@echo off
REM Backup database script

echo Ndabase IT Helpdesk - Database Backup
echo =====================================
echo.

REM Set backup directory
set BACKUP_DIR=backups
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Generate timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set TIMESTAMP=%mydate%_%mytime%

REM Set backup filename
set BACKUP_FILE=%BACKUP_DIR%\helpdesk_backup_%TIMESTAMP%.sql

echo Creating backup: %BACKUP_FILE%
echo.

REM Database credentials - UPDATE THESE!
set DB_USER=helpdesk_user
set DB_NAME=helpdesk_db
set PGPASSWORD=your_secure_password

REM Create backup
pg_dump -U %DB_USER% -h localhost %DB_NAME% > %BACKUP_FILE%

if errorlevel 1 (
    echo ERROR: Backup failed!
    echo Make sure PostgreSQL is installed and credentials are correct.
) else (
    echo Backup completed successfully!
    echo File: %BACKUP_FILE%
)

echo.
pause
