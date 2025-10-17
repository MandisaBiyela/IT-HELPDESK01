from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.ticket import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    user_name: str
    user_email: EmailStr
    user_phone: str
    problem_summary: str
    problem_description: Optional[str] = None
    priority: TicketPriority = TicketPriority.NORMAL
    assignee_id: int


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assignee_id: Optional[int] = None
    update_text: Optional[str] = None
    is_internal: Optional[bool] = False
    time_spent: Optional[int] = None
    reassign_reason: Optional[str] = None


class TicketUpdateCreate(BaseModel):
    update_text: str


class TicketUpdateResponse(BaseModel):
    id: int
    ticket_id: int
    update_text: str
    updated_by_id: int
    updated_by_name: str
    created_at: datetime
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    old_assignee_id: Optional[int] = None
    new_assignee_id: Optional[int] = None
    old_priority: Optional[str] = None
    new_priority: Optional[str] = None
    is_internal: Optional[bool] = False
    time_spent: Optional[int] = None
    reassign_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    user_name: str
    user_email: str
    user_phone: str
    problem_summary: str
    problem_description: Optional[str] = None
    priority: TicketPriority
    status: TicketStatus
    assignee_id: int
    assignee_name: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    sla_deadline: datetime
    requires_update: bool
    escalated: bool
    updates: List[TicketUpdateResponse] = []
    
    class Config:
        from_attributes = True


class TicketListResponse(BaseModel):
    id: int
    ticket_number: str
    user_name: str
    user_email: str
    user_phone: str
    problem_summary: str
    priority: TicketPriority
    status: TicketStatus
    assignee_name: str
    assignee: Optional[dict] = None  # Add assignee object for detailed info
    assignee_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    sla_deadline: datetime
    
    class Config:
        from_attributes = True


class SLAEscalationResponse(BaseModel):
    id: int
    ticket_id: int
    escalation_reason: str
    escalated_at: datetime
    previous_priority: Optional[str] = None
    new_priority: Optional[str] = None
    
    class Config:
        from_attributes = True


class TicketFilterParams(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assignee_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
