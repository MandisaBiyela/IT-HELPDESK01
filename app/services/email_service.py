import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from typing import List
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        cc_emails: List[str] = None
    ):
        """Send an email with HTML content"""
        try:
            # Always CC management
            if cc_emails is None:
                cc_emails = []
            cc_emails.extend([settings.ICT_GM_EMAIL, settings.ICT_MANAGER_EMAIL])
            cc_emails = list(set(cc_emails))  # Remove duplicates
            
            message = MIMEMultipart("alternative")
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = to_email
            message["Cc"] = ", ".join(cc_emails)
            message["Subject"] = subject
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )
            
            logger.info(f"Email sent to {to_email} with CC to {cc_emails}")
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            raise
    
    @staticmethod
    def get_ticket_url(ticket_number: str) -> str:
        """Generate URL for ticket"""
        return f"{settings.APP_BASE_URL}/ticket/{ticket_number}"
    
    @staticmethod
    async def send_ticket_created(ticket_data: dict):
        """Send notification when ticket is created"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
                .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Support Ticket Created</h2>
                </div>
                <div class="content">
                    <p>Dear {{ assignee_name }},</p>
                    <p>A new support ticket has been assigned to you.</p>
                    
                    <div class="ticket-info">
                        <p><strong>Ticket Number:</strong> {{ ticket_number }}</p>
                        <p><strong>Priority:</strong> {{ priority }}</p>
                        <p><strong>User:</strong> {{ user_name }}</p>
                        <p><strong>Contact:</strong> {{ user_email }} | {{ user_phone }}</p>
                        <p><strong>Problem:</strong> {{ problem_summary }}</p>
                        {% if problem_description %}
                        <p><strong>Description:</strong> {{ problem_description }}</p>
                        {% endif %}
                        <p><strong>SLA Deadline:</strong> {{ sla_deadline }}</p>
                    </div>
                    
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="{{ ticket_url }}" class="button">View Ticket</a>
                    </p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Ndabase IT Helpdesk System</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(**ticket_data)
        subject = f"New Ticket Assigned: {ticket_data['ticket_number']} - {ticket_data['priority']}"
        
        # Send to assignee
        await EmailService.send_email(
            to_email=ticket_data['assignee_email'],
            subject=subject,
            html_content=html_content
        )
        
        # Also notify the user
        user_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
                .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Your Support Ticket Has Been Created</h2>
                </div>
                <div class="content">
                    <p>Dear {{ user_name }},</p>
                    <p>Thank you for contacting IT Support. Your ticket has been created and assigned to our team.</p>
                    
                    <div class="ticket-info">
                        <p><strong>Ticket Number:</strong> {{ ticket_number }}</p>
                        <p><strong>Problem:</strong> {{ problem_summary }}</p>
                        <p><strong>Assigned To:</strong> {{ assignee_name }}</p>
                        <p><strong>Priority:</strong> {{ priority }}</p>
                    </div>
                    
                    <p>We will keep you updated on the progress of your ticket.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Ndabase IT Helpdesk System</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        user_html = user_template.render(**ticket_data)
        await EmailService.send_email(
            to_email=ticket_data['user_email'],
            subject=f"Ticket Created: {ticket_data['ticket_number']}",
            html_content=user_html
        )
    
    @staticmethod
    async def send_ticket_updated(ticket_data: dict, update_text: str):
        """Send notification when ticket is updated"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }
                .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 10px 20px; background-color: #ffc107; color: #333; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Ticket Update</h2>
                </div>
                <div class="content">
                    <p>Dear {{ user_name }},</p>
                    <p>Your support ticket has been updated.</p>
                    
                    <div class="ticket-info">
                        <p><strong>Ticket Number:</strong> {{ ticket_number }}</p>
                        <p><strong>Status:</strong> {{ status }}</p>
                        <p><strong>Update:</strong> {{ update_text }}</p>
                        {% if updated_by %}
                        <p><strong>Updated By:</strong> {{ updated_by }}</p>
                        {% endif %}
                    </div>
                    
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="{{ ticket_url }}" class="button">View Ticket</a>
                    </p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Ndabase IT Helpdesk System</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        ticket_data['update_text'] = update_text
        html_content = template.render(**ticket_data)
        
        await EmailService.send_email(
            to_email=ticket_data['user_email'],
            subject=f"Ticket Update: {ticket_data['ticket_number']}",
            html_content=html_content
        )
    
    @staticmethod
    async def send_ticket_resolved(ticket_data: dict):
        """Send notification when ticket is resolved"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
                .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Ticket Resolved</h2>
                </div>
                <div class="content">
                    <p>Dear {{ user_name }},</p>
                    <p>Your support ticket has been resolved.</p>
                    
                    <div class="ticket-info">
                        <p><strong>Ticket Number:</strong> {{ ticket_number }}</p>
                        <p><strong>Problem:</strong> {{ problem_summary }}</p>
                        <p><strong>Resolved By:</strong> {{ assignee_name }}</p>
                    </div>
                    
                    <p>If you have any further issues, please don't hesitate to create a new ticket.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Ndabase IT Helpdesk System</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(**ticket_data)
        
        await EmailService.send_email(
            to_email=ticket_data['user_email'],
            subject=f"Ticket Resolved: {ticket_data['ticket_number']}",
            html_content=html_content
        )
    
    @staticmethod
    async def send_sla_escalation(ticket_data: dict, escalation_reason: str):
        """Send notification for SLA escalation"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc3545; }
                .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
                .alert { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>⚠️ SLA ESCALATION ALERT</h2>
                </div>
                <div class="content">
                    <div class="alert">
                        <strong>URGENT:</strong> This ticket has breached its SLA deadline and requires immediate attention.
                    </div>
                    
                    <div class="ticket-info">
                        <p><strong>Ticket Number:</strong> {{ ticket_number }}</p>
                        <p><strong>Priority:</strong> {{ priority }}</p>
                        <p><strong>Assigned To:</strong> {{ assignee_name }}</p>
                        <p><strong>User:</strong> {{ user_name }}</p>
                        <p><strong>Problem:</strong> {{ problem_summary }}</p>
                        <p><strong>Escalation Reason:</strong> {{ escalation_reason }}</p>
                        <p><strong>Original SLA Deadline:</strong> {{ sla_deadline }}</p>
                    </div>
                    
                    <p><strong>Required Action:</strong> An update must be provided immediately explaining the delay.</p>
                    
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="{{ ticket_url }}" class="button">View Ticket Now</a>
                    </p>
                </div>
                <div class="footer">
                    <p>This is an automated escalation from Ndabase IT Helpdesk System</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        ticket_data['escalation_reason'] = escalation_reason
        html_content = template.render(**ticket_data)
        
        # Send to assignee, GM, and Manager
        recipients = [
            ticket_data['assignee_email'],
            settings.ICT_GM_EMAIL,
            settings.ICT_MANAGER_EMAIL
        ]
        
        for recipient in recipients:
            await EmailService.send_email(
                to_email=recipient,
                subject=f"🚨 SLA ESCALATION: {ticket_data['ticket_number']}",
                html_content=html_content
            )
