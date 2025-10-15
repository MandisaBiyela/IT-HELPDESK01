from twilio.rest import Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service for sending WhatsApp messages via Twilio"""
    
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    def send_message(self, to_number: str, message: str):
        """Send a WhatsApp message"""
        try:
            message = self.client.messages.create(
                from_=settings.TWILIO_WHATSAPP_FROM,
                body=message,
                to=to_number
            )
            logger.info(f"WhatsApp message sent to {to_number}: {message.sid}")
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {str(e)}")
    
    def send_ticket_created(self, ticket_data: dict):
        """Send WhatsApp notification when ticket is created"""
        message = f"""
🎫 *New Ticket Assigned*

Ticket: {ticket_data['ticket_number']}
Priority: {ticket_data['priority']}
User: {ticket_data['user_name']}
Problem: {ticket_data['problem_summary']}

Check your email for full details.
        """.strip()
        
        # Send to assignee (if they have WhatsApp)
        if ticket_data.get('assignee_whatsapp'):
            self.send_message(ticket_data['assignee_whatsapp'], message)
    
    def send_ticket_updated(self, ticket_data: dict, update_text: str):
        """Send WhatsApp notification when ticket is updated"""
        message = f"""
📝 *Ticket Update*

Ticket: {ticket_data['ticket_number']}
Status: {ticket_data['status']}

Check your email for details.
        """.strip()
        
        # Send to user (if they have WhatsApp)
        if ticket_data.get('user_whatsapp'):
            self.send_message(ticket_data['user_whatsapp'], message)
    
    def send_ticket_resolved(self, ticket_data: dict):
        """Send WhatsApp notification when ticket is resolved"""
        message = f"""
✅ *Ticket Resolved*

Ticket: {ticket_data['ticket_number']}
Problem: {ticket_data['problem_summary']}

Your issue has been resolved. Check your email for details.
        """.strip()
        
        # Send to user (if they have WhatsApp)
        if ticket_data.get('user_whatsapp'):
            self.send_message(ticket_data['user_whatsapp'], message)
    
    def send_sla_escalation(self, ticket_data: dict, escalation_reason: str):
        """Send WhatsApp notification for SLA escalation"""
        message = f"""
🚨 *SLA ESCALATION ALERT*

Ticket: {ticket_data['ticket_number']}
Priority: {ticket_data['priority']}
Problem: {ticket_data['problem_summary']}

URGENT: This ticket requires immediate attention!
Check your email for full details.
        """.strip()
        
        # Send to assignee, GM, and Manager
        recipients = [
            ticket_data.get('assignee_whatsapp'),
            settings.ICT_GM_WHATSAPP,
            settings.ICT_MANAGER_WHATSAPP
        ]
        
        for recipient in recipients:
            if recipient:
                self.send_message(recipient, message)


# Singleton instance
whatsapp_service = WhatsAppService()
