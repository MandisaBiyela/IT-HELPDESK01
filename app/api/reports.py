from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import pandas as pd
import io
from app.database import get_db
from app.models.user import User
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/tickets/export")
def export_tickets_csv(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    assignee_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Export tickets to CSV with optional filters"""
    
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
    
    # Prepare data for CSV
    data = []
    for ticket in tickets:
        assignee_name = ticket.assignee.name if ticket.assignee else "Unassigned"
        assignee_email = ticket.assignee.email if ticket.assignee else ""
        data.append({
            'Ticket ID': ticket.ticket_number,
            'Created Date': ticket.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'User Name': ticket.user_name,
            'User Email': ticket.user_email,
            'User Phone': ticket.user_phone,
            'Problem Summary': ticket.problem_summary,
            'Problem Description': ticket.problem_description or '',
            'Priority': ticket.priority.value,
            'Status': ticket.status.value,
            'Assignee': assignee_name,
            'Assignee Email': assignee_email,
            'SLA Deadline': ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S'),
            'Resolved Date': ticket.resolved_at.strftime('%Y-%m-%d %H:%M:%S') if ticket.resolved_at else '',
            'Escalated': 'Yes' if ticket.escalated else 'No',
            'Updates Count': len(ticket.updates)
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Convert to CSV
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    # Prepare response
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=tickets_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return response


@router.get("/statistics")
def get_ticket_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get ticket statistics and analytics"""
    
    query = db.query(Ticket)
    
    # Apply date filters
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(Ticket.created_at >= start_dt)
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(Ticket.created_at <= end_dt)
    
    tickets = query.all()
    
    # Calculate statistics
    total_tickets = len(tickets)
    
    status_breakdown = {
        'open': len([t for t in tickets if t.status == TicketStatus.OPEN]),
        'in_progress': len([t for t in tickets if t.status == TicketStatus.IN_PROGRESS]),
        'resolved': len([t for t in tickets if t.status == TicketStatus.RESOLVED]),
        'closed': len([t for t in tickets if t.status == TicketStatus.CLOSED])
    }
    
    priority_breakdown = {
        'urgent': len([t for t in tickets if t.priority == TicketPriority.URGENT]),
        'high': len([t for t in tickets if t.priority == TicketPriority.HIGH]),
        'normal': len([t for t in tickets if t.priority == TicketPriority.NORMAL])
    }
    
    escalated_count = len([t for t in tickets if t.escalated])
    
    # Calculate average resolution time
    resolved_tickets = [t for t in tickets if t.resolved_at]
    if resolved_tickets:
        total_resolution_time = sum([
            (t.resolved_at - t.created_at).total_seconds() / 3600  # hours
            for t in resolved_tickets
        ])
        avg_resolution_hours = total_resolution_time / len(resolved_tickets)
    else:
        avg_resolution_hours = 0
    
    # Assignee performance
    assignee_stats = {}
    for ticket in tickets:
        if not ticket.assignee:
            continue  # Skip tickets without assignee
            
        assignee_name = ticket.assignee.name
        if assignee_name not in assignee_stats:
            assignee_stats[assignee_name] = {
                'total': 0,
                'resolved': 0,
                'in_progress': 0,
                'escalated': 0
            }
        
        assignee_stats[assignee_name]['total'] += 1
        if ticket.status == TicketStatus.RESOLVED:
            assignee_stats[assignee_name]['resolved'] += 1
        if ticket.status == TicketStatus.IN_PROGRESS:
            assignee_stats[assignee_name]['in_progress'] += 1
        if ticket.escalated:
            assignee_stats[assignee_name]['escalated'] += 1
    
    return {
        'total_tickets': total_tickets,
        'status_breakdown': status_breakdown,
        'priority_breakdown': priority_breakdown,
        'escalated_count': escalated_count,
        'average_resolution_hours': round(avg_resolution_hours, 2),
        'assignee_performance': assignee_stats
    }
