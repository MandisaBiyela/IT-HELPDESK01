// ICT GM Dashboard - Executive Oversight
const API_BASE = 'http://localhost:8000/api';
let allEscalations = [];
let currentFilter = 'all';
let selectedTicket = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    
    // Auto-refresh every 60 seconds
    setInterval(() => {
        loadDashboardData();
    }, 60000);
});

// Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/static/index.html';
        return;
    }
    
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'ict_gm' && userRole !== 'admin') {
        alert('Access denied. This page is for ICT General Manager only.');
        window.location.href = '/static/index.html';
        return;
    }
    
    const userName = localStorage.getItem('user_name');
    document.getElementById('userName').textContent = userName || 'ICT GM';
}

function logout() {
    localStorage.clear();
    window.location.href = '/static/index.html';
}

// Load all dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadKPIs(),
        loadEscalations()
    ]);
}

// Load KPIs
async function loadKPIs() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/reports/kpis`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load KPIs');
        
        const data = await response.json();
        const kpis = data.kpis;
        
        // Update KPI cards
        document.getElementById('totalTickets').textContent = kpis.total_tickets || 0;
        document.getElementById('activeEscalations').textContent = kpis.current_escalations || 0;
        
        const avgTime = kpis.avg_resolution_time_hours || 0;
        document.getElementById('avgResolutionTime').textContent = avgTime.toFixed(1);
        
        // Calculate SLA compliance (100% - breach%)
        const breachPercent = kpis.sla_breach_percentage || 0;
        const compliance = 100 - breachPercent;
        document.getElementById('slaCompliance').textContent = compliance.toFixed(1) + '%';
        
    } catch (error) {
        console.error('Error loading KPIs:', error);
    }
}

// Load escalations
async function loadEscalations() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/escalations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load escalations');
        
        const data = await response.json();
        allEscalations = data.escalations || [];
        
        renderEscalations();
        
    } catch (error) {
        console.error('Error loading escalations:', error);
        document.getElementById('escalationsFeed').innerHTML = 
            '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">Failed to load escalations</div></div>';
    }
}

// Filter escalations
function filterEscalations(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter${capitalize(filter)}`).classList.add('active');
    
    renderEscalations();
}

// Render escalations based on current filter
function renderEscalations() {
    const container = document.getElementById('escalationsFeed');
    
    let filtered = allEscalations;
    
    if (currentFilter === 'pending') {
        filtered = allEscalations.filter(esc => !esc.gm_acknowledged);
    } else if (currentFilter === 'acknowledged') {
        filtered = allEscalations.filter(esc => esc.gm_acknowledged);
    }
    
    if (filtered.length === 0) {
        const message = currentFilter === 'pending' 
            ? '✅ All escalations have been acknowledged'
            : currentFilter === 'acknowledged'
            ? 'No acknowledged escalations'
            : '✅ No active escalations';
            
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
        return;
    }
    
    // Sort by escalation time (most recent first)
    filtered.sort((a, b) => new Date(b.escalated_at) - new Date(a.escalated_at));
    
    container.innerHTML = filtered.map(esc => renderEscalationCard(esc)).join('');
}

// Render individual escalation card
function renderEscalationCard(esc) {
    const acknowledgedClass = esc.gm_acknowledged ? 'acknowledged' : '';
    
    return `
        <div class="escalation-card ${acknowledgedClass}">
            <div class="escalation-top">
                <span class="escalation-number">${esc.ticket_number}</span>
                <span class="escalation-priority priority-${esc.priority.toLowerCase()}">${esc.priority}</span>
            </div>
            
            <div class="escalation-title">${escapeHtml(esc.title)}</div>
            
            <div style="margin-bottom: 12px;">
                <span class="escalation-time">⏰ Escalated ${esc.time_since_escalation}</span>
                ${esc.requires_update ? '<span class="update-required-badge" style="margin-left: 10px;">⚠️ Update Required</span>' : ''}
                ${esc.gm_acknowledged ? '<span class="acknowledged-badge" style="margin-left: 10px;">✅ Acknowledged</span>' : ''}
            </div>
            
            <div class="escalation-meta">
                <div class="meta-row">
                    <span class="meta-label">Status:</span>
                    <span class="meta-value">${esc.status}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Assigned To:</span>
                    <span class="meta-value">${esc.assignee_name}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Category:</span>
                    <span class="meta-value">${esc.category}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Reported By:</span>
                    <span class="meta-value">${esc.reported_by_name}</span>
                </div>
            </div>
            
            <div class="escalation-actions">
                <button class="action-btn btn-view" onclick="viewTicketDetail('${esc.ticket_number}', ${esc.ticket_id})">
                    👁️ View Details
                </button>
                <button class="action-btn btn-acknowledge" 
                        onclick="showAcknowledgeModal(${esc.ticket_id}, '${esc.ticket_number}')"
                        ${esc.gm_acknowledged ? 'disabled' : ''}>
                    ${esc.gm_acknowledged ? '✅ Acknowledged' : '✅ Acknowledge'}
                </button>
            </div>
        </div>
    `;
}

// View ticket detail
async function viewTicketDetail(ticketNumber, ticketId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load ticket details');
        
        const ticket = await response.json();
        
        document.getElementById('modalTicketNumber').textContent = ticketNumber;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-section">
                <h4>Ticket Information</h4>
                <div class="info-grid">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${ticket.status}</span>
                    
                    <span class="info-label">Priority:</span>
                    <span class="info-value">
                        <span class="escalation-priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                    </span>
                    
                    <span class="info-label">Category:</span>
                    <span class="info-value">${ticket.category}</span>
                    
                    <span class="info-label">Created:</span>
                    <span class="info-value">${formatDateTime(ticket.created_at)}</span>
                    
                    <span class="info-label">SLA Deadline:</span>
                    <span class="info-value">${ticket.sla_deadline ? formatDateTime(ticket.sla_deadline) : 'N/A'}</span>
                    
                    <span class="info-label">Assigned To:</span>
                    <span class="info-value">${ticket.assignee_name}</span>
                    
                    <span class="info-label">Reported By:</span>
                    <span class="info-value">${ticket.reported_by_name}</span>
                    
                    <span class="info-label">Email:</span>
                    <span class="info-value">${ticket.reported_by_email}</span>
                    
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${ticket.reported_by_phone || 'N/A'}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Description</h4>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; line-height: 1.6;">
                    ${escapeHtml(ticket.description)}
                </div>
            </div>
            
            ${ticket.updates && ticket.updates.length > 0 ? `
                <div class="detail-section">
                    <h4>Recent Updates (${ticket.updates.length})</h4>
                    ${renderUpdates(ticket.updates.slice(0, 5))}
                </div>
            ` : ''}
        `;
        
        document.getElementById('ticketModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading ticket details:', error);
        showError('Failed to load ticket details');
    }
}

// Render updates
function renderUpdates(updates) {
    return updates.map(update => {
        const timeTracked = update.time_spent ? `⏱️ ${update.time_spent}min` : '';
        
        return `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                    <span style="font-weight: 600;">${update.user_name}</span>
                    <span style="color: #666;">${getTimeAgo(update.created_at)} ${timeTracked}</span>
                </div>
                <div style="font-size: 14px; color: #444; line-height: 1.5;">
                    ${escapeHtml(update.update_text)}
                </div>
            </div>
        `;
    }).join('');
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
}

// Show acknowledge modal
function showAcknowledgeModal(ticketId, ticketNumber) {
    selectedTicket = { id: ticketId, number: ticketNumber };
    document.getElementById('acknowledgeModal').classList.add('active');
}

function closeAcknowledgeModal() {
    document.getElementById('acknowledgeModal').classList.remove('active');
    document.getElementById('acknowledgeForm').reset();
    selectedTicket = null;
}

// Submit acknowledgment
async function submitAcknowledgment() {
    if (!selectedTicket) return;
    
    const note = document.getElementById('acknowledgmentNote').value.trim();
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/escalations/${selectedTicket.id}/acknowledge`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                acknowledgment_note: note || undefined
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to acknowledge escalation');
        }
        
        closeAcknowledgeModal();
        showSuccess(`✅ Escalation ${selectedTicket.number} acknowledged successfully!`);
        
        // Reload data
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error acknowledging escalation:', error);
        showError(error.message);
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

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert('❌ ' + message);
}
