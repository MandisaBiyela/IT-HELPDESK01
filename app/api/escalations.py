"""
Escalations and Advanced Reporting API
Endpoints for ICT Manager and GM oversight
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, TicketPriority, SLAEscalation, SLAStatus
from app.models.audit_log import AuditLog
from app.utils.auth import get_current_active_user, require_role
import json
import csv
import io

router = APIRouter(prefix="/api", tags=["Escalations & Reports"])


@router.get("/escalations")
def get_escalations(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ict_manager", "ict_gm", "admin"]))
):
    """Get all escalated tickets with details - Manager and GM only"""
    
    # Query escalated tickets
    query = db.query(Ticket).filter(Ticket.escalated == 1)
    
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    
    escalated_tickets = query.order_by(Ticket.updated_at.desc()).all()
    
    result = []
    for ticket in escalated_tickets:
        # Get latest escalation record
        latest_escalation = db.query(SLAEscalation).filter(
            SLAEscalation.ticket_id == ticket.id
        ).order_by(SLAEscalation.escalated_at.desc()).first()
        
        # Calculate time since escalation
        time_since = None
        if latest_escalation:
            diff = datetime.utcnow() - latest_escalation.escalated_at
            hours = diff.total_seconds() / 3600
            if hours < 1:
                time_since = f"{int(diff.total_seconds() / 60)} minutes ago"
            elif hours < 24:
                time_since = f"{int(hours)} hours ago"
            else:
                time_since = f"{int(hours / 24)} days ago"
        
        result.append({
            "id": ticket.id,
            "ticket_id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "title": ticket.problem_summary,  # Use problem_summary as title
            "problem_summary": ticket.problem_summary,
            "priority": ticket.priority.value,
            "status": ticket.status.value,
            "category": "General Support",  # Default category since it's not in the model
            "sla_status": ticket.sla_status.value if ticket.sla_status else "Unknown",
            "requires_update": bool(ticket.requires_update),
            "assignee_name": ticket.assignee.name if ticket.assignee else "Unassigned",
            "assignee_id": ticket.assignee_id,
            "reported_by_name": ticket.user_name,
            "reported_by_email": ticket.user_email,
            "user_name": ticket.user_name,
            "user_email": ticket.user_email,
            "escalation_reason": latest_escalation.escalation_reason if latest_escalation else "SLA breach",
            "escalated_at": latest_escalation.escalated_at if latest_escalation else ticket.created_at,
            "time_since_escalation": time_since,
            "previous_priority": latest_escalation.previous_priority if latest_escalation else None,
            "created_at": ticket.created_at,
            "sla_deadline": ticket.sla_deadline,
            "gm_acknowledged": False  # Default to False since model doesn't track this
        })
    
    return {
        "total": len(result),
        "escalations": result
    }


@router.post("/escalations/{ticket_id}/acknowledge")
async def acknowledge_escalation(
    ticket_id: int,
    acknowledgment_note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ict_gm", "admin"]))
):
    """GM acknowledges an escalation - creates audit log"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if not ticket.escalated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This ticket is not escalated"
        )
    
    # Create audit log for acknowledgment
    audit_log = AuditLog(
        entity_type='escalation',
        entity_id=ticket.id,
        action='escalation_acknowledged',
        performed_by_id=current_user.id,
        details=json.dumps({
            'ticket_number': ticket.ticket_number,
            'acknowledged_by': current_user.name,
            'acknowledgment_note': acknowledgment_note or 'No note provided',
            'acknowledged_at': datetime.utcnow().isoformat(),
            'priority': ticket.priority.value,
            'status': ticket.status.value
        })
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "success": True,
        "message": f"Escalation acknowledged by {current_user.name}",
        "ticket_number": ticket.ticket_number,
        "acknowledged_at": datetime.utcnow()
    }


@router.get("/reports/kpis")
def get_kpis(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ict_manager", "ict_gm", "admin"]))
):
    """Get KPIs for manager dashboard"""
    
    # Parse dates - if no dates provided, show ALL tickets (for ICT GM)
    if date_from and date_to:
        start_date = datetime.fromisoformat(date_from)
        end_date = datetime.fromisoformat(date_to)
        use_date_filter = True
    else:
        # No date filter - show all time statistics
        start_date = None
        end_date = None
        use_date_filter = False
    
    # Total tickets (all time or in period)
    if use_date_filter:
        total_tickets = db.query(Ticket).filter(
            Ticket.created_at.between(start_date, end_date)
        ).count()
    else:
        total_tickets = db.query(Ticket).count()
    
    # Open tickets
    open_tickets = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
    ).count()
    
    # Resolved tickets (in period or all time)
    if use_date_filter:
        resolved_tickets = db.query(Ticket).filter(
            and_(
                Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
                Ticket.resolved_at.between(start_date, end_date)
            )
        ).all()
    else:
        resolved_tickets = db.query(Ticket).filter(
            Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
            Ticket.resolved_at.isnot(None)
        ).all()
    
    # Calculate average resolution time
    if resolved_tickets:
        total_resolution_time = sum(
            [(t.resolved_at - t.created_at).total_seconds() / 3600 for t in resolved_tickets if t.resolved_at]
        )
        avg_resolution_hours = total_resolution_time / len(resolved_tickets)
    else:
        avg_resolution_hours = 0
    
    # SLA breach percentage
    if use_date_filter:
        breached_tickets = db.query(Ticket).filter(
            and_(
                Ticket.created_at.between(start_date, end_date),
                Ticket.sla_status == SLAStatus.BREACHED
            )
        ).count()
    else:
        breached_tickets = db.query(Ticket).filter(
            Ticket.sla_status == SLAStatus.BREACHED
        ).count()
    
    sla_breach_percentage = (breached_tickets / total_tickets * 100) if total_tickets > 0 else 0
    
    # Tickets by priority
    tickets_by_priority = {}
    for priority in [TicketPriority.NORMAL, TicketPriority.HIGH, TicketPriority.URGENT]:
        if use_date_filter:
            count = db.query(Ticket).filter(
                and_(
                    Ticket.priority == priority,
                    Ticket.created_at.between(start_date, end_date)
                )
            ).count()
        else:
            count = db.query(Ticket).filter(Ticket.priority == priority).count()
        tickets_by_priority[priority.value] = count
    
    # Tickets by status
    tickets_by_status = {}
    for ticket_status in [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED]:
        if use_date_filter:
            count = db.query(Ticket).filter(
                and_(
                    Ticket.status == ticket_status,
                    Ticket.created_at.between(start_date, end_date)
                )
            ).count()
        else:
            count = db.query(Ticket).filter(Ticket.status == ticket_status).count()
        tickets_by_status[ticket_status.value] = count
    
    # Current escalations
    current_escalations = db.query(Ticket).filter(
        Ticket.escalated == 1,
        Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
    ).count()
    
    return {
        "period": {
            "from": start_date.isoformat() if start_date else "all_time",
            "to": end_date.isoformat() if end_date else "all_time"
        },
        "kpis": {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "resolved_tickets": len(resolved_tickets),
            "avg_resolution_time_hours": round(avg_resolution_hours, 2),
            "sla_breach_percentage": round(sla_breach_percentage, 2),
            "current_escalations": current_escalations
        },
        "breakdowns": {
            "by_priority": tickets_by_priority,
            "by_status": tickets_by_status
        }
    }


@router.get("/reports/export")
def export_tickets_csv(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ict_manager", "ict_gm", "admin"]))
):
    """Export tickets to CSV"""
    
    # Build query
    query = db.query(Ticket)
    
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    
    if priority_filter:
        query = query.filter(Ticket.priority == priority_filter)
    
    if date_from:
        query = query.filter(Ticket.created_at >= datetime.fromisoformat(date_from))
    
    if date_to:
        query = query.filter(Ticket.created_at <= datetime.fromisoformat(date_to))
    
    tickets = query.order_by(Ticket.created_at.desc()).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        'Ticket Number', 'Created At', 'User Name', 'User Email', 'User Phone',
        'Problem Summary', 'Priority', 'Status', 'SLA Status', 'Assignee',
        'Created At', 'Resolved At', 'SLA Deadline', 'Escalated'
    ])
    
    # Data rows
    for ticket in tickets:
        writer.writerow([
            ticket.ticket_number,
            ticket.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ticket.user_name,
            ticket.user_email,
            ticket.user_phone,
            ticket.problem_summary,
            ticket.priority.value,
            ticket.status.value,
            ticket.sla_status.value if ticket.sla_status else 'Unknown',
            ticket.assignee.name if ticket.assignee else 'Unassigned',
            ticket.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ticket.resolved_at.strftime('%Y-%m-%d %H:%M:%S') if ticket.resolved_at else '',
            ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S'),
            'Yes' if ticket.escalated else 'No'
        ])
    
    # Prepare response
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=tickets_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.get("/audit-logs")
def get_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ict_manager", "ict_gm", "admin"]))
):
    """Get audit logs - Manager and GM only"""
    
    query = db.query(AuditLog)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        performed_by = db.query(User).filter(User.id == log.performed_by_id).first() if log.performed_by_id else None
        
        result.append({
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "performed_by": performed_by.name if performed_by else "System",
            "performed_by_id": log.performed_by_id,
            "details": json.loads(log.details) if log.details else {},
            "created_at": log.created_at
        })
    
    return {
        "total": len(result),
        "logs": result
    }


@router.get("/technicians/workload")
def get_technician_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ict_manager", "ict_gm", "helpdesk_officer", "admin"]))
):
    """Get workload distribution across technicians"""
    
    technicians = db.query(User).filter(
        User.role == UserRole.TECHNICIAN,
        User.is_active == 1
    ).all()
    
    result = []
    for tech in technicians:
        # Count active tickets
        active_tickets = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
        ).count()
        
        # Count escalated tickets
        escalated_tickets = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.escalated == 1,
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
        ).count()
        
        # Calculate total resolved this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        resolved_this_month = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
            Ticket.resolved_at >= month_start
        ).count()
        
        result.append({
            "technician_id": tech.id,
            "technician_name": tech.name,
            "technician_type": tech.technician_type,
            "email": tech.email,
            "active_tickets": active_tickets,
            "escalated_tickets": escalated_tickets,
            "resolved_this_month": resolved_this_month,
            "load_status": "overloaded" if active_tickets >= 7 else ("busy" if active_tickets >= 4 else "available")
        })
    
    return {
        "total_technicians": len(result),
        "technicians": sorted(result, key=lambda x: x["active_tickets"])
    }
