// Profile Management JavaScript

// Show profile modal
function showProfileModal() {
    console.log('[Profile] Opening profile modal');
    const modal = document.getElementById('profileModal');
    if (!modal) {
        console.error('[Profile] Profile modal not found');
        return;
    }
    
    // Load current user data
    loadCurrentUserProfile();
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Clear previous messages
    hideProfileMessages();
}

// Hide profile modal
function hideProfileModal() {
    console.log('[Profile] Closing profile modal');
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Show password modal
function showPasswordModal() {
    console.log('[Profile] Opening password modal');
    const modal = document.getElementById('passwordModal');
    if (!modal) {
        console.error('[Profile] Password modal not found');
        return;
    }
    
    // Clear form
    document.getElementById('passwordForm').reset();
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Clear previous messages
    hidePasswordMessages();
}

// Hide password modal
function hidePasswordModal() {
    console.log('[Profile] Closing password modal');
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Load current user profile data
async function loadCurrentUserProfile() {
    console.log('[Profile] Loading current user profile');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            console.log('[Profile] User data loaded:', user);
            
            // Fill form fields
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profilePhone').value = user.phone || '';
        } else {
            console.error('[Profile] Failed to load user data:', response.status);
            showProfileError('Failed to load user data');
        }
    } catch (error) {
        console.error('[Profile] Error loading user data:', error);
        showProfileError('Error loading user data');
    }
}

// Update profile
async function updateProfile(event) {
    event.preventDefault();
    console.log('[Profile] Updating profile');
    
    const token = localStorage.getItem('token');
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    
    // Validation
    if (!name || !email) {
        showProfileError('Name and email are required');
        return;
    }
    
    const profileData = {
        name: name,
        email: email,
        phone: phone || null
    };
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            console.log('[Profile] Profile updated successfully:', updatedUser);
            
            // Update localStorage
            localStorage.setItem('user_name', updatedUser.name);
            
            // Update UI
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = updatedUser.name;
            }
            
            showProfileSuccess('Profile updated successfully!');
            
            // Auto-close after 2 seconds
            setTimeout(() => {
                hideProfileModal();
            }, 2000);
            
        } else {
            const errorData = await response.json();
            console.error('[Profile] Profile update failed:', errorData);
            showProfileError(errorData.detail || 'Failed to update profile');
        }
    } catch (error) {
        console.error('[Profile] Profile update error:', error);
        showProfileError('Network error. Please try again.');
    }
}

// Change password
async function changePassword(event) {
    event.preventDefault();
    console.log('[Profile] Changing password');
    
    const token = localStorage.getItem('token');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordError('All password fields are required');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordError('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        showPasswordError('New password must be at least 6 characters');
        return;
    }
    
    const passwordData = {
        current_password: currentPassword,
        new_password: newPassword
    };
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('[Profile] Password changed successfully:', result);
            
            showPasswordSuccess('Password changed successfully!');
            
            // Clear form
            document.getElementById('passwordForm').reset();
            
            // Auto-close after 2 seconds
            setTimeout(() => {
                hidePasswordModal();
            }, 2000);
            
        } else {
            const errorData = await response.json();
            console.error('[Profile] Password change failed:', errorData);
            showPasswordError(errorData.detail || 'Failed to change password');
        }
    } catch (error) {
        console.error('[Profile] Password change error:', error);
        showPasswordError('Network error. Please try again.');
    }
}

// Helper functions for messages
function hideProfileMessages() {
    const errorEl = document.getElementById('profileError');
    const successEl = document.getElementById('profileSuccess');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
}

function hidePasswordMessages() {
    const errorEl = document.getElementById('passwordError');
    const successEl = document.getElementById('passwordSuccess');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
}

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Profile] Setting up event listeners');
    
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
    
    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const profileModal = document.getElementById('profileModal');
        const passwordModal = document.getElementById('passwordModal');
        
        if (event.target === profileModal) {
            hideProfileModal();
        }
        if (event.target === passwordModal) {
            hidePasswordModal();
        }
    });
    
    console.log('[Profile] Event listeners setup complete');
});