# Windows Server Deployment Guide

This guide will help you deploy the Ndabase IT Helpdesk System on a Windows Server.

## Prerequisites

- Windows Server (any recent version)
- PostgreSQL 12+ installed
- Python 3.9 or higher installed
- Administrator access
- Ports 80, 443, and 8000 accessible

## Step-by-Step Deployment

### 1. Install PostgreSQL

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the wizard
3. Remember the password you set for the `postgres` user
4. Open pgAdmin or use `psql` command line:
   ```
   psql -U postgres
   ```
5. Create the database:
   ```sql
   CREATE DATABASE helpdesk_db;
   CREATE USER helpdesk_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk_user;
   ```

### 2. Install Python and Dependencies

1. Download Python from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Open Command Prompt as Administrator
4. Navigate to the project directory:
   ```cmd
   cd C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK
   ```
5. Create a virtual environment:
   ```cmd
   python -m venv venv
   ```
6. Activate the virtual environment:
   ```cmd
   venv\Scripts\activate
   ```
7. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```cmd
   copy .env.example .env
   ```
2. Edit `.env` with Notepad or your preferred editor:
   ```cmd
   notepad .env
   ```
3. Update the following critical settings:
   - `DATABASE_URL`: Update with your PostgreSQL credentials
     ```
     DATABASE_URL=postgresql://helpdesk_user:your_secure_password@localhost/helpdesk_db
     ```
   - `SECRET_KEY`: Generate a secure random key (run `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
   - `APP_BASE_URL`: Your server's public URL (e.g., `http://your-server-ip:8000`)
   - SMTP settings for email notifications
   - Twilio credentials for WhatsApp notifications
   - Management email addresses and phone numbers

### 4. Initialize the Database

1. With the virtual environment activated, run:
   ```cmd
   python init_db.py
   ```
2. This will create all tables and seed initial users
3. Note the default credentials shown

### 5. Test the Application

1. Run the development server:
   ```cmd
   python run_server.py
   ```
2. Open a browser and navigate to `http://localhost:8000`
3. You should see the API root response
4. Test the interface at `http://localhost:8000/static/index.html`
5. Try logging in with the default credentials
6. Press Ctrl+C to stop the server

### 6. Set Up as a Windows Service (Production)

#### Option A: Using NSSM (Non-Sucking Service Manager)

1. Download NSSM from https://nssm.cc/download
2. Extract to `C:\nssm`
3. Open Command Prompt as Administrator
4. Install the service:
   ```cmd
   cd C:\nssm\win64
   nssm install HelpdeskAPI "C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK\venv\Scripts\python.exe" "C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK\run_server.py"
   ```
5. Configure the service:
   ```cmd
   nssm set HelpdeskAPI AppDirectory "C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK"
   nssm set HelpdeskAPI DisplayName "Ndabase IT Helpdesk API"
   nssm set HelpdeskAPI Description "Internal helpdesk ticketing system API"
   nssm set HelpdeskAPI Start SERVICE_AUTO_START
   ```
6. Start the service:
   ```cmd
   nssm start HelpdeskAPI
   ```
7. Check status:
   ```cmd
   nssm status HelpdeskAPI
   ```

#### Option B: Using Task Scheduler

1. Create a batch file `start_helpdesk.bat`:
   ```cmd
   @echo off
   cd C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK
   call venv\Scripts\activate
   python run_server.py
   ```
2. Open Task Scheduler
3. Create a new task:
   - General tab: Name it "Ndabase Helpdesk", run with highest privileges
   - Triggers tab: At startup
   - Actions tab: Start a program - `C:\Users\Mandisa Biyela\Desktop\IT-HELPDESK\start_helpdesk.bat`
   - Settings tab: Allow task to run on demand

### 7. Configure Windows Firewall

1. Open Windows Firewall with Advanced Security
2. Create inbound rules for ports 80, 443, and 8000
3. Or run these commands as Administrator:
   ```cmd
   netsh advfirewall firewall add rule name="Helpdesk HTTP" dir=in action=allow protocol=TCP localport=80
   netsh advfirewall firewall add rule name="Helpdesk HTTPS" dir=in action=allow protocol=TCP localport=443
   netsh advfirewall firewall add rule name="Helpdesk API" dir=in action=allow protocol=TCP localport=8000
   ```

### 8. Set Up IIS as Reverse Proxy (Optional, for HTTPS)

If you want to use IIS for SSL/TLS:

1. Install IIS and URL Rewrite module
2. Install Application Request Routing (ARR)
3. Create a new website in IIS
4. Configure reverse proxy to `http://localhost:8000`
5. Add SSL certificate

### 9. Configure SSL/TLS (Recommended)

For production, use SSL/TLS:

1. Obtain an SSL certificate (Let's Encrypt, commercial CA, or self-signed)
2. Configure IIS with the certificate, or
3. Use Uvicorn with SSL:
   - Update `run_server.py`:
     ```python
     uvicorn.run(
         "app.main:app",
         host="0.0.0.0",
         port=443,
         ssl_keyfile="path/to/key.pem",
         ssl_certfile="path/to/cert.pem"
     )
     ```

## Accessing the Application

- **Frontend Interface**: `http://your-server:8000/static/index.html`
- **API Documentation**: `http://your-server:8000/docs`
- **API Root**: `http://your-server:8000`

## Default Credentials

```
Admin:
  Email: admin@ndabase.com
  Password: admin123

Technician:
  Email: tech1@ndabase.com
  Password: tech123

Helpdesk Officer:
  Email: helpdesk1@ndabase.com
  Password: help123
```

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## Monitoring and Maintenance

### View Logs

Logs are written to `helpdesk.log` in the project directory.

### Backup Database

Regular backups are crucial:

```cmd
pg_dump -U helpdesk_user -h localhost helpdesk_db > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

Create a scheduled task to run this daily.

### Update the Application

1. Stop the service
2. Pull new code or copy updated files
3. Activate virtual environment
4. Install any new dependencies: `pip install -r requirements.txt`
5. Run database migrations if needed
6. Restart the service

## Troubleshooting

### Service Won't Start

1. Check `helpdesk.log` for errors
2. Verify database connection in `.env`
3. Ensure PostgreSQL is running
4. Check Windows Event Viewer

### Can't Access from Other Computers

1. Verify firewall rules
2. Check that the app is listening on `0.0.0.0` not `127.0.0.1`
3. Test connectivity: `telnet server-ip 8000`

### Email Notifications Not Working

1. Verify SMTP settings in `.env`
2. Check if your email provider requires "App Passwords"
3. For Gmail: Enable 2FA and generate an App Password
4. Check `helpdesk.log` for email errors

### WhatsApp Notifications Not Working

1. Verify Twilio credentials in `.env`
2. Ensure WhatsApp sandbox is approved (for development)
3. For production, apply for WhatsApp Business API approval
4. Check Twilio dashboard for error logs

## Security Best Practices

1. **Change Default Passwords**: Immediately change all default credentials
2. **Use Strong SECRET_KEY**: Generate a cryptographically secure secret
3. **Enable HTTPS**: Use SSL/TLS for all connections
4. **Restrict Database Access**: Only allow local connections
5. **Regular Backups**: Automate daily database backups
6. **Update Dependencies**: Regularly update Python packages
7. **Monitor Logs**: Regularly check logs for suspicious activity
8. **Limit User Access**: Create users only as needed
9. **Network Security**: Use Windows Firewall to restrict access

## Support

For issues or questions, contact the IT Department.
