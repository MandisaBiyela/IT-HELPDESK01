from sqlalchemy import Column, Integer, String, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import get_sa_time
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    HELPDESK_OFFICER = "helpdesk_officer"
    ICT_MANAGER = "ict_manager"
    ICT_GM = "ict_gm"


class TechnicianType(str, enum.Enum):
    IT_SUPPORT = "IT Support Technician"
    NETWORK = "Network Technician"
    SYSTEMS = "Systems Technician"
    FIELD = "Field Technician"
    HELPDESK = "Helpdesk Technician"
    ELECTRONICS = "Electronics Technician"
    GENERAL = "General Technician"  # Default for non-specialized


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String(16), default="technician")  # Store as string, validate with UserRole enum
    technician_type = Column(String(11), nullable=True)  # Only for technicians
    is_active = Column(Integer, default=1)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    assigned_tickets = relationship("Ticket", back_populates="assignee", foreign_keys="Ticket.assignee_id")
    ticket_updates = relationship("TicketUpdate", back_populates="updated_by")
