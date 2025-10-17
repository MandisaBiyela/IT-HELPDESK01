// ICT GM Reports - Real-time Analytics with Auto-Refresh
const API_BASE = 'http://localhost:8000/api';
let currentFilters = { date_from: null, date_to: null, status: '', priority: '' };
let allTickets = [];
let charts = {};
let refreshInterval;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeDateFilters();
    loadData();
    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(() => {
        loadData();
    }, 30000);
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/static/index.html';
        return;
    }
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'ict_gm') {
        alert('Access denied. This page is for ICT General Managers only.');
        window.location.href = '/static/index.html';
        return;
    }
    document.getElementById('userName').textContent = localStorage.getItem('user_name') || 'ICT GM';
}

function logout() {
    // Clear refresh interval before logout
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    localStorage.clear();
    window.location.href = '/static/index.html';
}

function initializeDateFilters() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    document.getElementById('dateFrom').value = formatDateForInput(thirtyDaysAgo);
    document.getElementById('dateTo').value = formatDateForInput(today);
    currentFilters.date_from = document.getElementById('dateFrom').value;
    currentFilters.date_to = document.getElementById('dateTo').value;
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function applyFilters() {
    currentFilters.date_from = document.getElementById('dateFrom').value;
    currentFilters.date_to = document.getElementById('dateTo').value;
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.priority = document.getElementById('priorityFilter').value;
    loadData();
}

function resetFilters() {
    initializeDateFilters();
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    currentFilters.status = '';
    currentFilters.priority = '';
    applyFilters();
}

async function loadData() {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (currentFilters.date_from) params.append('start_date', currentFilters.date_from);
    if (currentFilters.date_to) params.append('end_date', currentFilters.date_to);

    try {
        const [statsResponse, ticketsResponse] = await Promise.all([
            fetch(`${API_BASE}/reports/statistics?${params}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/tickets?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!statsResponse.ok || !ticketsResponse.ok) {
            throw new Error('Failed to load data');
        }

        const stats = await statsResponse.json();
        const tickets = await ticketsResponse.json();
        
        allTickets = tickets;
        renderStatistics(stats);
        renderCharts(stats);
        renderTicketsTable(filterTickets(tickets));
        
        // Update last refresh time
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('lastUpdated').textContent = 'Error loading data';
    }
}

function filterTickets(tickets) {
    return tickets.filter(t => {
        if (currentFilters.status && t.status !== currentFilters.status) return false;
        if (currentFilters.priority && t.priority !== currentFilters.priority) return false;
        return true;
    });
}

function renderStatistics(stats) {
    document.getElementById('totalTickets').textContent = stats.total_tickets || 0;
    document.getElementById('resolvedTickets').textContent = stats.status_breakdown.resolved || 0;
    document.getElementById('inProgressTickets').textContent = stats.status_breakdown.in_progress || 0;
    document.getElementById('waitingTickets').textContent = stats.status_breakdown.waiting_on_user || 0;
    document.getElementById('escalatedTickets').textContent = stats.escalated_count || 0;
    document.getElementById('avgResolutionTime').textContent = stats.average_resolution_hours || 0;
}

function renderCharts(stats) {
    const statusCtx = document.getElementById('statusChart');
    const priorityCtx = document.getElementById('priorityChart');

    if (charts.status) charts.status.destroy();
    if (charts.priority) charts.priority.destroy();

    charts.status = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed'],
            datasets: [{
                data: [
                    stats.status_breakdown.open || 0,
                    stats.status_breakdown.in_progress || 0,
                    stats.status_breakdown.waiting_on_user || 0,
                    stats.status_breakdown.resolved || 0,
                    stats.status_breakdown.closed || 0
                ],
                backgroundColor: ['#0066cc', '#ff9800', '#ffd700', '#4caf50', '#666']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    charts.priority = new Chart(priorityCtx, {
        type: 'bar',
        data: {
            labels: ['Urgent', 'High', 'Normal'],
            datasets: [{
                label: 'Tickets',
                data: [
                    stats.priority_breakdown.urgent || 0,
                    stats.priority_breakdown.high || 0,
                    stats.priority_breakdown.normal || 0
                ],
                backgroundColor: ['#f44336', '#ff9800', '#0066cc']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
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

function renderTicketsTable(tickets) {
    document.getElementById('ticketCount').textContent = tickets.length;
    const container = document.getElementById('ticketsTableContainer');
    
    if (tickets.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">No tickets found for the selected filters</p>';
        return;
    }

    let html = '<table class="tickets-table"><thead><tr>';
    html += '<th>Ticket ID</th><th>Created</th><th>Summary</th><th>Priority</th><th>Status</th><th>Assignee</th></tr></thead><tbody>';
    
    tickets.forEach(t => {
        html += '<tr>';
        html += `<td><strong>${t.ticket_number}</strong></td>`;
        html += `<td>${new Date(t.created_at).toLocaleString()}</td>`;
        html += `<td>${escapeHtml(t.problem_summary)}</td>`;
        html += `<td><span class="priority-badge priority-${t.priority}">${t.priority.toUpperCase()}</span></td>`;
        html += `<td><span class="status-badge status-${t.status}">${t.status.replace(/_/g, ' ').toUpperCase()}</span></td>`;
        // Use assignee object if available, fallback to assignee_name
        const assigneeName = t.assignee ? t.assignee.name : (t.assignee_name || 'Unassigned');
        html += `<td>${escapeHtml(assigneeName)}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function exportToCSV() {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (currentFilters.date_from) params.append('start_date', currentFilters.date_from);
    if (currentFilters.date_to) params.append('end_date', currentFilters.date_to);
    if (currentFilters.status) params.append('status', currentFilters.status);
    if (currentFilters.priority) params.append('priority', currentFilters.priority);

    try {
        const response = await fetch(`${API_BASE}/reports/tickets/export?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ndabase_tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        // Show success message
        showNotification('CSV exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting CSV: ' + error.message, 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#0066cc'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
