// ICT Manager Dashboard - Analytics & Reporting
const API_BASE = 'http://localhost:8000/api';
let currentFilters = {
    date_from: null,
    date_to: null
};
let charts = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeDateFilters();
    loadAllData();
    
    // Auto-refresh every 60 seconds
    setInterval(loadAllData, 60000);
});

// Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/static/index.html';
        return;
    }
    
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'ict_manager' && userRole !== 'admin') {
        alert('Access denied. This page is for ICT Managers only.');
        window.location.href = '/static/index.html';
        return;
    }
    
    const userName = localStorage.getItem('user_name');
    document.getElementById('userName').textContent = userName || 'ICT Manager';
}

function logout() {
    localStorage.clear();
    window.location.href = '/static/index.html';
}

// Initialize date filters (last 30 days by default)
function initializeDateFilters() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    
    dateFromInput.value = formatDateForInput(thirtyDaysAgo);
    dateToInput.value = formatDateForInput(today);
    
    currentFilters.date_from = dateFromInput.value;
    currentFilters.date_to = dateToInput.value;
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Apply filters
function applyFilters() {
    currentFilters.date_from = document.getElementById('dateFrom').value;
    currentFilters.date_to = document.getElementById('dateTo').value;
    
    loadAllData();
}

function resetFilters() {
    initializeDateFilters();
    applyFilters();
}

// Load all dashboard data
async function loadAllData() {
    await Promise.all([
        loadKPIs(),
        loadEscalations(),
        loadAuditLogs(),
        loadTechnicianWorkload()
    ]);
}

// Load KPIs and render charts
async function loadKPIs() {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        
        if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
        if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);
        
        const response = await fetch(`${API_BASE}/reports/kpis?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load KPIs');
        
        const data = await response.json();
        
        renderKPIs(data.kpis);
        renderCharts(data.breakdowns);
        
    } catch (error) {
        console.error('Error loading KPIs:', error);
        showError('Failed to load KPI data');
    }
}

// Render KPI cards
function renderKPIs(kpis) {
    document.getElementById('totalTickets').textContent = kpis.total_tickets || 0;
    document.getElementById('openTickets').textContent = kpis.open_tickets || 0;
    document.getElementById('resolvedTickets').textContent = kpis.resolved_tickets || 0;
    
    const avgTime = kpis.avg_resolution_time_hours || 0;
    document.getElementById('avgResolutionTime').textContent = avgTime.toFixed(1);
    
    const breachPercent = kpis.sla_breach_percentage || 0;
    document.getElementById('slaBreachPercent').textContent = breachPercent.toFixed(1) + '%';
}

// Render charts
function renderCharts(breakdowns) {
    renderPriorityChart(breakdowns.by_priority || {});
    renderStatusChart(breakdowns.by_status || {});
}

// Priority Chart (Bar)
function renderPriorityChart(data) {
    const ctx = document.getElementById('priorityChart');
    
    // Destroy existing chart
    if (charts.priority) {
        charts.priority.destroy();
    }
    
    charts.priority = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Urgent', 'High', 'Normal', 'Low'],
            datasets: [{
                label: 'Tickets',
                data: [
                    data.Urgent || 0,
                    data.High || 0,
                    data.Normal || 0,
                    data.Low || 0
                ],
                backgroundColor: [
                    '#f44336',
                    '#ff9800',
                    '#0066cc',
                    '#4caf50'
                ],
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' tickets';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Status Chart (Doughnut)
function renderStatusChart(data) {
    const ctx = document.getElementById('statusChart');
    
    // Destroy existing chart
    if (charts.status) {
        charts.status.destroy();
    }
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#0066cc',
                    '#ff9800',
                    '#9c27b0',
                    '#4caf50',
                    '#f44336'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Load escalations
async function loadEscalations() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/escalations?status_filter=Open`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load escalations');
        
        const data = await response.json();
        
        renderEscalations(data.escalations || []);
        
        document.getElementById('escalationCount').textContent = 
            `${data.total || 0} active escalations`;
        
    } catch (error) {
        console.error('Error loading escalations:', error);
        document.getElementById('escalationsList').innerHTML = 
            '<div class="empty-state">Failed to load escalations</div>';
    }
}

// Render escalations list
function renderEscalations(escalations) {
    const container = document.getElementById('escalationsList');
    
    if (escalations.length === 0) {
        container.innerHTML = '<div class="empty-state">✅ No active escalations</div>';
        return;
    }
    
    container.innerHTML = escalations.map(esc => `
        <div class="escalation-item">
            <div class="escalation-header">
                <span class="escalation-ticket">${esc.ticket_number}</span>
                <span class="escalation-time">${esc.time_since_escalation}</span>
            </div>
            <div class="escalation-details">
                <strong>${escapeHtml(esc.title)}</strong>
            </div>
            <div class="escalation-assignee">
                👤 Assigned to: ${esc.assignee_name}
                ${esc.requires_update ? '<span style="color: #f44336; margin-left: 10px;">⚠️ Update Required</span>' : ''}
            </div>
        </div>
    `).join('');
}

// Load technician workload
async function loadTechnicianWorkload() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/technicians/workload`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load workload data');
        
        const data = await response.json();
        
        renderTechnicianWorkload(data.technicians || []);
        
    } catch (error) {
        console.error('Error loading technician workload:', error);
        document.getElementById('workloadGrid').innerHTML = 
            '<div class="empty-state">Failed to load technician data</div>';
    }
}

// Render technician workload
function renderTechnicianWorkload(technicians) {
    const container = document.getElementById('workloadGrid');
    
    if (technicians.length === 0) {
        container.innerHTML = '<div class="empty-state">No technician data available</div>';
        return;
    }
    
    container.innerHTML = technicians.map(tech => {
        const loadClass = tech.load_status || 'available';
        
        return `
            <div class="tech-card ${loadClass}">
                <div class="tech-name">${tech.technician_name}</div>
                <div class="tech-stats">
                    <div class="tech-stat">
                        <span class="tech-stat-label">Active:</span>
                        <span class="tech-stat-value">${tech.active_tickets}</span>
                    </div>
                    <div class="tech-stat">
                        <span class="tech-stat-label">Escalated:</span>
                        <span class="tech-stat-value">${tech.escalated_tickets}</span>
                    </div>
                    <div class="tech-stat" style="grid-column: 1 / -1;">
                        <span class="tech-stat-label">Resolved (30d):</span>
                        <span class="tech-stat-value">${tech.resolved_this_month}</span>
                    </div>
                </div>
                <span class="load-badge load-${loadClass}">
                    ${loadClass.toUpperCase()}
                </span>
            </div>
        `;
    }).join('');
}

// Load audit logs
async function loadAuditLogs() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/audit-logs?limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load audit logs');
        
        const data = await response.json();
        
        renderAuditLogs(data.logs || []);
        
    } catch (error) {
        console.error('Error loading audit logs:', error);
        document.getElementById('auditLogList').innerHTML = 
            '<div class="empty-state">Failed to load audit logs</div>';
    }
}

// Render audit logs
function renderAuditLogs(logs) {
    const container = document.getElementById('auditLogList');
    
    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state">No audit logs available</div>';
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const isCritical = ['sla_escalated', 'ticket_reassigned'].includes(log.action);
        const criticalClass = isCritical ? 'critical' : '';
        
        return `
            <div class="audit-item ${criticalClass}">
                <div class="audit-header">
                    <span class="audit-user">${log.user_name || 'System'}</span>
                    <span class="audit-time">${getTimeAgo(log.created_at)}</span>
                </div>
                <div class="audit-action">
                    ${formatAuditAction(log.action, log.entity_type)}
                    ${log.entity_type === 'ticket' ? ` - Ticket #${log.entity_id}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Format audit action
function formatAuditAction(action, entityType) {
    const actions = {
        'created': '➕ Created',
        'updated': '✏️ Updated',
        'status_changed': '🔄 Status Changed',
        'assigned': '👤 Assigned',
        'sla_escalated': '🚨 SLA Escalated',
        'ticket_reassigned': '🔄 Reassigned',
        'forced_update': '⚠️ Forced Update',
        'time_tracked': '⏱️ Time Tracked'
    };
    
    return actions[action] || action;
}

// Export to CSV
async function exportToCSV() {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        
        if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
        if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);
        
        const response = await fetch(`${API_BASE}/reports/export?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to export data');
        
        // Get filename from response header
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'tickets_export.csv';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) filename = match[1];
        }
        
        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccess('✅ CSV exported successfully!');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showError('Failed to export data');
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert('❌ ' + message);
}
