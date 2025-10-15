// Technician Workbench - Kanban Board with Forced Updates
const API_BASE = 'http://localhost:8000/api';
let currentUser = null;
let currentTicket = null;
let allTickets = [];
let technicians = [];
let draggedCard = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadTechnicians();
    loadTickets();
    
    // Auto-refresh every 30 seconds
    setInterval(loadTickets, 30000);
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Setup character counter for reassign reason
    document.getElementById('reassignReason')?.addEventListener('input', updateReasonCounter);
});

// Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/static/index.html';
        return;
    }
    
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'technician') {
        alert('Access denied. This page is for technicians only.');
        window.location.href = '/static/index.html';
        return;
    }
    
    const userName = localStorage.getItem('user_name');
    document.getElementById('userName').textContent = userName || 'Technician';
    
    currentUser = {
        name: userName,
        role: userRole,
        id: parseInt(localStorage.getItem('user_id'))
    };
}

function logout() {
    localStorage.clear();
    window.location.href = '/static/index.html';
}

// Load all tickets assigned to current user
async function loadTickets() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load tickets');
        
        const data = await response.json();
        allTickets = data.tickets || [];
        
        // Filter to only show tickets assigned to current user
        const myTickets = allTickets.filter(t => t.assignee_id === currentUser.id);
        
        renderKanbanBoard(myTickets);
        updateStats(myTickets);
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        showError('Failed to load tickets');
    }
}

// Render Kanban board
function renderKanbanBoard(tickets) {
    const columns = {
        'Open': document.getElementById('openCards'),
        'In Progress': document.getElementById('progressCards'),
        'Waiting on User': document.getElementById('waitingCards'),
        'Resolved': document.getElementById('resolvedCards')
    };
    
    // Clear all columns
    Object.values(columns).forEach(col => {
        if (col) col.innerHTML = '';
    });
    
    // Count tickets per column
    const counts = {
        'Open': 0,
        'In Progress': 0,
        'Waiting on User': 0,
        'Resolved': 0
    };
    
    // Sort by priority and created date
    tickets.sort((a, b) => {
        const priorityOrder = { 'Urgent': 0, 'High': 1, 'Normal': 2, 'Low': 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // Render each ticket
    tickets.forEach(ticket => {
        const column = columns[ticket.status];
        if (column) {
            counts[ticket.status]++;
            const card = createKanbanCard(ticket);
            column.appendChild(card);
        }
    });
    
    // Update counts
    document.getElementById('openCount').textContent = counts['Open'];
    document.getElementById('progressCount').textContent = counts['In Progress'];
    document.getElementById('waitingCount').textContent = counts['Waiting on User'];
    document.getElementById('resolvedCount').textContent = counts['Resolved'];
}

// Create individual kanban card
function createKanbanCard(ticket) {
    const card = document.createElement('div');
    card.className = `kanban-card priority-${ticket.priority.toLowerCase()}`;
    card.draggable = true;
    card.dataset.ticketId = ticket.id;
    card.dataset.ticketNumber = ticket.ticket_number;
    
    // Calculate time ago
    const timeAgo = getTimeAgo(ticket.created_at);
    
    // Calculate SLA remaining
    const slaInfo = getSLAInfo(ticket);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-number">${ticket.ticket_number}</span>
            <span class="card-priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
        </div>
        <div class="card-title">${escapeHtml(ticket.title)}</div>
        <div class="card-meta">
            <span class="meta-item">🕐 ${timeAgo}</span>
            ${slaInfo.badge}
            ${ticket.escalated ? '<span class="escalated-badge">🚨 ESCALATED</span>' : ''}
        </div>
    `;
    
    card.addEventListener('click', () => openTicketDetail(ticket.id));
    
    return card;
}

// Get SLA information
function getSLAInfo(ticket) {
    if (!ticket.sla_deadline) {
        return { badge: '', remaining: null };
    }
    
    const deadline = new Date(ticket.sla_deadline);
    const now = new Date();
    const diffMs = deadline - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    let badge = '';
    let status = ticket.sla_status || 'On Track';
    
    if (status === 'Breached' || diffMins <= 0) {
        const overdue = Math.abs(diffMins);
        badge = `<span class="sla-badge sla-breached">🔴 ${overdue}m overdue</span>`;
    } else if (status === 'At Risk' || diffMins <= 2) {
        badge = `<span class="sla-badge sla-at-risk">🟡 ${diffMins}m left</span>`;
    } else {
        badge = `<span class="sla-badge sla-on-track">🟢 ${diffMins}m left</span>`;
    }
    
    return { badge, remaining: diffMins };
}

// Update statistics
function updateStats(tickets) {
    const myActive = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
    const escalated = tickets.filter(t => t.escalated).length;
    
    // Count resolved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = tickets.filter(t => {
        if (t.status !== 'Resolved') return false;
        const resolvedDate = new Date(t.updated_at);
        resolvedDate.setHours(0, 0, 0, 0);
        return resolvedDate.getTime() === today.getTime();
    }).length;
    
    document.getElementById('myTicketsCount').textContent = myActive;
    document.getElementById('escalatedCount').textContent = escalated;
    document.getElementById('resolvedTodayCount').textContent = resolvedToday;
}

// Open ticket detail panel
async function openTicketDetail(ticketId) {
    try {
        // First check if ticket requires forced update
        await checkIfBlocked(ticketId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load ticket details');
        
        const ticket = await response.json();
        currentTicket = ticket;
        
        renderTicketDetail(ticket);
        
        // Show detail panel
        document.getElementById('detailPanel').classList.add('active');
        
    } catch (error) {
        console.error('Error loading ticket detail:', error);
        showError('Failed to load ticket details');
    }
}

// Check if ticket requires forced update
async function checkIfBlocked(ticketId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${ticketId}/check-blocked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.requires_update) {
            // Show forced update modal
            showForcedUpdateModal(ticketId, data.escalation_reason);
            throw new Error('BLOCKED'); // Prevent detail panel from opening
        }
        
    } catch (error) {
        if (error.message === 'BLOCKED') {
            throw error;
        }
        console.error('Error checking blocked status:', error);
    }
}

// Show forced update modal
function showForcedUpdateModal(ticketId, reason) {
    const modal = document.getElementById('forcedUpdateModal');
    const reasonDiv = document.getElementById('escalationReason');
    
    reasonDiv.innerHTML = `<strong>Escalation Reason:</strong> ${escapeHtml(reason)}`;
    
    modal.classList.add('active');
    
    // Store ticket ID for submission
    modal.dataset.ticketId = ticketId;
}

// Submit forced update
async function submitForcedUpdate() {
    const modal = document.getElementById('forcedUpdateModal');
    const ticketId = modal.dataset.ticketId;
    const updateText = document.getElementById('forcedUpdateText').value.trim();
    const timeSpent = parseInt(document.getElementById('forcedTimeSpent').value);
    
    if (!updateText || !timeSpent) {
        showError('Please fill in all required fields');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${ticketId}/forced-update`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                update_text: updateText,
                time_spent: timeSpent
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit update');
        }
        
        // Close modal and reload
        modal.classList.remove('active');
        document.getElementById('forcedUpdateForm').reset();
        
        showSuccess('✅ Escalation update submitted successfully!');
        
        // Reload tickets
        await loadTickets();
        
        // Now open the ticket detail
        await openTicketDetail(ticketId);
        
    } catch (error) {
        console.error('Error submitting forced update:', error);
        showError(error.message);
    }
}

// Render ticket detail
function renderTicketDetail(ticket) {
    document.getElementById('detailTicketNumber').textContent = ticket.ticket_number;
    
    const slaInfo = getSLAInfo(ticket);
    
    const content = `
        <div class="detail-section">
            <h3>Ticket Information</h3>
            <div class="info-grid">
                <span class="info-label">Status:</span>
                <span class="info-value">${ticket.status}</span>
                
                <span class="info-label">Priority:</span>
                <span class="info-value">
                    <span class="card-priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                </span>
                
                <span class="info-label">Category:</span>
                <span class="info-value">${ticket.category}</span>
                
                <span class="info-label">SLA Status:</span>
                <span class="info-value">${slaInfo.badge}</span>
                
                <span class="info-label">Created:</span>
                <span class="info-value">${formatDateTime(ticket.created_at)}</span>
                
                <span class="info-label">Reported By:</span>
                <span class="info-value">${ticket.reported_by_name}</span>
                
                <span class="info-label">Email:</span>
                <span class="info-value">${ticket.reported_by_email}</span>
                
                <span class="info-label">Phone:</span>
                <span class="info-value">${ticket.reported_by_phone || 'N/A'}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Description</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; line-height: 1.6;">
                ${escapeHtml(ticket.description)}
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Timeline & Updates</h3>
            <div class="timeline" id="ticketTimeline">
                ${renderTimeline(ticket.updates || [])}
            </div>
        </div>
    `;
    
    document.getElementById('detailContent').innerHTML = content;
}

// Render timeline
function renderTimeline(updates) {
    if (!updates || updates.length === 0) {
        return '<p style="color: #666;">No updates yet.</p>';
    }
    
    return updates.map(update => {
        const isInternal = update.is_internal ? 'internal' : '';
        const internalLabel = update.is_internal ? '<span style="background: #ffc107; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">INTERNAL</span>' : '';
        
        let metaInfo = '';
        if (update.time_spent) {
            const hours = (update.time_spent / 60).toFixed(1);
            metaInfo += `<span>⏱️ Time: ${update.time_spent}min (${hours}h)</span>`;
        }
        if (update.reassign_reason) {
            metaInfo += `<span>🔄 Reassigned: ${escapeHtml(update.reassign_reason)}</span>`;
        }
        
        return `
            <div class="timeline-item ${isInternal}">
                <div class="timeline-header">
                    <span class="timeline-user">${update.user_name} ${internalLabel}</span>
                    <span class="timeline-time">${getTimeAgo(update.created_at)}</span>
                </div>
                <div class="timeline-text">${escapeHtml(update.update_text)}</div>
                ${metaInfo ? `<div class="timeline-meta">${metaInfo}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Close detail panel
function closeDetailPanel() {
    document.getElementById('detailPanel').classList.remove('active');
    currentTicket = null;
}

// Show update modal
function showUpdateModal() {
    if (!currentTicket) return;
    document.getElementById('updateModal').classList.add('active');
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
    document.getElementById('updateForm').reset();
}

// Submit regular update
async function submitUpdate() {
    if (!currentTicket) return;
    
    const updateText = document.getElementById('updateText').value.trim();
    
    if (!updateText) {
        showError('Please enter an update');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${currentTicket.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                update_text: updateText
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || error.detail || 'Failed to post update');
        }
        
        closeUpdateModal();
        showSuccess('✅ Update posted successfully!');
        
        // Reload ticket detail
        await openTicketDetail(currentTicket.id);
        
    } catch (error) {
        console.error('Error posting update:', error);
        showError(error.message);
    }
}

// Show time tracking modal
function showTimeModal() {
    if (!currentTicket) return;
    document.getElementById('timeModal').classList.add('active');
}

function closeTimeModal() {
    document.getElementById('timeModal').classList.remove('active');
    document.getElementById('timeForm').reset();
}

// Submit time tracking
async function submitTimeTracking() {
    if (!currentTicket) return;
    
    const timeSpent = parseInt(document.getElementById('timeSpent').value);
    const description = document.getElementById('timeDescription').value.trim();
    
    if (!timeSpent || !description) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${currentTicket.id}/time-tracking`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                update_text: description,
                time_spent: timeSpent
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to track time');
        }
        
        closeTimeModal();
        showSuccess('✅ Time tracked successfully!');
        
        // Reload ticket detail
        await openTicketDetail(currentTicket.id);
        
    } catch (error) {
        console.error('Error tracking time:', error);
        showError(error.message);
    }
}

// Load technicians for reassignment
async function loadTechnicians() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/users/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) return;
        
        const users = await response.json();
        technicians = users.filter(u => u.role === 'technician' && u.is_active);
        
        // Populate reassign dropdown
        const select = document.getElementById('reassignTechnician');
        if (select) {
            select.innerHTML = '<option value="">Select technician...</option>';
            technicians.forEach(tech => {
                select.innerHTML += `<option value="${tech.id}">${tech.full_name} (${tech.email})</option>`;
            });
        }
        
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

// Show reassign modal
function showReassignModal() {
    if (!currentTicket) return;
    document.getElementById('reassignModal').classList.add('active');
}

function closeReassignModal() {
    document.getElementById('reassignModal').classList.remove('active');
    document.getElementById('reassignForm').reset();
    document.getElementById('reasonCounter').textContent = '0 / 10 minimum';
    document.getElementById('reassignSubmitBtn').disabled = true;
}

// Update reason character counter
function updateReasonCounter() {
    const reason = document.getElementById('reassignReason').value;
    const counter = document.getElementById('reasonCounter');
    const submitBtn = document.getElementById('reassignSubmitBtn');
    
    const length = reason.trim().length;
    counter.textContent = `${length} / 10 minimum`;
    
    if (length >= 10) {
        counter.classList.remove('error');
        submitBtn.disabled = false;
    } else {
        counter.classList.add('error');
        submitBtn.disabled = true;
    }
}

// Submit reassignment
async function submitReassign() {
    if (!currentTicket) return;
    
    const newAssigneeId = parseInt(document.getElementById('reassignTechnician').value);
    const reason = document.getElementById('reassignReason').value.trim();
    
    if (!newAssigneeId || reason.length < 10) {
        showError('Please select a technician and provide a reason (min 10 characters)');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${currentTicket.id}/reassign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_assignee_id: newAssigneeId,
                reassign_reason: reason
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to reassign ticket');
        }
        
        closeReassignModal();
        closeDetailPanel();
        showSuccess('✅ Ticket reassigned successfully!');
        
        // Reload tickets
        await loadTickets();
        
    } catch (error) {
        console.error('Error reassigning ticket:', error);
        showError(error.message);
    }
}

// Drag and Drop functionality
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-cards');
    
    // Setup will be done after cards are rendered
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            draggedCard = e.target;
            e.target.classList.add('dragging');
        }
    });
    
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            e.target.classList.remove('dragging');
            draggedCard = null;
        }
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            if (afterElement == null) {
                column.appendChild(draggable);
            } else {
                column.insertBefore(draggable, afterElement);
            }
        });
        
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            const card = document.querySelector('.dragging');
            
            if (card) {
                const ticketId = card.dataset.ticketId;
                const newStatus = column.dataset.status;
                await updateTicketStatus(ticketId, newStatus);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update ticket status via drag-drop
async function updateTicketStatus(ticketId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || error.detail || 'Failed to update status');
        }
        
        showSuccess(`✅ Ticket moved to ${newStatus}`);
        await loadTickets();
        
    } catch (error) {
        console.error('Error updating ticket status:', error);
        showError(error.message);
        await loadTickets(); // Reload to revert
    }
}

// Utility functions
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    // Simple alert for now - could be replaced with toast notification
    alert(message);
}

function showError(message) {
    alert('❌ ' + message);
}
