from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.ticket import Ticket, TicketStatus, TicketPriority, SLAStatus, SLAEscalation
from app.models.audit_log import AuditLog
from app.models.user import UserRole
from app.utils.ticket_helpers import is_sla_breached, is_sla_warning, get_next_priority, calculate_sla_deadline
from app.services.email_service import EmailService
from app.services.whatsapp_service import whatsapp_service
import logging
import json

logger = logging.getLogger(__name__)


class SLAMonitor:
    """Background service to monitor SLA deadlines and trigger escalations"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    def start(self):
        """Start the SLA monitoring scheduler"""
        # Run every minute
        self.scheduler.add_job(
            self.check_sla_breaches,
            'interval',
            minutes=1,
            id='sla_monitor',
            replace_existing=True
        )
        self.scheduler.start()
        logger.info("SLA Monitor started - checking every minute")
    
    def stop(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("SLA Monitor stopped")
    
    async def check_sla_breaches(self):
        """Check for SLA breaches and trigger escalations"""
        db = SessionLocal()
        try:
            # Get all open or in-progress tickets
            tickets = db.query(Ticket).filter(
                Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
            ).all()
            
            now = datetime.utcnow()
            
            for ticket in tickets:
                # Calculate time remaining
                time_remaining = (ticket.sla_deadline - now).total_seconds() / 60  # in minutes
                
                # Update SLA status
                if time_remaining <= 0:
                    # BREACHED
                    if ticket.sla_status != SLAStatus.BREACHED:
                        ticket.sla_status = SLAStatus.BREACHED
                        await self.handle_sla_breach(db, ticket)
                elif time_remaining <= 2:
                    # AT RISK (within 2 minutes of deadline)
                    if ticket.sla_status != SLAStatus.AT_RISK:
                        ticket.sla_status = SLAStatus.AT_RISK
                        await self.handle_sla_warning(db, ticket)
                else:
                    # ON TRACK
                    ticket.sla_status = SLAStatus.ON_TRACK
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error in SLA monitoring: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    async def handle_sla_breach(self, db: Session, ticket: Ticket):
        """Handle SLA breach - escalate ticket with forced update requirement"""
        # Don't re-escalate if already escalated
        if ticket.escalated:
            return
        
        logger.warning(f"🚨 SLA BREACH for ticket {ticket.ticket_number}")
        
        # Store old priority for audit
        old_priority = ticket.priority.value
        
        # Escalate priority to URGENT
        new_priority = TicketPriority.URGENT
        ticket.priority = new_priority
        
        # Recompute SLA deadline (add 20 minutes for urgent tickets)
        ticket.sla_deadline = datetime.utcnow() + timedelta(minutes=20)
        
        # Set forced update flag (technician MUST update before doing anything else)
        ticket.requires_update = 1
        
        # Mark as escalated
        ticket.escalated = 1
        
        # Update timestamp
        ticket.updated_at = datetime.utcnow()
        
        # Create escalation record
        escalation = SLAEscalation(
            ticket_id=ticket.id,
            escalation_reason=f"SLA deadline exceeded. Auto-escalated from {old_priority} to {new_priority.value}. Mandatory update required.",
            previous_priority=old_priority,
            new_priority=new_priority.value
        )
        db.add(escalation)
        
        # Create audit log entry
        audit_log = AuditLog(
            entity_type='ticket',
            entity_id=ticket.id,
            action='sla_escalated',
            performed_by_id=None,  # System action
            details=json.dumps({
                'ticket_number': ticket.ticket_number,
                'old_priority': old_priority,
                'new_priority': new_priority.value,
                'old_sla_deadline': ticket.sla_deadline.isoformat(),
                'new_sla_deadline': (datetime.utcnow() + timedelta(minutes=20)).isoformat(),
                'reason': 'SLA deadline exceeded',
                'requires_update': True,
                'escalated_to': ['assignee', 'ict_manager', 'ict_gm']
            })
        )
        db.add(audit_log)
        
        # Get manager and GM for notifications
        from app.models.user import User
        manager = db.query(User).filter(User.role == UserRole.ICT_MANAGER, User.is_active == 1).first()
        gm = db.query(User).filter(User.role == UserRole.ICT_GM, User.is_active == 1).first()
        
        # Prepare notification data
        ticket_data = {
            'ticket_number': ticket.ticket_number,
            'user_name': ticket.user_name,
            'user_email': ticket.user_email,
            'problem_summary': ticket.problem_summary,
            'priority': new_priority.value,
            'old_priority': old_priority,
            'assignee_name': ticket.assignee.name if ticket.assignee else 'Unassigned',
            'assignee_email': ticket.assignee.email if ticket.assignee else '',
            'assignee_whatsapp': ticket.assignee.phone if ticket.assignee else '',
            'sla_deadline': ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S'),
            'ticket_url': EmailService.get_ticket_url(ticket.ticket_number),
            'escalation_reason': escalation.escalation_reason
        }
        
        # Send notifications to assignee, manager, and GM
        try:
            # Email to assignee
            if ticket.assignee:
                await EmailService.send_sla_escalation(ticket_data, escalation.escalation_reason)
                # WhatsApp to assignee
                whatsapp_service.send_sla_escalation(ticket_data, escalation.escalation_reason)
            
            # Email to Manager
            if manager:
                manager_data = {**ticket_data, 'recipient_email': manager.email, 'recipient_name': manager.name}
                await EmailService.send_email(
                    to_email=manager.email,
                    subject=f"🚨 SLA BREACH ALERT - {ticket.ticket_number}",
                    body=f"""
                    <h2>SLA Breach Alert</h2>
                    <p><strong>Manager Notification</strong></p>
                    <p>Ticket <strong>{ticket.ticket_number}</strong> has breached its SLA deadline.</p>
                    <p><strong>Priority escalated:</strong> {old_priority} → {new_priority.value}</p>
                    <p><strong>Assignee:</strong> {ticket.assignee.name if ticket.assignee else 'Unassigned'}</p>
                    <p><strong>Problem:</strong> {ticket.problem_summary}</p>
                    <p><strong>New SLA Deadline:</strong> {ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p>Technician must provide an update before taking any other action.</p>
                    <p><a href="{ticket_data['ticket_url']}">View Ticket</a></p>
                    """
                )
            
            # Email to GM
            if gm:
                await EmailService.send_email(
                    to_email=gm.email,
                    subject=f"🚨 EXECUTIVE ALERT: SLA BREACH - {ticket.ticket_number}",
                    body=f"""
                    <h2>Executive SLA Breach Alert</h2>
                    <p><strong>GM Notification</strong></p>
                    <p>Ticket <strong>{ticket.ticket_number}</strong> has breached its SLA deadline and requires your attention.</p>
                    <p><strong>Priority:</strong> {old_priority} → <span style="color: red; font-weight: bold;">{new_priority.value}</span></p>
                    <p><strong>Assignee:</strong> {ticket.assignee.name if ticket.assignee else 'Unassigned'}</p>
                    <p><strong>User:</strong> {ticket.user_name} ({ticket.user_email})</p>
                    <p><strong>Problem:</strong> {ticket.problem_summary}</p>
                    <p><strong>New SLA Deadline:</strong> {ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p>Immediate action required. Technician has been notified.</p>
                    <p><a href="{ticket_data['ticket_url']}">View Ticket Details</a></p>
                    """
                )
            
            logger.info(f"✅ Escalation notifications sent for {ticket.ticket_number}")
            
        except Exception as e:
            logger.error(f"❌ Failed to send escalation notifications: {str(e)}")
    
    async def handle_sla_warning(self, db: Session, ticket: Ticket):
        """Handle SLA warning - send pre-expiry alert (2 minutes before deadline)"""
        # Only send warning once per status change
        if ticket.escalated:
            return
        
        logger.warning(f"⏰ SLA WARNING for ticket {ticket.ticket_number} - 2 minutes remaining")
        
        # Send warning notification to assignee
        if ticket.assignee:
            try:
                await EmailService.send_email(
                    to_email=ticket.assignee.email,
                    subject=f"⏰ SLA WARNING - {ticket.ticket_number} - 2 Minutes Remaining",
                    body=f"""
                    <h2>SLA Warning - Immediate Action Required</h2>
                    <p><strong>Ticket:</strong> {ticket.ticket_number}</p>
                    <p><strong>Priority:</strong> {ticket.priority.value}</p>
                    <p><strong>Problem:</strong> {ticket.problem_summary}</p>
                    <p><strong>Time Remaining:</strong> Less than 2 minutes!</p>
                    <p>This ticket will be escalated if not resolved within 2 minutes.</p>
                    <p><a href="{EmailService.get_ticket_url(ticket.ticket_number)}">Update Ticket Now</a></p>
                    """
                )
                
                # WhatsApp alert
                whatsapp_service.send_message(
                    to_number=ticket.assignee.phone,
                    message=f"⏰ SLA ALERT: Ticket {ticket.ticket_number} has less than 2 minutes remaining! Update immediately to avoid escalation."
                )
                
                logger.info(f"✅ SLA warning sent for {ticket.ticket_number}")
                
            except Exception as e:
                logger.error(f"❌ Failed to send SLA warning: {str(e)}")


# Singleton instance
sla_monitor = SLAMonitor()
