from datetime import datetime, timedelta
from app.models.ticket import TicketPriority
from app.config import settings


def generate_ticket_number(last_id: int) -> str:
    """Generate a unique ticket number"""
    return f"NDB-{last_id + 1:04d}"


def calculate_sla_deadline(priority: TicketPriority, created_at: datetime = None) -> datetime:
    """Calculate SLA deadline based on priority"""
    if created_at is None:
        created_at = datetime.utcnow()
    
    if priority == TicketPriority.URGENT:
        minutes = settings.SLA_URGENT_MINUTES
    elif priority == TicketPriority.HIGH:
        minutes = settings.SLA_HIGH_MINUTES
    else:  # NORMAL
        minutes = settings.SLA_NORMAL_MINUTES
    
    return created_at + timedelta(minutes=minutes)


def is_sla_breached(sla_deadline: datetime) -> bool:
    """Check if SLA has been breached"""
    return datetime.utcnow() > sla_deadline


def is_sla_warning(sla_deadline: datetime) -> bool:
    """Check if we're in SLA warning period (2 minutes before breach)"""
    warning_time = sla_deadline - timedelta(minutes=settings.SLA_WARNING_MINUTES)
    now = datetime.utcnow()
    return warning_time <= now < sla_deadline


def get_next_priority(current_priority: TicketPriority) -> TicketPriority:
    """Get the next higher priority level"""
    if current_priority == TicketPriority.NORMAL:
        return TicketPriority.HIGH
    elif current_priority == TicketPriority.HIGH:
        return TicketPriority.URGENT
    else:
        return TicketPriority.URGENT  # Already at highest
