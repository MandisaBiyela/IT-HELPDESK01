// Helpdesk Officer Dashboard JavaScript
const API_URL = 'http://localhost:8000/api';
let currentUser = null;
let allTickets = [];
let allTechnicians = [];
let currentFilter = 'all';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    loadUserData();
    loadTechnicians();
    loadTickets();
    
    // Refresh data every 30 seconds
    setInterval(() => {
        loadTickets();
        loadTechnicians();
    }, 30000);
});

// API Helper Function
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
        return null;
    }
    
    return response;
}

// Load Current User Data
async function loadUserData() {
    try {
        const response = await apiRequest('/auth/me');
        if (response && response.ok) {
            currentUser = await response.json();
            document.getElementById('userName').textContent = currentUser.name;
            
            // Check if user is actually a helpdesk officer
            if (currentUser.role !== 'helpdesk_officer' && currentUser.role !== 'admin') {
                alert('Access denied. This page is for Helpdesk Officers only.');
                logout();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load All Technicians
async function loadTechnicians() {
    try {
        const response = await apiRequest('/auth/users');
        if (response && response.ok) {
            const users = await response.json();
            allTechnicians = users.filter(u => u.role === 'technician' && u.is_active);
            
            // Update assignee dropdown
            updateAssigneeDropdown();
            
            // Update technician availability panel
            updateTechnicianPanel();
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

// Update Assignee Dropdown in Create Form
function updateAssigneeDropdown() {
    const assigneeSelect = document.getElementById('assignee');
    assigneeSelect.innerHTML = '<option value="">Select Technician...</option>';
    
    allTechnicians.forEach(tech => {
        const option = document.createElement('option');
        option.value = tech.id;
        option.textContent = `${tech.name}${tech.technician_type ? ' (' + tech.technician_type + ')' : ''}`;
        assigneeSelect.appendChild(option);
    });
}

// Update Technician Availability Panel
function updateTechnicianPanel() {
    const techList = document.getElementById('techList');
    
    if (allTechnicians.length === 0) {
        techList.innerHTML = '<p style="color: #999; font-size: 13px;">No technicians available</p>';
        return;
    }
    
    // Calculate ticket load for each technician
    const techLoads = {};
    allTechnicians.forEach(tech => {
        techLoads[tech.id] = allTickets.filter(t => 
            t.assignee_id === tech.id && 
            (t.status === 'Open' || t.status === 'In Progress')
        ).length;
    });
    
    // Sort by load (ascending)
    const sortedTechs = [...allTechnicians].sort((a, b) => 
        techLoads[a.id] - techLoads[b.id]
    );
    
    techList.innerHTML = '';
    sortedTechs.forEach(tech => {
        const load = techLoads[tech.id] || 0;
        let loadClass = 'available';
        let indicatorClass = 'green';
        
        if (load >= 7) {
            loadClass = 'overloaded';
            indicatorClass = 'red';
        } else if (load >= 4) {
            loadClass = 'busy';
            indicatorClass = 'yellow';
        }
        
        const techCard = document.createElement('div');
        techCard.className = `tech-card ${loadClass}`;
        techCard.innerHTML = `
            <div class="tech-name">${tech.name}</div>
            <div class="tech-load">
                <span class="load-indicator ${indicatorClass}"></span>
                ${load} active ticket${load !== 1 ? 's' : ''}
            </div>
            ${tech.technician_type ? `<div style="font-size: 11px; color: #888; margin-top: 4px;">${tech.technician_type}</div>` : ''}
        `;
        techList.appendChild(techCard);
    });
}

// Load All Tickets
async function loadTickets() {
    try {
        const response = await apiRequest('/tickets');
        if (response && response.ok) {
            allTickets = await response.json();
            applyFilter(currentFilter);
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        showError('Failed to load tickets');
    }
}

// Apply Filter
function applyFilter(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.target?.classList.add('active');
    
    let filteredTickets = [...allTickets];
    const today = new Date().toDateString();
    
    switch(filter) {
        case 'today':
            filteredTickets = filteredTickets.filter(t => 
                new Date(t.created_at).toDateString() === today
            );
            break;
        case 'unassigned':
            filteredTickets = filteredTickets.filter(t => 
                t.status === 'Open' && !t.assignee_id
            );
            break;
        case 'urgent':
            filteredTickets = filteredTickets.filter(t => 
                t.priority === 'Urgent' && t.status !== 'Resolved' && t.status !== 'Closed'
            );
            break;
        case 'my':
            filteredTickets = filteredTickets.filter(t => 
                t.created_by_id === currentUser?.id
            );
            break;
        default:
            // Show all tickets
            break;
    }
    
    displayTickets(filteredTickets);
}

// Display Tickets
function displayTickets(tickets) {
    const ticketList = document.getElementById('ticketList');
    
    if (tickets.length === 0) {
        ticketList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No tickets found</p>
            </div>
        `;
        return;
    }
    
    // Sort by priority and SLA status
    const priorityOrder = { 'Urgent': 0, 'High': 1, 'Normal': 2 };
    tickets.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by created date (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    ticketList.innerHTML = '';
    tickets.forEach(ticket => {
        const ticketCard = createTicketCard(ticket);
        ticketList.appendChild(ticketCard);
    });
    
    // Update technician panel after filtering
    updateTechnicianPanel();
}

// Create Ticket Card Element
function createTicketCard(ticket) {
    const card = document.createElement('div');
    card.className = `ticket-card ${ticket.priority.toLowerCase()}`;
    
    const assigneeName = ticket.assignee_id 
        ? (allTechnicians.find(t => t.id === ticket.assignee_id)?.name || 'Unknown')
        : 'Unassigned';
    
    const timeAgo = getTimeAgo(ticket.created_at);
    const slaInfo = getSLAInfo(ticket);
    
    card.innerHTML = `
        <div class="ticket-header">
            <span class="ticket-number">${ticket.ticket_number}</span>
            <span class="sla-badge ${slaInfo.class}">${slaInfo.text}</span>
        </div>
        <div class="ticket-summary">${ticket.problem_summary}</div>
        <div class="ticket-meta">
            <span>👤 ${ticket.user_name}</span>
            <span>📧 ${ticket.user_email}</span>
            <span>⏰ ${timeAgo}</span>
        </div>
        <div class="ticket-meta">
            <span>📌 Priority: ${ticket.priority}</span>
            <span>📊 Status: ${ticket.status}</span>
            <span>👨‍💻 ${assigneeName}</span>
        </div>
        <div class="ticket-actions">
            ${!ticket.assignee_id || ticket.status === 'Open' ? 
                `<button class="assign-btn" onclick="quickAssign(${ticket.id})">Assign</button>` : 
                ''}
            <button class="view-btn" onclick="viewTicket(${ticket.id})">View Details</button>
        </div>
    `;
    
    return card;
}

// Get SLA Information
function getSLAInfo(ticket) {
    const now = new Date();
    const deadline = new Date(ticket.sla_deadline);
    const minutesRemaining = Math.floor((deadline - now) / 60000);
    
    if (minutesRemaining < 0) {
        return {
            class: 'sla-breached',
            text: `⚠️ BREACHED ${Math.abs(minutesRemaining)}m ago`
        };
    } else if (minutesRemaining <= 2) {
        return {
            class: 'sla-at-risk',
            text: `⏰ ${minutesRemaining}m remaining`
        };
    } else if (minutesRemaining < 60) {
        return {
            class: 'sla-on-track',
            text: `✓ ${minutesRemaining}m remaining`
        };
    } else {
        const hoursRemaining = Math.floor(minutesRemaining / 60);
        return {
            class: 'sla-on-track',
            text: `✓ ${hoursRemaining}h ${minutesRemaining % 60}m`
        };
    }
}

// Get Time Ago
function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

// Quick Assign Function
async function quickAssign(ticketId) {
    const assigneeId = prompt('Enter technician ID to assign (or leave blank to cancel):');
    if (!assigneeId) return;
    
    try {
        const response = await apiRequest(`/tickets/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                assignee_id: parseInt(assigneeId)
            })
        });
        
        if (response && response.ok) {
            showSuccess('Ticket assigned successfully');
            loadTickets();
        } else {
            showError('Failed to assign ticket');
        }
    } catch (error) {
        console.error('Error assigning ticket:', error);
        showError('Error assigning ticket');
    }
}

// View Ticket Details
function viewTicket(ticketId) {
    // Store ticket ID and redirect to main page for details
    localStorage.setItem('viewTicketId', ticketId);
    window.open('/index.html', '_blank');
}

// Open Create Ticket Modal
function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}

// Close Create Ticket Modal
function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
    document.getElementById('createTicketForm').reset();
}

// Create Ticket
async function createTicket(event) {
    event.preventDefault();
    
    const ticketData = {
        user_name: document.getElementById('userName_input').value,
        user_email: document.getElementById('userEmail').value,
        user_phone: document.getElementById('userPhone').value,
        problem_summary: document.getElementById('problemSummary').value,
        problem_description: document.getElementById('problemDescription').value || '',
        priority: document.getElementById('priority').value,
        assignee_id: parseInt(document.getElementById('assignee').value)
    };
    
    try {
        const response = await apiRequest('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData)
        });
        
        if (response && response.ok) {
            const newTicket = await response.json();
            showSuccess(`Ticket ${newTicket.ticket_number} created successfully!`);
            closeCreateModal();
            loadTickets();
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to create ticket');
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        showError('Error creating ticket');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('viewTicketId');
    window.location.href = '/index.html';
}

// Show Success Message
function showSuccess(message) {
    alert('✓ ' + message);
}

// Show Error Message
function showError(message) {
    alert('✗ ' + message);
}
