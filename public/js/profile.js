document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Load profile data
    loadProfileData();
    
    // Set up tab navigation
    const tabLinks = document.querySelectorAll('.profile-nav li');
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Set up form submissions
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
    
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updatePreferences();
        });
    }
    
    // NEW: Set up account settings event listeners
    setupAccountSettingsListeners();
    
    // Load user reservations and orders
    loadUserReservations();
    loadUserOrders();
});

// NEW: Setup account settings event listeners
function setupAccountSettingsListeners() {
    // Profile logout button
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to logout from your account?')) {
                logout(); // This function is defined in auth.js
            }
        });
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            // You can implement a modal for password change
            showChangePasswordModal();
        });
    }
    
    // Download data button
    const downloadDataBtn = document.getElementById('downloadDataBtn');
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', function() {
            downloadUserData();
        });
    }
    
    // Delete account button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                if (confirm('This will permanently delete all your data. Click OK to proceed.')) {
                    deleteUserAccount();
                }
            }
        });
    }
    
    // Notification settings
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');
    
    if (emailNotifications) {
        emailNotifications.addEventListener('change', function() {
            updateNotificationSettings('email', this.checked);
        });
    }
    
    if (smsNotifications) {
        smsNotifications.addEventListener('change', function() {
            updateNotificationSettings('sms', this.checked);
        });
    }
}

// NEW: Show change password modal
function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Change Password</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label for="currentPassword">Current Password:</label>
                        <input type="password" id="currentPassword" name="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">New Password:</label>
                        <input type="password" id="newPassword" name="newPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Confirm New Password:</label>
                        <input type="password" id="confirmNewPassword" name="confirmNewPassword" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="profile-save-btn">Change Password</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('#changePasswordForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmNewPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        // Send password change request
        fetch('/api/user/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Password changed successfully!', 'success');
                modal.remove();
            } else {
                showNotification(data.message || 'Failed to change password', 'error');
            }
        })
        .catch(error => {
            console.error('Password change error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        });
    });
}

// NEW: Download user data
function downloadUserData() {
    fetch('/api/user/download-data', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Failed to download data');
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-spice-symphony-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Your data has been downloaded!', 'success');
    })
    .catch(error => {
        console.error('Download error:', error);
        showNotification('Failed to download data. Please try again.', 'error');
    });
}

// NEW: Delete user account
function deleteUserAccount() {
    fetch('/api/user/delete-account', {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Account deleted successfully. You will be redirected...', 'success');
            
            // Clear local storage and redirect
            if (typeof(Storage) !== "undefined") {
                localStorage.clear();
                sessionStorage.clear();
            }
            
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showNotification(data.message || 'Failed to delete account', 'error');
        }
    })
    .catch(error => {
        console.error('Account deletion error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

// NEW: Update notification settings
function updateNotificationSettings(type, enabled) {
    fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: type,
            enabled: enabled
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`${type.toUpperCase()} notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
        } else {
            showNotification('Failed to update notification settings', 'error');
        }
    })
    .catch(error => {
        console.error('Notification settings error:', error);
        showNotification('An error occurred updating settings', 'error');
    });
}

// Rest of your existing functions remain the same...
// (switchTab, loadProfileData, populateProfileForms, updateProfile, etc.)

// Switch tabs in the profile
function switchTab(tabId) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab links
    const tabLinks = document.querySelectorAll('.profile-nav li');
    tabLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Show selected tab link
    const selectedLink = document.querySelector(`.profile-nav li[data-tab="${tabId}"]`);
    if (selectedLink) {
        selectedLink.classList.add('active');
    }
}

// Load user profile data
function loadProfileData() {
    fetch('/api/user/profile', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to load profile');
    })
    .then(data => {
        if (data.success) {
            populateProfileForms(data.profile);
        }
    })
    .catch(error => {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data. Please try again later.', 'error');
    });
}

// Populate profile forms with user data
function populateProfileForms(profile) {
    // Populate personal information
    document.getElementById('firstName').value = profile.firstName || '';
    document.getElementById('lastName').value = profile.lastName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('address').value = profile.address || '';
    document.getElementById('city').value = profile.city || '';
    document.getElementById('state').value = profile.state || '';
    document.getElementById('postalCode').value = profile.postalCode || '';
    document.getElementById('birthday').value = profile.birthday ? formatDateForInput(profile.birthday) : '';
    document.getElementById('anniversary').value = profile.anniversary ? formatDateForInput(profile.anniversary) : '';
    
    // Populate preferences
    document.getElementById('preferredPaymentMethod').value = profile.preferredPaymentMethod || 'credit_card';
    document.getElementById('dietaryPreferences').value = profile.dietaryPreferences || '';
    document.getElementById('allergies').value = profile.allergies || '';
    document.getElementById('favoriteDishes').value = profile.favoriteDishes || '';
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Update user profile (personal information)
function updateProfile() {
    const profileData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postalCode').value,
        birthday: document.getElementById('birthday').value,
        anniversary: document.getElementById('anniversary').value
    };
    
    updateUserProfile(profileData);
}

// Update user preferences
function updatePreferences() {
    const preferencesData = {
        preferredPaymentMethod: document.getElementById('preferredPaymentMethod').value,
        dietaryPreferences: document.getElementById('dietaryPreferences').value,
        allergies: document.getElementById('allergies').value,
        favoriteDishes: document.getElementById('favoriteDishes').value
    };
    
    updateUserProfile(preferencesData);
}

// Send profile update to the server
function updateUserProfile(data) {
    fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Profile updated successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to update profile.', 'error');
        }
    })
    .catch(error => {
        console.error('Profile update error:', error);
        showNotification('An error occurred. Please try again later.', 'error');
    });
}

// Load user reservations
function loadUserReservations() {
    const reservationsList = document.getElementById('reservationsList');
    if (!reservationsList) return;
    
    fetch('/api/user/reservations', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to load reservations');
    })
    .then(data => {
        if (data.success) {
            displayReservations(data.reservations);
        } else {
            reservationsList.innerHTML = '<div class="no-data">Failed to load reservations.</div>';
        }
    })
    .catch(error => {
        console.error('Error loading reservations:', error);
        reservationsList.innerHTML = '<div class="no-data">Failed to load reservations.</div>';
    });
}

// Display user reservations
function displayReservations(reservations) {
    const reservationsList = document.getElementById('reservationsList');
    
    if (reservations.length === 0) {
        reservationsList.innerHTML = '<div class="no-data">You have no reservations yet.</div>';
        return;
    }
    
    let html = '';
    reservations.forEach(reservation => {
        const formattedDate = new Date(reservation.date).toLocaleDateString();
        
        html += `
            <div class="profile-list-item">
                <div class="item-header">
                    <h4>Reservation on ${formattedDate} at ${reservation.time}</h4>
                    <span class="item-status ${getStatusClass(reservation.status)}">${reservation.status}</span>
                </div>
                <div class="item-body">
                    <p><strong>Guests:</strong> ${reservation.guests}</p>
                    <p><strong>Seating:</strong> ${capitalizeFirstLetter(reservation.seating)}</p>
                    <p><strong>Special Requests:</strong> ${reservation.special_requests || 'None'}</p>
                </div>
                <div class="item-footer">
                    <button class="btn-cancel" data-id="${reservation.id}" onclick="cancelReservation(${reservation.id})">Cancel Reservation</button>
                    <button class="btn-modify" data-id="${reservation.id}" onclick="modifyReservation(${reservation.id})">Modify</button>
                </div>
            </div>
        `;
    });
    
    reservationsList.innerHTML = html;
}

// Load user orders
function loadUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    fetch('/api/user/orders', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to load orders');
    })
    .then(data => {
        if (data.success) {
            displayOrders(data.orders);
        } else {
            ordersList.innerHTML = '<div class="no-data">Failed to load orders.</div>';
        }
    })
    .catch(error => {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<div class="no-data">Failed to load orders.</div>';
    });
}

// Display user orders
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="no-data">You have no orders yet.</div>';
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        const orderDate = new Date(order.order_time).toLocaleDateString();
        const orderTime = new Date(order.order_time).toLocaleTimeString();
        
        html += `
            <div class="profile-list-item">
                <div class="item-header">
                    <h4>Order #${order.id}</h4>
                    <span class="item-date">${orderDate} ${orderTime}</span>
                </div>
                <div class="item-body">
                    <p><strong>Total:</strong> ₹${parseFloat(order.total).toFixed(2)}</p>
                    <p><strong>Items:</strong> ${order.items}</p>
                </div>
                <div class="item-footer">
                    <button class="btn-view" data-id="${order.id}" onclick="viewOrderDetails(${order.id})">View Details</button>
                    <button class="btn-reorder" data-id="${order.id}" onclick="reorderItems(${order.id})">Reorder</button>
                </div>
            </div>
        `;
    });
    
    ordersList.innerHTML = html;
}

// Cancel reservation
function cancelReservation(id) {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
        return;
    }
    
    fetch(`/api/reservation/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Reservation cancelled successfully!', 'success');
            loadUserReservations(); // Reload the list
        } else {
            showNotification(data.message || 'Failed to cancel reservation.', 'error');
        }
    })
    .catch(error => {
        console.error('Reservation cancellation error:', error);
        showNotification('An error occurred. Please try again later.', 'error');
    });
}

// Modify reservation (redirect to reservation page with prefilled data)
function modifyReservation(id) {
    window.location.href = `/reservation?edit=${id}`;
}

// View order details
function viewOrderDetails(id) {
    // Implement order details modal or page redirect
    window.location.href = `/order-details?id=${id}`;
}

// Reorder items from a previous order
function reorderItems(id) {
    fetch(`/api/orders/${id}/reorder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Items added to cart!', 'success');
            // Optionally redirect to cart or menu
            // window.location.href = '/#menu';
        } else {
            showNotification(data.message || 'Failed to reorder items.', 'error');
        }
    })
    .catch(error => {
        console.error('Reorder error:', error);
        showNotification('An error occurred. Please try again later.', 'error');
    });
}

// Helper functions
function getStatusClass(status) {
    const statusMap = {
        'confirmed': 'status-confirmed',
        'pending': 'status-pending',
        'cancelled': 'status-cancelled',
        'completed': 'status-completed'
    };
    
    return statusMap[status.toLowerCase()] || '';
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function() {
        notificationContainer.removeChild(notification);
    };
    
    notification.appendChild(closeBtn);
    notificationContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notificationContainer.removeChild(notification);
        }
    }, 5000);
}