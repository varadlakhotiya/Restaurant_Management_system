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
    
    // Load user reservations and orders
    loadUserReservations();
    loadUserOrders();
});

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