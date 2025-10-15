// API Base URL
const API_BASE = '';

// State
let token = localStorage.getItem('token');
let currentUser = null;
let allUsers = [];
let tickets = [];

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        loadDashboard();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            switchSection(page);
        });
    });
    
    // Create Ticket
    document.getElementById('createTicketForm').addEventListener('submit', handleCreateTicket);
    
    // Filters
    document.getElementById('filterStatus').addEventListener('change', loadTickets);
    document.getElementById('filterPriority').addEventListener('change', loadTickets);
    document.getElementById('refreshTickets').addEventListener('click', loadTickets);
    
    // Reports
    document.getElementById('loadStats').addEventListener('click', loadStatistics);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    
    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.id === 'ticketModal') {
            closeModal();
        }
    });
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const loginError = document.getElementById('loginError');
    loginError.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        
        await loadDashboard();
    } catch (error) {
        loginError.textContent = error.message;
    }
}

function handleLogout() {
    token = null;
    localStorage.removeItem('token');
    showLogin();
}

function showLogin() {
    loginPage.style.display = 'block';
    dashboardPage.style.display = 'none';
}

async function loadDashboard() {
    try {
        // Get current user
        currentUser = await apiGet('/api/auth/me');
        userName.textContent = currentUser.name;
        
        // Load users for assignee dropdown
        allUsers = await apiGet('/api/auth/users');
        populateAssigneeDropdown();
        
        // Show/hide menu items based on role
        updateMenuForRole();
        
        // Show dashboard
        loginPage.style.display = 'none';
        dashboardPage.style.display = 'block';
        
        // Load tickets
        await loadTickets();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        handleLogout();
    }
}

function updateMenuForRole() {
    // Show user role badge
    const userRoleBadge = document.getElementById('userRole');
    if (userRoleBadge) {
        userRoleBadge.textContent = currentUser.role.replace('_', ' ');
    }
    
    // Update welcome name
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
        welcomeName.textContent = currentUser.name;
    }
    
    // Only helpdesk officers and admins can create tickets
    const createNavLink = document.querySelector('[data-page="create"]');
    if (currentUser.role === 'helpdesk_officer' || currentUser.role === 'admin') {
        if (createNavLink) createNavLink.style.display = 'inline-block';
    } else {
        if (createNavLink) createNavLink.style.display = 'none';
    }
    
    // Only admins can view reports
    const reportsNavLink = document.querySelector('[data-page="reports"]');
    if (currentUser.role === 'admin') {
        if (reportsNavLink) reportsNavLink.style.display = 'inline-block';
    } else {
        if (reportsNavLink) reportsNavLink.style.display = 'none';
    }
    
    // Admins and technicians can manage users
    const usersNavLink = document.querySelector('[data-page="users"]');
    if (currentUser.role === 'admin' || currentUser.role === 'technician') {
        if (usersNavLink) usersNavLink.style.display = 'inline-block';
    } else {
        if (usersNavLink) usersNavLink.style.display = 'none';
    }
    
    // Load role-specific dashboard
    loadRoleDashboard();
}

// Navigation
function switchSection(sectionName) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === sectionName) {
            link.classList.add('active');
        }
    });
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const sectionMap = {
        'dashboard': 'dashboardSection',
        'tickets': 'ticketsSection',
        'create': 'createSection',
        'users': 'usersSection',
        'reports': 'reportsSection'
    };
    
    const targetSection = document.getElementById(sectionMap[sectionName]);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Tickets
async function loadTickets() {
    try {
        const status = document.getElementById('filterStatus').value;
        const priority = document.getElementById('filterPriority').value;
        
        let url = '/api/tickets?';
        if (status) url += `status=${encodeURIComponent(status)}&`;
        if (priority) url += `priority=${encodeURIComponent(priority)}&`;
        
        tickets = await apiGet(url);
        displayTickets(tickets);
    } catch (error) {
        console.error('Failed to load tickets:', error);
    }
}

function displayTickets(ticketList) {
    const container = document.getElementById('ticketsList');
    
    if (ticketList.length === 0) {
        container.innerHTML = '<p>No tickets found</p>';
        return;
    }
    
    container.innerHTML = ticketList.map(ticket => `
        <div class="ticket-card priority-${ticket.priority}" onclick="openTicket('${ticket.ticket_number}')">
            <div class="ticket-header">
                <span class="ticket-number">${ticket.ticket_number}</span>
                <div class="ticket-badges">
                    <span class="badge badge-priority-${ticket.priority}">${ticket.priority}</span>
                    <span class="badge badge-status-${ticket.status.replace(' ', '-')}">${ticket.status}</span>
                </div>
            </div>
            <div class="ticket-info">
                <p><strong>${ticket.problem_summary}</strong></p>
                <p>User: ${ticket.user_name}</p>
                <p>Assigned to: ${ticket.assignee_name}</p>
                <p>Created: ${formatDate(ticket.created_at)}</p>
                <p>SLA Deadline: ${formatDate(ticket.sla_deadline)}</p>
            </div>
        </div>
    `).join('');
}

async function openTicket(ticketNumber) {
    try {
        const ticket = await apiGet(`/api/tickets/${ticketNumber}`);
        displayTicketDetail(ticket);
    } catch (error) {
        console.error('Failed to load ticket:', error);
        alert('Failed to load ticket details');
    }
}

function displayTicketDetail(ticket) {
    const modal = document.getElementById('ticketModal');
    const detail = document.getElementById('ticketDetail');
    
    const requiresUpdate = ticket.requires_update ? 
        '<div class="alert alert-danger"><strong>⚠️ COMPULSORY UPDATE REQUIRED</strong><br>This ticket requires an update before any other action can be taken.</div>' : '';
    
    const escalated = ticket.escalated ? 
        '<div class="alert alert-warning"><strong>🚨 ESCALATED</strong><br>This ticket has been escalated due to SLA breach.</div>' : '';
    
    detail.innerHTML = `
        <div class="ticket-detail-header">
            <h2>${ticket.ticket_number}</h2>
            <div class="ticket-badges">
                <span class="badge badge-priority-${ticket.priority}">${ticket.priority}</span>
                <span class="badge badge-status-${ticket.status.replace(' ', '-')}">${ticket.status}</span>
            </div>
        </div>
        
        ${requiresUpdate}
        ${escalated}
        
        <div class="ticket-detail-info">
            <div class="info-item">
                <div class="info-label">User Name</div>
                <div class="info-value">${ticket.user_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">User Email</div>
                <div class="info-value">${ticket.user_email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">User Phone</div>
                <div class="info-value">${ticket.user_phone}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Assigned To</div>
                <div class="info-value">${ticket.assignee_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Created</div>
                <div class="info-value">${formatDate(ticket.created_at)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">SLA Deadline</div>
                <div class="info-value">${formatDate(ticket.sla_deadline)}</div>
            </div>
        </div>
        
        <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Problem Summary</div>
            <div class="info-value">${ticket.problem_summary}</div>
        </div>
        
        ${ticket.problem_description ? `
        <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Description</div>
            <div class="info-value">${ticket.problem_description}</div>
        </div>
        ` : ''}
        
        <div class="ticket-updates">
            <h3>Updates History</h3>
            ${ticket.updates.length > 0 ? ticket.updates.map(update => `
                <div class="update-item">
                    <div class="update-header">
                        <strong>${update.updated_by_name}</strong>
                        <span>${formatDate(update.created_at)}</span>
                    </div>
                    <div class="update-text">${update.update_text}</div>
                    ${update.new_status ? `<div style="margin-top: 10px; font-size: 12px; color: #666;">Status: ${update.old_status} → ${update.new_status}</div>` : ''}
                    ${update.new_priority ? `<div style="margin-top: 5px; font-size: 12px; color: #666;">Priority: ${update.old_priority} → ${update.new_priority}</div>` : ''}
                </div>
            `).join('') : '<p>No updates yet</p>'}
        </div>
        
        <div class="update-form">
            <h3>Update Ticket</h3>
            <form id="updateTicketForm" onsubmit="handleUpdateTicket(event, '${ticket.ticket_number}')">
                <div class="form-row">
                    <div class="form-group">
                        <label>Status</label>
                        <select id="updateStatus">
                            <option value="">Keep Current</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="updatePriority">
                            <option value="">Keep Current</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Reassign To</label>
                    <select id="updateAssignee">
                        <option value="">Keep Current Assignee</option>
                        ${allUsers.map(user => `<option value="${user.id}">${user.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Update Description ${ticket.requires_update ? '(REQUIRED)' : ''}</label>
                    <textarea id="updateText" rows="3" ${ticket.requires_update ? 'required' : ''}></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Update Ticket</button>
            </form>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('ticketModal').style.display = 'none';
}

async function handleUpdateTicket(e, ticketNumber) {
    e.preventDefault();
    
    const status = document.getElementById('updateStatus').value;
    const priority = document.getElementById('updatePriority').value;
    const assigneeId = document.getElementById('updateAssignee').value;
    const updateText = document.getElementById('updateText').value;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigneeId) updateData.assignee_id = parseInt(assigneeId);
    if (updateText) updateData.update_text = updateText;
    
    try {
        await apiPatch(`/api/tickets/${ticketNumber}`, updateData);
        alert('Ticket updated successfully');
        closeModal();
        await loadTickets();
    } catch (error) {
        alert('Failed to update ticket: ' + error.message);
    }
}

// Create Ticket
function populateAssigneeDropdown() {
    const select = document.getElementById('assignee');
    select.innerHTML = allUsers.map(user => 
        `<option value="${user.id}">${user.name} (${user.role})</option>`
    ).join('');
}

async function handleCreateTicket(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('createError');
    const successDiv = document.getElementById('createSuccess');
    errorDiv.textContent = '';
    successDiv.textContent = '';
    
    const ticketData = {
        user_name: document.getElementById('ticketUserName').value,
        user_email: document.getElementById('userEmail').value,
        user_phone: document.getElementById('userPhone').value,
        problem_summary: document.getElementById('problemSummary').value,
        problem_description: document.getElementById('problemDescription').value,
        priority: document.getElementById('priority').value,
        assignee_id: parseInt(document.getElementById('assignee').value)
    };
    
    try {
        const result = await apiPost('/api/tickets', ticketData);
        successDiv.textContent = `Ticket ${result.ticket_number} created successfully!`;
        e.target.reset();
        
        // Reload tickets
        await loadTickets();
        
        // Switch to tickets view after 2 seconds
        setTimeout(() => {
            switchSection('tickets');
        }, 2000);
    } catch (error) {
        errorDiv.textContent = 'Failed to create ticket: ' + error.message;
    }
}

// Reports
async function loadStatistics() {
    try {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        let url = '/api/reports/statistics?';
        if (startDate) url += `start_date=${encodeURIComponent(startDate)}&`;
        if (endDate) url += `end_date=${encodeURIComponent(endDate)}&`;
        
        const stats = await apiGet(url);
        displayStatistics(stats);
    } catch (error) {
        console.error('Failed to load statistics:', error);
        alert('Failed to load statistics');
    }
}

function displayStatistics(stats) {
    const container = document.getElementById('statisticsDisplay');
    
    container.innerHTML = `
        <div class="stat-card">
            <h3>Overall Statistics</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.total_tickets}</div>
                    <div class="stat-label">Total Tickets</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.escalated_count}</div>
                    <div class="stat-label">Escalated</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.average_resolution_hours}</div>
                    <div class="stat-label">Avg Resolution (hrs)</div>
                </div>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>Status Breakdown</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.status_breakdown.open}</div>
                    <div class="stat-label">Open</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.status_breakdown.in_progress}</div>
                    <div class="stat-label">In Progress</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.status_breakdown.resolved}</div>
                    <div class="stat-label">Resolved</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.status_breakdown.closed}</div>
                    <div class="stat-label">Closed</div>
                </div>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>Priority Breakdown</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.priority_breakdown.urgent}</div>
                    <div class="stat-label">Urgent</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.priority_breakdown.high}</div>
                    <div class="stat-label">High</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.priority_breakdown.normal}</div>
                    <div class="stat-label">Normal</div>
                </div>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>Technician Performance</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left;">Technician</th>
                            <th style="padding: 10px; text-align: center;">Total</th>
                            <th style="padding: 10px; text-align: center;">In Progress</th>
                            <th style="padding: 10px; text-align: center;">Resolved</th>
                            <th style="padding: 10px; text-align: center;">Escalated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(stats.assignee_performance).map(([name, data]) => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px;">${name}</td>
                                <td style="padding: 10px; text-align: center;">${data.total}</td>
                                <td style="padding: 10px; text-align: center;">${data.in_progress}</td>
                                <td style="padding: 10px; text-align: center;">${data.resolved}</td>
                                <td style="padding: 10px; text-align: center;">${data.escalated}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function exportToCSV() {
    try {
        const status = document.getElementById('filterStatus').value;
        const priority = document.getElementById('filterPriority').value;
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        let url = '/api/reports/tickets/export?';
        if (status) url += `status=${encodeURIComponent(status)}&`;
        if (priority) url += `priority=${encodeURIComponent(priority)}&`;
        if (startDate) url += `start_date=${encodeURIComponent(startDate)}&`;
        if (endDate) url += `end_date=${encodeURIComponent(endDate)}&`;
        
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        alert('Failed to export CSV: ' + error.message);
    }
}

// API Helpers
async function apiGet(url) {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
    }
    
    return await response.json();
}

async function apiPost(url, data) {
    const response = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        // Handle different error formats
        let errorMessage = 'Request failed';
        if (typeof error.detail === 'string') {
            errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else if (error.detail) {
            errorMessage = JSON.stringify(error.detail);
        }
        throw new Error(errorMessage);
    }
    
    return await response.json();
}

async function apiPatch(url, data) {
    const response = await fetch(`${API_BASE}${url}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
    }
    
    return await response.json();
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Role-Specific Dashboard Functions
function loadRoleDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) return;
    
    if (currentUser.role === 'admin') {
        loadAdminDashboard();
    } else if (currentUser.role === 'helpdesk_officer') {
        loadHelpdeskDashboard();
    } else if (currentUser.role === 'technician') {
        loadTechnicianDashboard();
    }
}

async function loadAdminDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Total Tickets</h3>
                <div class="number" id="totalTickets">-</div>
                <div class="subtitle">All time</div>
            </div>
            <div class="dashboard-card orange">
                <h3>Open Tickets</h3>
                <div class="number" id="openTickets">-</div>
                <div class="subtitle">Requires attention</div>
            </div>
            <div class="dashboard-card green">
                <h3>Resolved Today</h3>
                <div class="number" id="resolvedToday">-</div>
                <div class="subtitle">Last 24 hours</div>
            </div>
            <div class="dashboard-card red">
                <h3>Urgent</h3>
                <div class="number" id="urgentTickets">-</div>
                <div class="subtitle">High priority</div>
            </div>
        </div>
        <h3 style="margin-top: 30px;">Recent Tickets</h3>
        <div id="recentTickets"></div>
    `;
    
    // Load stats
    try {
        const stats = await apiGet('/api/reports/statistics');
        document.getElementById('totalTickets').textContent = stats.total_tickets || 0;
        document.getElementById('openTickets').textContent = stats.open_tickets || 0;
        document.getElementById('resolvedToday').textContent = stats.resolved_today || 0;
        document.getElementById('urgentTickets').textContent = stats.urgent_tickets || 0;
        
        // Load recent tickets
        const recentTickets = tickets.slice(0, 5); // Show latest 5
        displayDashboardTickets(recentTickets, 'recentTickets');
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadHelpdeskDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Tickets Created</h3>
                <div class="number" id="createdTickets">-</div>
                <div class="subtitle">By you</div>
            </div>
            <div class="dashboard-card orange">
                <h3>Pending</h3>
                <div class="number" id="pendingTickets">-</div>
                <div class="subtitle">In Progress</div>
            </div>
        </div>
        <div style="margin-top: 30px;">
            <h3>Quick Actions</h3>
            <button onclick="switchSection('create')" class="btn btn-primary" style="width: auto; margin-top: 10px;">+ Create New Ticket</button>
        </div>
        <h3 style="margin-top: 30px;">Recent Tickets</h3>
        <div id="helpdeskRecentTickets"></div>
    `;
    
    // Calculate stats
    const createdByMe = tickets.length; // In a real app, filter by creator
    const pending = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    
    document.getElementById('createdTickets').textContent = createdByMe;
    document.getElementById('pendingTickets').textContent = pending;
    
    // Show recent tickets
    const recentTickets = tickets.slice(0, 5);
    displayDashboardTickets(recentTickets, 'helpdeskRecentTickets');
}

async function loadTechnicianDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    const techType = currentUser.technician_type || 'General Technician';
    
    dashboardContent.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <h3>👨‍💻 ${techType}</h3>
            <p>Welcome back! Here are your assigned tickets.</p>
        </div>
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Assigned to Me</h3>
                <div class="number" id="myTickets">-</div>
                <div class="subtitle">Active tickets</div>
            </div>
            <div class="dashboard-card orange">
                <h3>In Progress</h3>
                <div class="number" id="inProgressTickets">-</div>
                <div class="subtitle">Working on</div>
            </div>
            <div class="dashboard-card red">
                <h3>Urgent</h3>
                <div class="number" id="myUrgentTickets">-</div>
                <div class="subtitle">Needs attention</div>
            </div>
        </div>
        <h3 style="margin-top: 30px;">My Assigned Tickets</h3>
        <div id="myAssignedTickets"></div>
    `;
    
    // Load my tickets
    try {
        const myTickets = tickets.filter(t => t.assignee_id === currentUser.id);
        const inProgress = myTickets.filter(t => t.status === 'In Progress');
        const urgent = myTickets.filter(t => t.priority === 'Urgent' && t.status !== 'Closed');
        
        document.getElementById('myTickets').textContent = myTickets.length;
        document.getElementById('inProgressTickets').textContent = inProgress.length;
        document.getElementById('myUrgentTickets').textContent = urgent.length;
        
        // Display my tickets
        displayDashboardTickets(myTickets, 'myAssignedTickets');
    } catch (error) {
        console.error('Failed to load technician stats:', error);
    }
}

// Display tickets in dashboard format
function displayDashboardTickets(ticketList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (ticketList.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No tickets to display</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="tickets-table">
            ${ticketList.map(ticket => `
                <div class="ticket-row" onclick="viewTicket('${ticket.ticket_number}')">
                    <div class="ticket-info">
                        <div class="ticket-number">${ticket.ticket_number}</div>
                        <div class="ticket-summary">${ticket.problem_summary}</div>
                        <div class="ticket-meta">
                            <span>${ticket.user_name}</span> • 
                            <span>${formatDate(ticket.created_at)}</span>
                        </div>
                    </div>
                    <div class="ticket-badges">
                        <span class="priority-badge ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                        <span class="status-badge ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// User Management Functions
function setupUserManagement() {
    const showCreateUserBtn = document.getElementById('showCreateUserBtn');
    const cancelCreateUser = document.getElementById('cancelCreateUser');
    const userForm = document.getElementById('userForm');
    const newUserRole = document.getElementById('newUserRole');
    
    if (showCreateUserBtn) {
        showCreateUserBtn.addEventListener('click', () => {
            document.getElementById('createUserForm').style.display = 'block';
        });
    }
    
    if (cancelCreateUser) {
        cancelCreateUser.addEventListener('click', () => {
            document.getElementById('createUserForm').style.display = 'none';
            document.getElementById('userForm').reset();
        });
    }
    
    if (newUserRole) {
        newUserRole.addEventListener('change', () => {
            const techTypeGroup = document.getElementById('technicianTypeGroup');
            if (newUserRole.value === 'technician') {
                techTypeGroup.style.display = 'block';
            } else {
                techTypeGroup.style.display = 'none';
            }
        });
    }
    
    if (userForm) {
        userForm.addEventListener('submit', handleCreateUser);
    }
}

async function handleCreateUser(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('userFormError');
    const successDiv = document.getElementById('userFormSuccess');
    errorDiv.textContent = '';
    successDiv.textContent = '';
    
    const userData = {
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value,
        technician_type: document.getElementById('newUserTechType').value || null
    };
    
    try {
        await apiPost('/api/auth/register', userData);
        successDiv.textContent = 'User created successfully!';
        e.target.reset();
        
        // Reload users list
        await loadUsers();
        
        // Hide form after 2 seconds
        setTimeout(() => {
            document.getElementById('createUserForm').style.display = 'none';
        }, 2000);
    } catch (error) {
        errorDiv.textContent = 'Failed to create user: ' + error.message;
    }
}

async function loadUsers() {
    try {
        const users = await apiGet('/api/auth/users');
        displayUsers(users);
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = users.map(user => `
        <div class="user-card ${user.role}">
            <h3>${user.name}</h3>
            <div class="user-meta">
                <div>📧 ${user.email}</div>
                ${user.phone ? `<div>📞 ${user.phone}</div>` : ''}
                ${user.technician_type ? `<div>🔧 ${user.technician_type}</div>` : ''}
            </div>
            <div class="user-role">${user.role.replace('_', ' ')}</div>
        </div>
    `).join('');
}

// Update navigation to load users when clicking users page
const originalSwitchSection = switchSection;
window.switchSection = async function(sectionName) {
    originalSwitchSection(sectionName);
    
    if (sectionName === 'users') {
        await loadUsers();
    }
    
    if (sectionName === 'dashboard') {
        loadRoleDashboard();
    }
};

// Initialize user management on page load
setTimeout(() => {
    setupUserManagement();
}, 500);
