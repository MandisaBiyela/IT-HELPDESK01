from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging
from app.database import get_db
from app.models.user import User
from app.models.ticket import Ticket, TicketUpdate, TicketStatus, TicketPriority
from app.utils.timezone import get_sa_time
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate as TicketUpdateSchema,
    TicketResponse,
    TicketListResponse,
    TicketUpdateResponse
)
from app.utils.auth import get_current_active_user, require_role
from app.utils.ticket_helpers import generate_ticket_number, calculate_sla_deadline
from app.services.email_service import EmailService
from app.services.whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["helpdesk_officer", "technician", "admin"]))
):
    """Create a new support ticket - Helpdesk Officers, Technicians, and Admins can create tickets"""
    # Generate ticket number
    last_ticket = db.query(Ticket).order_by(Ticket.id.desc()).first()
    last_id = last_ticket.id if last_ticket else 0
    ticket_number = generate_ticket_number(last_id)
    
    # Calculate SLA deadline
    sla_deadline = calculate_sla_deadline(ticket_data.priority)
    
    # Create ticket
    new_ticket = Ticket(
        ticket_number=ticket_number,
        user_name=ticket_data.user_name,
        user_email=ticket_data.user_email,
        user_phone=ticket_data.user_phone,
        problem_summary=ticket_data.problem_summary,
        problem_description=ticket_data.problem_description,
        priority=ticket_data.priority,
        assignee_id=ticket_data.assignee_id,
        sla_deadline=sla_deadline,
        status=TicketStatus.OPEN
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    # Get assignee information FIRST
    assignee = db.query(User).filter(User.id == ticket_data.assignee_id).first()
    assignee_name = assignee.name if assignee else 'Unassigned'
    
    # Create initial ticket update for history tracking
    from app.models.ticket import TicketUpdate
    initial_update = TicketUpdate(
        ticket_id=new_ticket.id,
        update_text=f"Ticket created and assigned to {assignee_name}",
        updated_by_id=current_user.id,
        new_status=TicketStatus.OPEN.value,
        new_priority=new_ticket.priority.value,
        new_assignee_id=new_ticket.assignee_id
    )
    db.add(initial_update)
    db.commit()
    
    # Prepare notification data
    notification_data = {
        'ticket_number': new_ticket.ticket_number,
        'user_name': new_ticket.user_name,
        'user_email': new_ticket.user_email,
        'user_phone': new_ticket.user_phone,
        'problem_summary': new_ticket.problem_summary,
        'problem_description': new_ticket.problem_description or '',
        'priority': new_ticket.priority.value,
        'assignee_name': assignee.name,
        'assignee_email': assignee.email,
        'assignee_whatsapp': assignee.phone,
        'sla_deadline': new_ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S'),
        'ticket_url': EmailService.get_ticket_url(new_ticket.ticket_number)
    }
    
    # Send notifications in background
    background_tasks.add_task(EmailService.send_ticket_created, notification_data)
    background_tasks.add_task(whatsapp_service.send_ticket_created, notification_data)
    
    # Prepare response
    response = TicketResponse(
        id=new_ticket.id,
        ticket_number=new_ticket.ticket_number,
        user_name=new_ticket.user_name,
        user_email=new_ticket.user_email,
        user_phone=new_ticket.user_phone,
        problem_summary=new_ticket.problem_summary,
        problem_description=new_ticket.problem_description,
        priority=new_ticket.priority,
        status=new_ticket.status,
        assignee_id=new_ticket.assignee_id,
        assignee_name=assignee.name,
        created_at=new_ticket.created_at,
        resolved_at=new_ticket.resolved_at,
        sla_deadline=new_ticket.sla_deadline,
        requires_update=bool(new_ticket.requires_update),
        escalated=bool(new_ticket.escalated),
        updates=[]
    )
    
    return response


@router.get("", response_model=List[TicketListResponse])
def get_all_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    assignee_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all tickets with optional filters"""
    query = db.query(Ticket)
    
    # Apply filters
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if assignee_id:
        query = query.filter(Ticket.assignee_id == assignee_id)
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(Ticket.created_at >= start_dt)
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(Ticket.created_at <= end_dt)
    
    tickets = query.order_by(Ticket.created_at.desc()).all()
    
    # Prepare response
    response = []
    for ticket in tickets:
        assignee_name = ticket.assignee.name if ticket.assignee else "Unassigned"
        assignee_obj = None
        if ticket.assignee:
            assignee_obj = {
                "id": ticket.assignee.id,
                "name": ticket.assignee.name,
                "email": ticket.assignee.email,
                "role": ticket.assignee.role
            }
        
        response.append(TicketListResponse(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            user_name=ticket.user_name,
            user_email=ticket.user_email,
            user_phone=ticket.user_phone,
            problem_summary=ticket.problem_summary,
            priority=ticket.priority,
            status=ticket.status,
            assignee_name=assignee_name,
            assignee=assignee_obj,
            assignee_id=ticket.assignee_id,
            created_at=ticket.created_at,
            resolved_at=ticket.resolved_at,
            sla_deadline=ticket.sla_deadline
        ))
    
    return response


@router.get("/{ticket_number}", response_model=TicketResponse)
def get_ticket(
    ticket_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific ticket by ticket number"""
    ticket = db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_number} not found"
        )
    
    # Get updates with user info
    updates = []
    for update in ticket.updates:
        updates.append(TicketUpdateResponse(
            id=update.id,
            ticket_id=update.ticket_id,
            update_text=update.update_text,
            updated_by_id=update.updated_by_id,
            updated_by_name=update.updated_by.name,
            created_at=update.created_at,
            old_status=update.old_status,
            new_status=update.new_status,
            old_assignee_id=update.old_assignee_id,
            new_assignee_id=update.new_assignee_id,
            old_priority=update.old_priority,
            new_priority=update.new_priority
        ))
    
    response = TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        user_name=ticket.user_name,
        user_email=ticket.user_email,
        user_phone=ticket.user_phone,
        problem_summary=ticket.problem_summary,
        problem_description=ticket.problem_description,
        priority=ticket.priority,
        status=ticket.status,
        assignee_id=ticket.assignee_id,
        assignee_name=ticket.assignee.name if ticket.assignee else "Unassigned",
        created_at=ticket.created_at,
        resolved_at=ticket.resolved_at,
        sla_deadline=ticket.sla_deadline,
        requires_update=bool(ticket.requires_update),
        escalated=bool(ticket.escalated),
        updates=updates
    )
    
    return response


@router.patch("/{ticket_number}", response_model=TicketResponse)
async def update_ticket(
    ticket_number: str,
    update_data: TicketUpdateSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a ticket (status, priority, assignee, or add update)"""
    ticket = db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_number} not found"
        )
    
    # Check if compulsory update is required
    if ticket.requires_update and not update_data.update_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This ticket requires a compulsory update before any other action can be taken"
        )
    
    # Track changes for audit log
    old_status = ticket.status.value if ticket.status else None
    old_assignee_id = ticket.assignee_id
    old_priority = ticket.priority.value if ticket.priority else None
    
    changes_made = False
    
    # Track if status is changing TO or FROM "Waiting on User" (for SLA pause/resume)
    was_waiting = (ticket.status == TicketStatus.WAITING_ON_USER)
    will_be_waiting = (update_data.status == TicketStatus.WAITING_ON_USER if update_data.status else False)
    
    # Update status
    if update_data.status and update_data.status != ticket.status:
        old_sla_deadline = ticket.sla_deadline
        ticket.status = update_data.status
        changes_made = True
        
        # If resolved, set resolved_at
        if update_data.status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        
        # ✅ SLA PAUSE: Moving TO "Waiting on User" - Store time remaining
        if will_be_waiting and not was_waiting:
            time_remaining_minutes = (ticket.sla_deadline - datetime.now()).total_seconds() / 60
            ticket.sla_paused_minutes = int(max(0, time_remaining_minutes))  # Store remaining time
            logger.info(f"⏸️ SLA PAUSED for {ticket.ticket_number} - {ticket.sla_paused_minutes} minutes remaining")
        
        # ✅ SLA RESUME: Moving FROM "Waiting on User" back to active status
        if was_waiting and not will_be_waiting:
            # Restore SLA deadline by adding back the paused time
            if ticket.sla_paused_minutes and ticket.sla_paused_minutes > 0:
                ticket.sla_deadline = datetime.now() + timedelta(minutes=ticket.sla_paused_minutes)
                logger.info(f"▶️ SLA RESUMED for {ticket.ticket_number} - {ticket.sla_paused_minutes} minutes restored")
                ticket.sla_paused_minutes = 0  # Clear paused time
            else:
                # No paused time stored, recalculate from priority
                ticket.sla_deadline = calculate_sla_deadline(ticket.priority, datetime.now())
                logger.warning(f"⚠️ No paused time found for {ticket.ticket_number}, recalculated SLA")
    
    # Update priority
    if update_data.priority and update_data.priority != ticket.priority:
        ticket.priority = update_data.priority
        # Recalculate SLA deadline
        ticket.sla_deadline = calculate_sla_deadline(update_data.priority, ticket.created_at)
        changes_made = True
    
    # Update assignee
    if update_data.assignee_id and update_data.assignee_id != ticket.assignee_id:
        ticket.assignee_id = update_data.assignee_id
        changes_made = True
    
    # Create update log
    if update_data.update_text or changes_made:
        update_log = TicketUpdate(
            ticket_id=ticket.id,
            update_text=update_data.update_text or "Ticket updated",
            updated_by_id=current_user.id,
            old_status=old_status,
            new_status=ticket.status.value if changes_made and update_data.status else None,
            old_assignee_id=old_assignee_id if changes_made and update_data.assignee_id else None,
            new_assignee_id=ticket.assignee_id if changes_made and update_data.assignee_id else None,
            old_priority=old_priority,
            new_priority=ticket.priority.value if changes_made and update_data.priority else None,
            is_internal=1 if update_data.is_internal else 0,
            time_spent=update_data.time_spent,
            reassign_reason=update_data.reassign_reason
        )
        db.add(update_log)
        
        # Clear compulsory update flag if update was provided
        if update_data.update_text and ticket.requires_update:
            ticket.requires_update = 0
    
    db.commit()
    db.refresh(ticket)
    
    # Send notifications
    if update_data.update_text:
        notification_data = {
            'ticket_number': ticket.ticket_number,
            'user_name': ticket.user_name,
            'user_email': ticket.user_email,
            'status': ticket.status.value,
            'updated_by': current_user.name,
            'ticket_url': EmailService.get_ticket_url(ticket.ticket_number)
        }
        
        background_tasks.add_task(
            EmailService.send_ticket_updated,
            notification_data,
            update_data.update_text
        )
        background_tasks.add_task(
            whatsapp_service.send_ticket_updated,
            notification_data,
            update_data.update_text
        )
    
    # Send resolved notification
    if update_data.status == TicketStatus.RESOLVED:
        resolved_data = {
            'ticket_number': ticket.ticket_number,
            'user_name': ticket.user_name,
            'user_email': ticket.user_email,
            'problem_summary': ticket.problem_summary,
            'assignee_name': ticket.assignee.name if ticket.assignee else "Unassigned"
        }
        
        background_tasks.add_task(EmailService.send_ticket_resolved, resolved_data)
        background_tasks.add_task(whatsapp_service.send_ticket_resolved, resolved_data)
    
    # Return updated ticket
    return get_ticket(ticket_number, db, current_user)


@router.get("/{ticket_number}/updates", response_model=List[TicketUpdateResponse])
def get_ticket_updates(
    ticket_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all updates for a specific ticket"""
    ticket = db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_number} not found"
        )
    
    updates = []
    for update in ticket.updates:
        updates.append(TicketUpdateResponse(
            id=update.id,
            ticket_id=update.ticket_id,
            update_text=update.update_text,
            updated_by_id=update.updated_by_id,
            updated_by_name=update.updated_by.name,
            created_at=update.created_at,
            old_status=update.old_status,
            new_status=update.new_status,
            old_assignee_id=update.old_assignee_id,
            new_assignee_id=update.new_assignee_id,
            old_priority=update.old_priority,
            new_priority=update.new_priority
        ))
    
    return updates


@router.get("/{ticket_id}/check-blocked", status_code=status.HTTP_200_OK)
def check_if_blocked(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Check if ticket requires forced update before other actions"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket not found"
        )
    
    # Check if update is required
    if ticket.requires_update == 1:
        # Get latest escalation reason
        from app.models.ticket import SLAEscalation
        latest_escalation = db.query(SLAEscalation).filter(
            SLAEscalation.ticket_id == ticket.id
        ).order_by(SLAEscalation.escalated_at.desc()).first()
        
        return {
            "requires_update": True,
            "escalation_reason": latest_escalation.escalation_reason if latest_escalation else "SLA deadline exceeded",
            "ticket_number": ticket.ticket_number,
            "priority": ticket.priority.value,
            "message": "You must provide an escalation update before performing any other actions on this ticket."
        }
    
    return {
        "requires_update": False,
        "message": "No forced update required"
    }


@router.post("/{ticket_id}/forced-update", status_code=status.HTTP_200_OK)
async def submit_forced_update(
    ticket_id: int,
    update_text: str,
    time_spent: Optional[int] = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit mandatory escalation update - clears requires_update flag"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Verify ticket requires update
    if ticket.requires_update != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This ticket does not require a forced update"
        )
    
    # Verify user is assignee or admin
    if current_user.role not in ["admin"] and current_user.id != ticket.assignee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned technician can provide this update"
        )
    
    # Create the forced update
    ticket_update = TicketUpdate(
        ticket_id=ticket.id,
        update_text=f"[ESCALATION UPDATE] {update_text}",
        updated_by_id=current_user.id,
        time_spent=time_spent
    )
    db.add(ticket_update)
    
    # Clear the forced update flag
    ticket.requires_update = 0
    ticket.updated_at = datetime.utcnow()
    
    # Create audit log
    from app.models.audit_log import AuditLog
    import json
    audit_log = AuditLog(
        entity_type='ticket',
        entity_id=ticket.id,
        action='forced_update_submitted',
        performed_by_id=current_user.id,
        details=json.dumps({
            'ticket_number': ticket.ticket_number,
            'update_text': update_text,
            'time_spent': time_spent,
            'requires_update_cleared': True
        })
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(ticket)
    
    return {
        "success": True,
        "message": "Escalation update submitted successfully. You may now perform other actions.",
        "ticket_number": ticket.ticket_number,
        "requires_update": False
    }


class ReassignRequest(BaseModel):
    new_assignee_id: int
    reassign_reason: str

@router.post("/{ticket_id}/reassign", status_code=status.HTTP_200_OK)
async def reassign_ticket(
    ticket_id: int,
    reassign_data: ReassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reassign ticket to another technician - requires reason"""
    new_assignee_id = reassign_data.new_assignee_id
    reassign_reason = reassign_data.reassign_reason
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check if forced update is required
    if ticket.requires_update == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "FORCED_UPDATE_REQUIRED",
                "message": "You must provide an escalation update before reassigning this ticket",
                "ticket_id": ticket_id
            }
        )
    
    # Validate reassign reason
    if not reassign_reason or len(reassign_reason.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reassign reason must be at least 10 characters"
        )
    
    # Verify new assignee exists and is a technician
    new_assignee = db.query(User).filter(User.id == new_assignee_id).first()
    if not new_assignee or new_assignee.role != "technician":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid assignee - must be an active technician"
        )
    
    # Store old assignee for tracking
    old_assignee_id = ticket.assignee_id
    old_assignee_name = ticket.assignee.name if ticket.assignee else "Unassigned"
    
    # Create reassignment update
    ticket_update = TicketUpdate(
        ticket_id=ticket.id,
        update_text=f"Ticket reassigned from {old_assignee_name} to {new_assignee.name}",
        updated_by_id=current_user.id,
        old_assignee_id=old_assignee_id,
        new_assignee_id=new_assignee_id,
        reassign_reason=reassign_reason
    )
    db.add(ticket_update)
    
    # Update ticket assignee
    ticket.assignee_id = new_assignee_id
    ticket.updated_at = datetime.utcnow()
    
    # Create audit log
    from app.models.audit_log import AuditLog
    import json
    audit_log = AuditLog(
        entity_type='ticket',
        entity_id=ticket.id,
        action='ticket_reassigned',
        performed_by_id=current_user.id,
        details=json.dumps({
            'ticket_number': ticket.ticket_number,
            'old_assignee_id': old_assignee_id,
            'old_assignee_name': old_assignee_name,
            'new_assignee_id': new_assignee_id,
            'new_assignee_name': new_assignee.name,
            'reassign_reason': reassign_reason,
            'performed_by': current_user.name
        })
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(ticket)
    
    return {
        "success": True,
        "message": f"Ticket reassigned to {new_assignee.name}",
        "ticket_number": ticket.ticket_number,
        "old_assignee": old_assignee_name,
        "new_assignee": new_assignee.name,
        "reason": reassign_reason
    }


@router.post("/{ticket_id}/internal-note", status_code=status.HTTP_201_CREATED)
async def add_internal_note(
    ticket_id: int,
    note_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["helpdesk_officer", "ict_manager", "admin"]))
):
    """Add internal note (private comment) - only visible to helpdesk, managers, and admins"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Create internal note (is_internal = 1)
    internal_note = TicketUpdate(
        ticket_id=ticket.id,
        update_text=f"[INTERNAL NOTE] {note_text}",
        updated_by_id=current_user.id,
        is_internal=1  # Mark as internal
    )
    db.add(internal_note)
    
    ticket.updated_at = datetime.utcnow()
    
    # Create audit log
    from app.models.audit_log import AuditLog
    import json
    audit_log = AuditLog(
        entity_type='ticket',
        entity_id=ticket.id,
        action='internal_note_added',
        performed_by_id=current_user.id,
        details=json.dumps({
            'ticket_number': ticket.ticket_number,
            'note_preview': note_text[:100],
            'added_by': current_user.name,
            'is_internal': True
        })
    )
    db.add(audit_log)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Internal note added successfully",
        "ticket_number": ticket.ticket_number,
        "note_id": internal_note.id
    }


class TimeTrackingRequest(BaseModel):
    update_text: str
    time_spent: int  # Minutes


@router.post("/{ticket_id}/time-tracking", status_code=status.HTTP_200_OK)
async def add_time_tracking(
    ticket_id: int,
    time_data: TimeTrackingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add update with time tracking - for technicians"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if time_data.time_spent < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time spent must be at least 1 minute"
        )
    
    # Create update with time tracking
    ticket_update = TicketUpdate(
        ticket_id=ticket.id,
        update_text=time_data.update_text,
        updated_by_id=current_user.id,
        time_spent=time_data.time_spent
    )
    db.add(ticket_update)
    
    ticket.updated_at = get_sa_time()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Update with time tracking added",
        "ticket_number": ticket.ticket_number,
        "time_spent_minutes": time_data.time_spent,
        "time_spent_hours": round(time_data.time_spent / 60, 2)
    }


@router.delete("/{ticket_number}", status_code=status.HTTP_200_OK)
async def delete_ticket(
    ticket_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "helpdesk_officer"]))
):
    """Delete a ticket - Only Admins and Helpdesk Officers can delete tickets"""
    ticket = db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_number} not found"
        )
    
    # Delete the ticket (cascade will handle related records)
    db.delete(ticket)
    db.commit()
    
    return {
        "success": True,
        "message": f"Ticket {ticket_number} deleted successfully"
    }


# ============ USER SELF-SERVICE ENDPOINTS ============

@router.post("/create-my-ticket", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_my_ticket(
    ticket_data: TicketCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Allow any authenticated user to create a ticket for themselves"""
    # Generate ticket number
    last_ticket = db.query(Ticket).order_by(Ticket.id.desc()).first()
    last_id = last_ticket.id if last_ticket else 0
    ticket_number = generate_ticket_number(last_id)
    
    # Calculate SLA deadline
    sla_deadline = calculate_sla_deadline(ticket_data.priority)
    
    # Create ticket using current user's information
    new_ticket = Ticket(
        ticket_number=ticket_number,
        user_name=current_user.name,
        user_email=current_user.email,
        user_phone=current_user.phone or ticket_data.user_phone,
        problem_summary=ticket_data.problem_summary,
        problem_description=ticket_data.problem_description,
        priority=ticket_data.priority,
        status=TicketStatus.OPEN,
        sla_deadline=sla_deadline,
        reported_by_id=current_user.id,
        created_at=get_sa_time(),
        updated_at=get_sa_time()
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    logger.info(f"User {current_user.name} created ticket {ticket_number}")
    
    return new_ticket


@router.get("/my-tickets", response_model=List[TicketResponse])
async def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all tickets created by the current user"""
    tickets = db.query(Ticket).filter(
        Ticket.reported_by_id == current_user.id
    ).order_by(Ticket.created_at.desc()).all()
    
    return tickets

