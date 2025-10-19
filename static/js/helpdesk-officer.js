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
        // Get all active tickets for this technician
        const activeTickets = allTickets.filter(t => 
            t.assignee_id === tech.id && 
            t.status !== 'Resolved' && 
            t.status !== 'Closed'
        );
        
        const load = activeTickets.length;
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
        
        // Build ticket list HTML
        let ticketsHTML = '';
        if (activeTickets.length > 0) {
            ticketsHTML = '<div class="tech-tickets">';
            activeTickets.forEach((ticket, index) => {
                if (index < 5) {  // Show up to 5 tickets
                    ticketsHTML += `
                        <div class="tech-ticket-item">
                            <span>${ticket.ticket_number}</span>
                            <span class="tech-ticket-priority ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                        </div>
                    `;
                }
            });
            if (activeTickets.length > 5) {
                ticketsHTML += `<div class="tech-ticket-more">+${activeTickets.length - 5} more</div>`;
            }
            ticketsHTML += '</div>';
        }
        
        techCard.innerHTML = `
            <div class="tech-name">${tech.name}</div>
            <div class="tech-load">
                <span class="load-indicator ${indicatorClass}"></span>
                ${load} active ticket${load !== 1 ? 's' : ''}
            </div>
            ${tech.technician_type ? `<div style="font-size: 11px; color: #888; margin-top: 4px;">${tech.technician_type}</div>` : ''}
            ${ticketsHTML}
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
            
            // Update last refresh time
            const now = new Date();
            const timeElement = document.getElementById('lastUpdate');
            if (timeElement) {
                timeElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
            }
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
        case 'urgent':
            filteredTickets = filteredTickets.filter(t => 
                t.priority === 'Urgent' && t.status !== 'Resolved' && t.status !== 'Closed'
            );
            break;
        default:
            // Show all tickets
            break;
    }
    
    displayTickets(filteredTickets);
    updateStatistics();
}

// Update Statistics Dashboard
function updateStatistics() {
    const total = allTickets.length;
    const solved = allTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const unsolved = total - solved;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statSolved').textContent = solved;
    document.getElementById('statUnsolved').textContent = unsolved;
}

// Display Tickets
function displayTickets(tickets) {
    const ticketList = document.getElementById('ticketList');
    
    if (tickets.length === 0) {
        ticketList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon" style="font-size: 48px; color: #ccc;">...</div>
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
    
    // Get assignee name - now using assignee_name from API or fallback to assignee object
    const assigneeName = ticket.assignee_name || 
                        (ticket.assignee ? ticket.assignee.name : null) ||
                        (ticket.assignee_id && allTechnicians.find(t => t.id === ticket.assignee_id)?.name) ||
                        'Unassigned';
    
    const timeAgo = getTimeAgo(ticket.created_at);
    const slaInfo = getSLAInfo(ticket);
    
    // Use fields directly from API response
    const userName = ticket.user_name || 'Unknown User';
    const userEmail = ticket.user_email || 'No email';
    const problemSummary = ticket.problem_summary || 'No summary';
    
    card.innerHTML = `
        <div class="ticket-header">
            <span class="ticket-number">${ticket.ticket_number}</span>
            ${slaInfo.text ? `<span class="sla-badge ${slaInfo.class}">${slaInfo.text}</span>` : ''}
        </div>
        <div class="ticket-summary">${problemSummary}</div>
        <div class="ticket-meta">
            <span><i class="fas fa-user"></i> ${userName}</span>
            <span><i class="fas fa-envelope"></i> ${userEmail}</span>
            <span><i class="fas fa-clock"></i> ${timeAgo}</span>
        </div>
        <div class="ticket-meta">
            <span>Priority: ${ticket.priority}</span>
            <span>Status: ${ticket.status}</span>
            <span>Assigned to: ${assigneeName}</span>
        </div>
        <div class="ticket-actions" style="display: flex; gap: 8px;">
            <button class="view-btn" onclick="viewTicket(${ticket.id})" style="flex: 1;"><i class="fas fa-eye"></i> View</button>
            <button class="edit-btn" onclick="editTicket(${ticket.id})" style="flex: 1; background: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 13px;"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-btn" onclick="deleteTicket(${ticket.id})" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `;
    
    return card;
}

// Get SLA Information
function getSLAInfo(ticket) {
    // Don't show SLA badges for resolved or closed tickets
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        return {
            class: '',
            text: ''
        };
    }
    
    const now = new Date();
    const deadline = new Date(ticket.sla_deadline);
    const minutesRemaining = Math.floor((deadline - now) / 60000);
    
    if (minutesRemaining < 0) {
        return {
            class: 'sla-breached',
            text: `BREACHED ${Math.abs(minutesRemaining)}m ago`
        };
    } else if (minutesRemaining <= 2) {
        return {
            class: 'sla-at-risk',
            text: `<i class="fas fa-exclamation-triangle"></i> ${minutesRemaining}m remaining`
        };
    } else if (minutesRemaining < 60) {
        return {
            class: 'sla-on-track',
            text: `<i class="fas fa-check-circle"></i> ${minutesRemaining}m remaining`
        };
    } else {
        const hoursRemaining = Math.floor(minutesRemaining / 60);
        return {
            class: 'sla-on-track',
            text: `<i class="fas fa-check-circle"></i> ${hoursRemaining}h ${minutesRemaining % 60}m`
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
// Quick Assign - Now uses ticket number instead of ID
async function quickAssign(ticketId) {
    // Find the ticket to get its ticket_number
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) {
        showError('Ticket not found');
        return;
    }
    
    const assigneeId = prompt('Enter technician ID to assign (or leave blank to cancel):');
    if (!assigneeId) return;
    
    try {
        const response = await apiRequest(`/tickets/${ticket.ticket_number}`, {
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
async function viewTicket(ticketId) {
    // Find ticket in current list to get ticket number
    const ticketPreview = allTickets.find(t => t.id === ticketId);
    if (!ticketPreview) {
        showError('Ticket not found');
        return;
    }

    // Fetch complete ticket details from API
    let ticket;
    try {
        const response = await apiRequest(`/tickets/${ticketPreview.ticket_number}`);
        if (response && response.ok) {
            ticket = await response.json();
        } else {
            showError('Failed to load ticket details');
            return;
        }
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        showError('Failed to load ticket details');
        return;
    }

    // Get assignee name
    const assignee = allTechnicians.find(t => t.id === ticket.assignee_id);
    const assigneeName = assignee ? assignee.name : ticket.assignee_name || 'Unassigned';

    // Fetch ticket history/updates for progress
    let ticketUpdates = [];
    try {
        const response = await apiRequest(`/tickets/${ticket.ticket_number}/updates`);
        if (response && response.ok) {
            ticketUpdates = await response.json();
        }
    } catch (error) {
        console.error('Error fetching ticket updates:', error);
    }

    // Build progress timeline
    let progressHTML = '<div class="ticket-progress">';
    if (ticketUpdates && ticketUpdates.length > 0) {
        ticketUpdates.forEach(update => {
            // Build action description from update data
            let actionText = '';
            const changes = [];
            
            if (update.old_status && update.new_status && update.old_status !== update.new_status) {
                changes.push(`Status changed from <strong>${update.old_status}</strong> to <strong>${update.new_status}</strong>`);
            }
            
            if (update.old_priority && update.new_priority && update.old_priority !== update.new_priority) {
                changes.push(`Priority changed from <strong>${update.old_priority}</strong> to <strong>${update.new_priority}</strong>`);
            }
            
            if (update.old_assignee_id && update.new_assignee_id && update.old_assignee_id !== update.new_assignee_id) {
                changes.push(`Ticket reassigned`);
            }
            
            if (update.reassign_reason) {
                changes.push(`Reason: ${update.reassign_reason}`);
            }
            
            actionText = changes.length > 0 ? changes.join('<br>') : 'Update added';
            
            progressHTML += `
                <div class="progress-item" style="margin-bottom: 15px; padding: 12px; background: #f9f9f9; border-left: 3px solid #2196f3; border-radius: 4px;">
                    <div class="progress-time" style="font-size: 13px; color: #0066cc !important; margin-bottom: 4px; font-weight: 600;">
                        <i class="fas fa-calendar-alt"></i> ${new Date(update.created_at).toLocaleString()} by ${update.updated_by_name}
                    </div>
                    <div class="progress-action" style="margin-bottom: 6px;">${actionText}</div>
                    ${update.update_text ? `<div class="progress-details" style="font-size: 13px; color: #444; margin-top: 6px; padding: 8px; background: white; border-radius: 3px;"><i class="fas fa-comment"></i> ${update.update_text}</div>` : ''}
                    ${update.time_spent ? `<div style="font-size: 12px; color: #666; margin-top: 4px;"><i class="fas fa-stopwatch"></i> Time spent: ${update.time_spent} minutes</div>` : ''}
                </div>
            `;
        });
    } else {
        progressHTML += `<div class="progress-item" style="padding: 20px; text-align: center; color: #999;"><i class="fas fa-clipboard-list"></i> No updates yet - Ticket just created</div>`;
    }
    progressHTML += '</div>';

    // Show modal with enhanced details
    const modalHTML = `
        <div class="modal-overlay" id="ticketDetailsModal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Ticket Details - ${ticket.ticket_number}</h2>
                    <button class="close-btn" onclick="closeTicketDetailsModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="ticket-info-grid">
                        <div class="info-section">
                            <h3>Reporter Information</h3>
                            <p><strong>Name:</strong> ${ticket.user_name || ticket.reported_by_name || 'N/A'}</p>
                            <p><strong>Email:</strong> ${ticket.user_email || ticket.reported_by_email || 'N/A'}</p>
                            <p><strong>Phone:</strong> ${ticket.user_phone || ticket.reported_by_phone || 'N/A'}</p>
                        </div>
                        <div class="info-section">
                            <h3>Assignment Information</h3>
                            <p><strong>Assigned to:</strong> ${assigneeName}</p>
                            <p><strong>Status:</strong> <span class="status-badge ${ticket.status.toLowerCase()}">${ticket.status}</span></p>
                            <p><strong>Priority:</strong> <span class="priority-badge ${ticket.priority.toLowerCase()}">${ticket.priority}</span></p>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3>Problem Details</h3>
                        <p><strong>Summary:</strong> ${ticket.problem_summary || ticket.title || 'N/A'}</p>
                        <p><strong>Description:</strong> ${ticket.problem_description || ticket.description || 'No description provided'}</p>
                    </div>
                    <div class="info-section">
                        <h3>Ticket Progress</h3>
                        ${progressHTML}
                    </div>
                    <div class="info-section">
                        <h3>Timeline</h3>
                        <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
                        ${ticket.resolved_at ? `<p><strong>Resolved:</strong> ${new Date(ticket.resolved_at).toLocaleString()}</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('ticketDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    setTimeout(() => {
        document.getElementById('ticketDetailsModal').classList.add('active');
    }, 10);
}

// Close Ticket Details Modal
function closeTicketDetailsModal() {
    const modal = document.getElementById('ticketDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
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
            const errorMessage = typeof error.detail === 'string' 
                ? error.detail 
                : error.detail?.message || error.message || 'Failed to create ticket';
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        showError('Error creating ticket');
    }
}

// Logout
function logout() {
    localStorage.clear();
    window.location.href = '/static/index.html';
}

// Show Success Message
function showSuccess(message) {
    alert('✓ ' + message);
}

// Show Error Message
function showError(message) {
    alert('✗ ' + message);
}

// ============ USER MANAGEMENT FUNCTIONS ============

// Open Manage Users Modal
function openManageUsersModal() {
    document.getElementById('manageUsersModal').style.display = 'flex';
    loadAllUsers();
}

// Close Manage Users Modal
function closeManageUsersModal() {
    document.getElementById('manageUsersModal').style.display = 'none';
    hideCreateUserForm();
}

// Show Create User Form
function showCreateUserForm() {
    document.getElementById('createUserForm').style.display = 'block';
    document.getElementById('userForm').reset();
    document.getElementById('userFormError').textContent = '';
    document.getElementById('userFormSuccess').textContent = '';
}

// Hide Create User Form
function hideCreateUserForm() {
    document.getElementById('createUserForm').style.display = 'none';
    document.getElementById('userForm').reset();
}

// Toggle Technician Type Field
function toggleTechnicianType() {
    const role = document.getElementById('newUserRole').value;
    const techTypeGroup = document.getElementById('technicianTypeGroup');
    techTypeGroup.style.display = role === 'technician' ? 'block' : 'none';
}

// Load All Users
async function loadAllUsers() {
    try {
        const response = await apiRequest('/auth/users');
        
        if (response && response.ok) {
            const users = await response.json();
            renderUsersList(users);
        } else {
            showError('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersList').innerHTML = '<p style="color: red; text-align: center;">Error loading users</p>';
    }
}

// Render Users List
function renderUsersList(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<p style="color: #999; text-align: center;">No users found</p>';
        return;
    }
    
    const roleColors = {
        'admin': '#f44336',
        'technician': '#ff9800',
        'helpdesk_officer': '#4caf50',
        'ict_manager': '#2196f3',
        'ict_gm': '#9c27b0'
    };
    
    usersList.innerHTML = users.map(user => `
        <div style="background: white; border: 1px solid #e0e0e0; border-left: 4px solid ${roleColors[user.role] || '#666'}; padding: 15px; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px;">${user.name}</h3>
                    <p style="margin: 4px 0; color: #666; font-size: 14px;"><i class="fas fa-envelope"></i> ${user.email}</p>
                    ${user.phone ? `<p style="margin: 4px 0; color: #666; font-size: 14px;"><i class="fas fa-phone"></i> ${user.phone}</p>` : ''}
                    <span style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: ${roleColors[user.role] || '#666'}; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${user.role.replace('_', ' ').toUpperCase()}
                    </span>
                    ${user.technician_type ? `<span style="display: inline-block; margin-top: 8px; margin-left: 8px; padding: 4px 12px; background: #e0e0e0; color: #333; border-radius: 12px; font-size: 12px;">
                        ${user.technician_type}
                    </span>` : ''}
                </div>
                <button onclick="deleteUser(${user.id}, '${user.name}')" style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Create New User
async function createUser(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value || null,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value,
        technician_type: document.getElementById('newUserRole').value === 'technician' 
            ? document.getElementById('newUserTechType').value || null 
            : null
    };
    
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response && response.ok) {
            const newUser = await response.json();
            document.getElementById('userFormSuccess').textContent = `User created successfully!`;
            document.getElementById('userFormError').textContent = '';
            document.getElementById('userForm').reset();
            loadAllUsers();
            
            // Hide form after 2 seconds
            setTimeout(() => {
                hideCreateUserForm();
            }, 2000);
        } else {
            const error = await response.json();
            document.getElementById('userFormError').textContent = error.detail || 'Failed to create user';
            document.getElementById('userFormSuccess').textContent = '';
        }
    } catch (error) {
        console.error('Error creating user:', error);
        document.getElementById('userFormError').textContent = 'Error creating user';
        document.getElementById('userFormSuccess').textContent = '';
    }
}

// Delete User
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
        return;
    }
    
    try {
        const response = await apiRequest(`/auth/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            showSuccess(`User "${userName}" deleted successfully`);
            loadAllUsers();
            loadTechnicians(); // Refresh technician list
        } else {
            const error = await response.json();
            const errorMessage = typeof error.detail === 'string' 
                ? error.detail 
                : error.detail?.message || error.message || 'Failed to delete user';
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Error deleting user');
    }
}

// ==================== TICKET CRUD OPERATIONS ====================

// Edit Ticket - Opens modal with ticket data
function editTicket(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) {
        showError('Ticket not found');
        return;
    }
    
    // Populate assignee dropdown for edit modal
    const editAssigneeSelect = document.getElementById('editAssignee');
    editAssigneeSelect.innerHTML = '<option value="">Select Technician...</option>';
    allTechnicians.forEach(tech => {
        const option = document.createElement('option');
        option.value = tech.id;
        option.textContent = `${tech.name}${tech.technician_type ? ' (' + tech.technician_type + ')' : ''}`;
        editAssigneeSelect.appendChild(option);
    });
    
    // Populate edit modal with ticket data
    document.getElementById('editTicketId').value = ticket.id;
    document.getElementById('editTicketNumber').value = ticket.ticket_number;
    document.getElementById('editUserName').value = ticket.user_name;
    document.getElementById('editUserEmail').value = ticket.user_email;
    document.getElementById('editUserPhone').value = ticket.user_phone;
    document.getElementById('editProblemSummary').value = ticket.problem_summary;
    document.getElementById('editProblemDescription').value = ticket.problem_description || '';
    document.getElementById('editPriority').value = ticket.priority;
    document.getElementById('editAssignee').value = ticket.assignee_id || '';
    document.getElementById('editStatus').value = ticket.status;
    
    // Show modal
    document.getElementById('editTicketModal').classList.add('active');
}

// Update Ticket - Submit the changes
async function updateTicket(event) {
    event.preventDefault();
    
    const ticketNumber = document.getElementById('editTicketNumber').value;
    
    const updateData = {
        user_name: document.getElementById('editUserName').value,
        user_email: document.getElementById('editUserEmail').value,
        user_phone: document.getElementById('editUserPhone').value,
        problem_summary: document.getElementById('editProblemSummary').value,
        problem_description: document.getElementById('editProblemDescription').value,
        priority: document.getElementById('editPriority').value,
        assignee_id: parseInt(document.getElementById('editAssignee').value),
        status: document.getElementById('editStatus').value
    };
    
    try {
        const response = await apiRequest(`/tickets/${ticketNumber}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
        
        if (response && response.ok) {
            showSuccess('Ticket updated successfully!');
            closeEditModal();
            loadTickets();
        } else {
            const error = await response.json();
            const errorMessage = typeof error.detail === 'string' 
                ? error.detail 
                : error.detail?.message || error.message || 'Failed to update ticket';
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Error updating ticket:', error);
        showError('Error updating ticket');
    }
}

// Delete Ticket
async function deleteTicket(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) {
        showError('Ticket not found');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ticket ${ticket.ticket_number}?\n\nUser: ${ticket.user_name}\nProblem: ${ticket.problem_summary}\n\nThis action cannot be undone!`)) {
        return;
    }
    
    try {
        const response = await apiRequest(`/tickets/${ticket.ticket_number}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            showSuccess(`Ticket ${ticket.ticket_number} deleted successfully!`);
            loadTickets();
        } else {
            const error = await response.json();
            const errorMessage = typeof error.detail === 'string' 
                ? error.detail 
                : error.detail?.message || error.message || 'Failed to delete ticket';
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showError('Error deleting ticket');
    }
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('editTicketModal').classList.remove('active');
}
