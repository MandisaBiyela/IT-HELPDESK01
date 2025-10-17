// ICT Manager - View Only & Export Functionality
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
    console.log('[ICT Manager] Checking authentication...');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('user_role');
    const userName = localStorage.getItem('user_name');
    
    console.log('[ICT Manager] Token exists:', !!token);
    console.log('[ICT Manager] User role:', userRole);
    console.log('[ICT Manager] User name:', userName);
    
    if (!token) {
        console.log('[ICT Manager] No token found, redirecting to login');
        window.location.href = '/static/index.html';
        return;
    }
    if (userRole !== 'ict_manager') {
        console.log('[ICT Manager] Access denied for role:', userRole);
        alert('Access denied. This page is for ICT Managers only.');
        window.location.href = '/static/index.html';
        return;
    }
    console.log('[ICT Manager] Authentication successful');
    document.getElementById('userName').textContent = userName || 'ICT Manager';
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
    console.log('[ICT Manager] Loading data...');
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (currentFilters.date_from) params.append('start_date', currentFilters.date_from);
    if (currentFilters.date_to) params.append('end_date', currentFilters.date_to);

    console.log('[ICT Manager] Filters:', currentFilters);
    
    try {
        // Fetch BOTH statistics and tickets WITHOUT date filters to show ALL data
        console.log('[ICT Manager] Fetching statistics and tickets...');
        const [statsResponse, ticketsResponse] = await Promise.all([
            fetch(`${API_BASE}/reports/statistics`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/tickets`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        console.log('[ICT Manager] Stats response status:', statsResponse.status);
        console.log('[ICT Manager] Tickets response status:', ticketsResponse.status);

        const stats = await statsResponse.json();
        const tickets = await ticketsResponse.json();
        
        console.log('[ICT Manager] Stats:', stats);
        console.log('[ICT Manager] Tickets count:', tickets.length);
        
        allTickets = tickets;
        renderStatistics(stats);
        renderCharts(stats);
        renderTicketsTable(filterTickets(tickets));
        
        // Update last refresh time
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();
        console.log('[ICT Manager] Data loaded successfully');
    } catch (error) {
        console.error('[ICT Manager] Error loading data:', error);
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
    document.getElementById('avgResolutionTime').textContent = (stats.average_resolution_hours || 0).toFixed(2);
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
        }
    });
}

function renderTicketsTable(tickets) {
    document.getElementById('ticketCount').textContent = tickets.length;
    const container = document.getElementById('ticketsTableContainer');
    
    if (tickets.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">No tickets found</p>';
        return;
    }

    let html = '<table class="tickets-table"><thead><tr>';
    html += '<th>Ticket ID</th><th>Created</th><th>Summary</th><th>Priority</th><th>Status</th><th>Assignee</th></tr></thead><tbody>';
    
    tickets.forEach(t => {
        html += '<tr>';
        html += `<td>${t.ticket_number}</td>`;
        html += `<td>${new Date(t.created_at).toLocaleString()}</td>`;
        html += `<td>${t.problem_summary}</td>`;
        html += `<td><span class="priority-badge priority-${t.priority}">${t.priority.toUpperCase()}</span></td>`;
        html += `<td><span class="status-badge status-${t.status}">${t.status.replace('_', ' ').toUpperCase()}</span></td>`;
        // Use assignee object if available, fallback to assignee_name
        const assigneeName = t.assignee ? t.assignee.name : (t.assignee_name || 'Unassigned');
        html += `<td>${assigneeName}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
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
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error exporting CSV: ' + error.message);
    }
}
