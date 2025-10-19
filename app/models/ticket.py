from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import get_sa_time
import enum


class TicketPriority(str, enum.Enum):
    NORMAL = "Normal"
    HIGH = "High"
    URGENT = "Urgent"


class TicketStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    WAITING_ON_USER = "Waiting on User"  # Keep database value, will display as "Waiting on Parts" in UI
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class SLAStatus(str, enum.Enum):
    ON_TRACK = "On Track"
    AT_RISK = "At Risk"  # Within 2 minutes of deadline
    BREACHED = "Breached"  # Past deadline


class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True, nullable=False)
    
    # User Information
    user_name = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
    user_phone = Column(String, nullable=False)
    
    # Ticket Details
    problem_summary = Column(String, nullable=False)
    problem_description = Column(Text, nullable=True)
    priority = Column(SQLEnum(TicketPriority), default=TicketPriority.NORMAL)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.OPEN)
    
    # Assignment
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=get_sa_time, nullable=False)
    updated_at = Column(DateTime, default=get_sa_time, onupdate=get_sa_time, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    sla_deadline = Column(DateTime, nullable=False)
    
    # SLA & Flags
    sla_status = Column(SQLEnum(SLAStatus), default=SLAStatus.ON_TRACK)
    sla_paused_minutes = Column(Integer, default=0)  # Stores remaining time when status = "Waiting on User"
    requires_update = Column(Integer, default=0)  # 1 if compulsory update needed
    escalated = Column(Integer, default=0)  # 1 if escalated
    
    # Relationships
    assignee = relationship("User", back_populates="assigned_tickets", foreign_keys=[assignee_id])
    updates = relationship("TicketUpdate", back_populates="ticket", cascade="all, delete-orphan")
    escalations = relationship("SLAEscalation", back_populates="ticket", cascade="all, delete-orphan")


class TicketUpdate(Base):
    __tablename__ = "ticket_updates"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    update_text = Column(Text, nullable=False)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=get_sa_time, nullable=False)
    
    # Change tracking
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    old_assignee_id = Column(Integer, nullable=True)
    new_assignee_id = Column(Integer, nullable=True)
    old_priority = Column(String, nullable=True)
    new_priority = Column(String, nullable=True)
    
    # New fields for enhanced tracking
    reassign_reason = Column(Text, nullable=True)  # Required when reassigning
    time_spent = Column(Integer, nullable=True)  # Minutes spent on ticket
    is_internal = Column(Integer, default=0)  # 1 = internal note (helpdesk only), 0 = visible to all
    
    # Relationships
    ticket = relationship("Ticket", back_populates="updates")
    updated_by = relationship("User", back_populates="ticket_updates")


class SLAEscalation(Base):
    __tablename__ = "sla_escalations"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    escalation_reason = Column(Text, nullable=False)
    escalated_at = Column(DateTime, default=get_sa_time, nullable=False)
    previous_priority = Column(String, nullable=True)
    new_priority = Column(String, nullable=True)
    
    # GM Acknowledgment fields
    gm_acknowledged = Column(Integer, default=0)  # 0 = pending, 1 = acknowledged
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at_gm = Column(DateTime, nullable=True)
    acknowledgment_note = Column(Text, nullable=True)
    
    # Relationships
    ticket = relationship("Ticket", back_populates="escalations")
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
