from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import get_sa_time


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)  # 'ticket', 'user', 'sla_escalation'
    entity_id = Column(Integer, nullable=False)  # ID of the entity
    action = Column(String, nullable=False)  # 'created', 'updated', 'assigned', 'escalated'
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system actions
    details = Column(Text, nullable=True)  # JSON string with additional details
    created_at = Column(DateTime, default=get_sa_time, nullable=False)
    
    # Relationship
    performed_by = relationship("User", foreign_keys=[performed_by_id])
    
    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type}#{self.entity_id}>"
