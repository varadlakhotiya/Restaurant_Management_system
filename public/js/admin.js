// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    checkAdminAuth();
    
    // Initialize the sidebar navigation
    initSidebarNav();
    
    // Initialize dashboard charts and data
    initDashboard();
    
    // Initialize the tables
    initReservationsTable();
    initOrdersTable();
    initTablesManagement();
    initMenuTable();
    initUsersTable();
    
    // Initialize settings tabs
    initSettingsTabs();
    
    // Initialize modals
    initModals();
});

// Check if the user is authenticated as admin
function checkAdminAuth() {
    fetch('/api/user/profile', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Not authenticated');
    })
    .then(data => {
        if (data.success) {
            // Check if user is admin
            if (data.profile.role !== 'admin') {
                // Redirect to homepage if not admin
                window.location.href = '/';
            } else {
                // Update admin username
                const adminUsername = document.getElementById('admin-username');
                if (adminUsername) {
                    adminUsername.textContent = `${data.profile.firstName} ${data.profile.lastName}`;
                }
            }
        } else {
            // Redirect to login page
            window.location.href = '/login?redirect=admin';
        }
    })
    .catch(error => {
        console.error('Auth check error:', error);
        // Redirect to login page
        window.location.href = '/login?redirect=admin';
    });
}

// Initialize sidebar navigation
function initSidebarNav() {
    const navItems = document.querySelectorAll('.admin-nav li');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show the corresponding section
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update URL hash
            window.location.hash = section;
        });
    });
    
    // Check URL hash on load
    if (window.location.hash) {
        const section = window.location.hash.substring(1);
        const activeNavItem = document.querySelector(`.admin-nav li[data-section="${section}"]`);
        
        if (activeNavItem) {
            // Simulate click on the nav item
            activeNavItem.click();
        }
    }
}

// Show the selected section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionId}-section`);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
}

// Initialize dashboard charts and data
function initDashboard() {
    // Load dashboard stats
    loadDashboardStats();
    
    // Initialize charts
    initReservationsChart();
    initRevenueChart();
    
    // Load recent activity
    loadRecentActivity();
}

// Load dashboard statistics
function loadDashboardStats() {
    // Fetch today's reservations count
    fetch('/api/admin/stats/reservations/today', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('today-reservations').textContent = data.count;
        }
    })
    .catch(error => console.error('Error loading reservations count:', error));
    
    // Fetch today's orders count
    fetch('/api/admin/stats/orders/today', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('today-orders').textContent = data.count;
        }
    })
    .catch(error => console.error('Error loading orders count:', error));
    
    // Fetch total customers count
    fetch('/api/admin/stats/users/total', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('total-customers').textContent = data.count;
        }
    })
    .catch(error => console.error('Error loading customers count:', error));
    
    // Fetch monthly revenue
    fetch('/api/admin/stats/revenue/month', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('monthly-revenue').textContent = `₹${data.revenue.toFixed(2)}`;
        }
    })
    .catch(error => console.error('Error loading monthly revenue:', error));
}

// Initialize reservations chart
function initReservationsChart() {
    fetch('/api/admin/stats/reservations/weekly', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const ctx = document.getElementById('reservations-chart').getContext('2d');
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Reservations',
                        data: data.values,
                        backgroundColor: 'rgba(217, 83, 79, 0.7)',
                        borderColor: 'rgba(217, 83, 79, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }
    })
    .catch(error => console.error('Error loading reservations chart data:', error));
}

// Initialize revenue chart
function initRevenueChart() {
    fetch('/api/admin/stats/revenue/monthly', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const ctx = document.getElementById('revenue-chart').getContext('2d');
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: data.values,
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 2,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    })
    .catch(error => console.error('Error loading revenue chart data:', error));
}

// Load recent activity
function loadRecentActivity() {
    fetch('/api/admin/activity/recent', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const activityList = document.getElementById('recent-activity-list');
            
            if (activityList && data.activities.length > 0) {
                activityList.innerHTML = ''; // Clear loading message
                
                data.activities.forEach(activity => {
                    const activityItem = document.createElement('div');
                    activityItem.className = 'activity-item';
                    
                    // Icon based on activity type
                    let iconClass = 'fas fa-info-circle';
                    
                    switch (activity.type) {
                        case 'reservation':
                            iconClass = 'fas fa-calendar-check';
                            break;
                        case 'order':
                            iconClass = 'fas fa-utensils';
                            break;
                        case 'user':
                            iconClass = 'fas fa-user';
                            break;
                        case 'menu':
                            iconClass = 'fas fa-clipboard-list';
                            break;
                        case 'table':
                            iconClass = 'fas fa-chair';
                            break;
                    }
                    
                    activityItem.innerHTML = `
                        <div class="activity-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${activity.title}</div>
                            <div class="activity-details">${activity.details}</div>
                            <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
                        </div>
                    `;
                    
                    activityList.appendChild(activityItem);
                });
            } else if (activityList) {
                activityList.innerHTML = '<div class="activity-item"><div class="activity-content">No recent activity found.</div></div>';
            }
        }
    })
    .catch(error => {
        console.error('Error loading recent activity:', error);
        
        const activityList = document.getElementById('recent-activity-list');
        if (activityList) {
            activityList.innerHTML = '<div class="activity-item"><div class="activity-content">Failed to load recent activity.</div></div>';
        }
    });
}

// Initialize reservations table
function initReservationsTable() {
    // Filter and search elements
    const dateFilter = document.getElementById('reservation-date');
    const statusFilter = document.getElementById('reservation-status');
    const searchInput = document.getElementById('reservation-search');
    
    // Add event listeners for filters
    if (dateFilter) {
        dateFilter.addEventListener('change', () => loadReservations());
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadReservations());
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadReservations(), 300));
    }
    
    // Load reservations on section activation
    document.querySelector('.admin-nav li[data-section="reservations"]').addEventListener('click', () => {
        loadReservations();
    });
    
    // Add New Reservation button
    const addReservationBtn = document.getElementById('add-reservation-btn');
    if (addReservationBtn) {
        addReservationBtn.addEventListener('click', () => openReservationModal());
    }
}

// Load reservations
function loadReservations(page = 1) {
    const tableBody = document.querySelector('#reservations-table tbody');
    if (!tableBody) return;
    
    // Show loading indicator
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="9">Loading reservations...</td></tr>';
    
    // Get filter values
    const date = document.getElementById('reservation-date')?.value || '';
    const status = document.getElementById('reservation-status')?.value || 'all';
    const search = document.getElementById('reservation-search')?.value || '';
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    if (date) queryParams.append('date', date);
    if (status !== 'all') queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    
    // Fetch reservations
    fetch(`/api/admin/reservations?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.reservations.length > 0) {
                tableBody.innerHTML = ''; // Clear loading message
                
                data.reservations.forEach(reservation => {
                    const row = document.createElement('tr');
                    
                    // Format date and time
                    const reservationDate = new Date(reservation.date).toLocaleDateString();
                    
                    // Status class
                    let statusClass = '';
                    switch (reservation.status.toLowerCase()) {
                        case 'confirmed':
                            statusClass = 'status-confirmed';
                            break;
                        case 'pending':
                            statusClass = 'status-pending';
                            break;
                        case 'cancelled':
                            statusClass = 'status-cancelled';
                            break;
                        case 'completed':
                            statusClass = 'status-completed';
                            break;
                    }
                    
                    row.innerHTML = `
                        <td>${reservation.id}</td>
                        <td>${reservationDate}</td>
                        <td>${reservation.time}</td>
                        <td>${reservation.name}</td>
                        <td>${reservation.guests}</td>
                        <td>${reservation.contact}</td>
                        <td>${capitalizeFirstLetter(reservation.seating)}</td>
                        <td><span class="table-status ${statusClass}">${capitalizeFirstLetter(reservation.status)}</span></td>
                        <td class="actions-cell">
                            <button class="action-btn view-btn" title="View Details" onclick="viewReservation(${reservation.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit-btn" title="Edit" onclick="editReservation(${reservation.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteReservation(${reservation.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Generate pagination
                generatePagination('reservations-pagination', data.currentPage, data.totalPages, loadReservations);
            } else {
                tableBody.innerHTML = '<tr><td colspan="9" class="no-data">No reservations found.</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="9" class="no-data">Failed to load reservations.</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error loading reservations:', error);
        tableBody.innerHTML = '<tr><td colspan="9" class="no-data">Failed to load reservations.</td></tr>';
    });
}

// Initialize orders table
function initOrdersTable() {
    // Filter and search elements
    const dateFilter = document.getElementById('order-date');
    const typeFilter = document.getElementById('order-type');
    const searchInput = document.getElementById('order-search');
    
    // Add event listeners for filters
    if (dateFilter) {
        dateFilter.addEventListener('change', () => loadOrders());
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => loadOrders());
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadOrders(), 300));
    }
    
    // Load orders on section activation
    document.querySelector('.admin-nav li[data-section="orders"]').addEventListener('click', () => {
        loadOrders();
    });
}

// Load orders
function loadOrders(page = 1) {
    const tableBody = document.querySelector('#orders-table tbody');
    if (!tableBody) return;
    
    // Show loading indicator
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="8">Loading orders...</td></tr>';
    
    // Get filter values
    const date = document.getElementById('order-date')?.value || '';
    const type = document.getElementById('order-type')?.value || 'all';
    const search = document.getElementById('order-search')?.value || '';
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    if (date) queryParams.append('date', date);
    if (type !== 'all') queryParams.append('type', type);
    if (search) queryParams.append('search', search);
    
    // Fetch orders
    fetch(`/api/admin/orders?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.orders.length > 0) {
                tableBody.innerHTML = ''; // Clear loading message
                
                data.orders.forEach(order => {
                    const row = document.createElement('tr');
                    
                    // Format date and time
                    const orderDateTime = new Date(order.order_time).toLocaleString();
                    
                    // Truncate items if too long
                    const itemsDisplay = order.items.length > 50 ? `${order.items.substring(0, 50)}...` : order.items;
                    
                    row.innerHTML = `
                        <td>${order.id}</td>
                        <td>${orderDateTime}</td>
                        <td>${order.name || 'N/A'}</td>
                        <td>${order.table_number || 'N/A'}</td>
                        <td title="${order.items}">${itemsDisplay}</td>
                        <td>₹${parseFloat(order.total).toFixed(2)}</td>
                        <td><span class="table-status status-confirmed">Completed</span></td>
                        <td class="actions-cell">
                            <button class="action-btn view-btn" title="View Details" onclick="viewOrder(${order.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteOrder(${order.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Generate pagination
                generatePagination('orders-pagination', data.currentPage, data.totalPages, loadOrders);
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No orders found.</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Failed to load orders.</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error loading orders:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Failed to load orders.</td></tr>';
    });
}

// Initialize tables management
function initTablesManagement() {
    // Filter elements
    const sectionFilter = document.getElementById('table-section-filter');
    const statusFilter = document.getElementById('table-status-filter');
    
    // Add event listeners for filters
    if (sectionFilter) {
        sectionFilter.addEventListener('change', () => loadTables());
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadTables());
    }
    
    // Load tables on section activation
    document.querySelector('.admin-nav li[data-section="tables"]').addEventListener('click', () => {
        loadTables();
    });
    
    // Add New Table button
    const addTableBtn = document.getElementById('add-table-btn');
    if (addTableBtn) {
        addTableBtn.addEventListener('click', () => openTableModal());
    }
    
    // View toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Toggle view
            const view = this.getAttribute('data-view');
            toggleTableView(view);
        });
    });
}

// Load tables
function loadTables() {
    const tablesGrid = document.getElementById('tables-grid');
    const tablesTableBody = document.querySelector('#tables-table tbody');
    
    if (!tablesGrid || !tablesTableBody) return;
    
    // Show loading indicator
    tablesGrid.innerHTML = '<div class="loading-tables">Loading tables...</div>';
    tablesTableBody.innerHTML = '<tr class="loading-row"><td colspan="7">Loading tables...</td></tr>';
    
    // Get filter values
    const section = document.getElementById('table-section-filter')?.value || 'all';
    const status = document.getElementById('table-status-filter')?.value || 'all';
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (section !== 'all') queryParams.append('section', section);
    if (status !== 'all') queryParams.append('status', status);
    
    // Fetch tables
    fetch(`/api/admin/tables?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.tables.length > 0) {
                // Clear loading messages
                tablesGrid.innerHTML = '';
                tablesTableBody.innerHTML = '';
                
                data.tables.forEach(table => {
                    // Create grid card
                    const tableCard = document.createElement('div');
                    tableCard.className = 'table-card';
                    
                    // Table icon based on section
                    const iconClass = table.section === 'indoor' ? 'fas fa-square' : 'fas fa-circle';
                    
                    // Status class
                    let statusClass = '';
                    switch (table.status.toLowerCase()) {
                        case 'available':
                            statusClass = 'status-available';
                            break;
                        case 'reserved':
                            statusClass = 'status-reserved';
                            break;
                        case 'occupied':
                            statusClass = 'status-occupied';
                            break;
                        case 'maintenance':
                            statusClass = 'status-maintenance';
                            break;
                    }
                    
                    tableCard.innerHTML = `
                        <div class="table-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="table-number">Table ${table.table_number}</div>
                        <div class="table-capacity">${table.capacity} Guests</div>
                        <div class="table-status ${statusClass}">${capitalizeFirstLetter(table.status)}</div>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" title="Edit" onclick="editTable(${table.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteTable(${table.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    tablesGrid.appendChild(tableCard);
                    
                    // Create table row
                    const tableRow = document.createElement('tr');
                    
                    tableRow.innerHTML = `
                        <td>${table.id}</td>
                        <td>${table.table_number}</td>
                        <td>${table.capacity}</td>
                        <td>${capitalizeFirstLetter(table.section)}</td>
                        <td><span class="table-status ${statusClass}">${capitalizeFirstLetter(table.status)}</span></td>
                        <td>${table.reservation_info || 'None'}</td>
                        <td class="actions-cell">
                            <button class="action-btn edit-btn" title="Edit" onclick="editTable(${table.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteTable(${table.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    tablesTableBody.appendChild(tableRow);
                });
            } else {
                tablesGrid.innerHTML = '<div class="no-tables">No tables found.</div>';
                tablesTableBody.innerHTML = '<tr><td colspan="7" class="no-data">No tables found.</td></tr>';
            }
        } else {
            tablesGrid.innerHTML = '<div class="no-tables">Failed to load tables.</div>';
            tablesTableBody.innerHTML = '<tr><td colspan="7" class="no-data">Failed to load tables.</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error loading tables:', error);
        tablesGrid.innerHTML = '<div class="no-tables">Failed to load tables.</div>';
        tablesTableBody.innerHTML = '<tr><td colspan="7" class="no-data">Failed to load tables.</td></tr>';
    });
}

// Toggle table view (grid/list)
function toggleTableView(view) {
    const gridView = document.querySelector('.tables-management');
    const listView = document.querySelector('.tables-list-view');
    
    if (view === 'grid') {
        gridView.style.display = 'block';
        listView.style.display = 'none';
    } else {
        gridView.style.display = 'none';
        listView.style.display = 'block';
    }
}

// Initialize menu table
function initMenuTable() {
    // Filter and search elements
    const categoryFilter = document.getElementById('menu-category-filter');
    const searchInput = document.getElementById('menu-search');
    
    // Add event listeners for filters
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => loadMenuItems());
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadMenuItems(), 300));
    }
    
    // Load menu items on section activation
    document.querySelector('.admin-nav li[data-section="menu"]').addEventListener('click', () => {
        loadMenuItems();
    });
    
    // Add New Menu Item button
    const addMenuItemBtn = document.getElementById('add-menu-item-btn');
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', () => openMenuItemModal());
    }
}

// Load menu items
function loadMenuItems(page = 1) {
    const tableBody = document.querySelector('#menu-table tbody');
    if (!tableBody) return;
    
    // Show loading indicator
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="7">Loading menu items...</td></tr>';
    
    // Get filter values
    const category = document.getElementById('menu-category-filter')?.value || 'all';
    const search = document.getElementById('menu-search')?.value || '';
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    if (category !== 'all') queryParams.append('category', category);
    if (search) queryParams.append('search', search);
    
    // Fetch menu items
    fetch(`/api/admin/menu?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.menuItems.length > 0) {
                tableBody.innerHTML = ''; // Clear loading message
                
                data.menuItems.forEach(item => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td><img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" width="50" height="50" style="object-fit: cover; border-radius: 4px;"></td>
                        <td>${item.name}</td>
                        <td>${capitalizeFirstLetter(item.category)}</td>
                        <td>${item.subcategory}</td>
                        <td>₹${parseFloat(item.price).toFixed(2)}</td>
                        <td class="actions-cell">
                            <button class="action-btn view-btn" title="View Details" onclick="viewMenuItem(${item.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit-btn" title="Edit" onclick="editMenuItem(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteMenuItem(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Generate pagination
                generatePagination('menu-pagination', data.currentPage, data.totalPages, loadMenuItems);
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No menu items found.</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Failed to load menu items.</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error loading menu items:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Failed to load menu items.</td></tr>';
    });
}

// Initialize users table
function initUsersTable() {
    // Filter and search elements
    const roleFilter = document.getElementById('user-role-filter');
    const searchInput = document.getElementById('user-search');
    
    // Add event listeners for filters
    if (roleFilter) {
        roleFilter.addEventListener('change', () => loadUsers());
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadUsers(), 300));
    }
    
    // Load users on section activation
    document.querySelector('.admin-nav li[data-section="users"]').addEventListener('click', () => {
        loadUsers();
    });
    
    // Add New User button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal());
    }
}

// Load users
function loadUsers(page = 1) {
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) return;
    
    // Show loading indicator
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="8">Loading users...</td></tr>';
    
    // Get filter values
    const role = document.getElementById('user-role-filter')?.value || 'all';
    const search = document.getElementById('user-search')?.value || '';
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    if (role !== 'all') queryParams.append('role', role);
    if (search) queryParams.append('search', search);
    
    // Fetch users
    fetch(`/api/admin/users?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.users.length > 0) {
                tableBody.innerHTML = ''; // Clear loading message
                
                data.users.forEach(user => {
                    const row = document.createElement('tr');
                    
                    // Format dates
                    const joinedDate = new Date(user.created_at).toLocaleDateString();
                    const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
                    
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.first_name} ${user.last_name}</td>
                        <td>${user.email}</td>
                        <td>${user.phone || 'N/A'}</td>
                        <td>${capitalizeFirstLetter(user.role)}</td>
                        <td>${joinedDate}</td>
                        <td>${lastLoginDate}</td>
                        <td class="actions-cell">
                            <button class="action-btn view-btn" title="View Details" onclick="viewUser(${user.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit-btn" title="Edit" onclick="editUser(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteUser(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Generate pagination
                generatePagination('users-pagination', data.currentPage, data.totalPages, loadUsers);
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No users found.</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Failed to load users.</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Failed to load users.</td></tr>';
    });
}

// Initialize settings tabs
function initSettingsTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabs = document.querySelectorAll('.settings-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show the corresponding tab
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Initialize settings forms
    initSettingsForms();
}

// Initialize settings forms
function initSettingsForms() {
    // General Settings Form
    const generalSettingsForm = document.getElementById('general-settings-form');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGeneralSettings();
        });
    }
    
    // Business Hours Form
    const businessHoursForm = document.getElementById('business-hours-form');
    if (businessHoursForm) {
        businessHoursForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveBusinessHours();
        });
    }
    
    // Email Settings Form
    const emailSettingsForm = document.getElementById('email-settings-form');
    if (emailSettingsForm) {
        emailSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEmailSettings();
        });
    }
    
    // SEO Settings Form
    const seoSettingsForm = document.getElementById('seo-settings-form');
    if (seoSettingsForm) {
        seoSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSeoSettings();
        });
    }
    
    // Test Email Button
    const testEmailBtn = document.getElementById('test-email-btn');
    if (testEmailBtn) {
        testEmailBtn.addEventListener('click', function() {
            sendTestEmail();
        });
    }
}

// Initialize modals
function initModals() {
    // Close buttons for all modals
    const closeButtons = document.querySelectorAll('.modal-close, [id$="-modal-cancel"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.admin-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('admin-modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Initialize specific modals
    initReservationModal();
    initTableModal();
    initMenuItemModal();
    initUserModal();
    initConfirmModal();
}

// Reservation Modal Functions
function initReservationModal() {
    const saveBtn = document.getElementById('reservation-modal-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveReservation();
        });
    }
}

// Open Reservation Modal
function openReservationModal(reservationId = null) {
    const modal = document.getElementById('reservation-modal');
    const form = document.getElementById('reservation-form');
    const modalTitle = document.getElementById('reservation-modal-title');
    
    if (!modal || !form || !modalTitle) return;
    
    // Clear form
    form.reset();
    
    // Set reservation ID (if editing)
    document.getElementById('reservation-id').value = reservationId;
    
    // Set modal title
    modalTitle.textContent = reservationId ? 'Edit Reservation' : 'Add New Reservation';
    
    // Load tables for dropdown
    loadTablesForDropdown();
    
    // If editing, load reservation data
    if (reservationId) {
        loadReservationDetails(reservationId);
    } else {
        // Set default values for new reservation
        document.getElementById('modal-reservation-date').valueAsDate = new Date();
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Load reservation details
function loadReservationDetails(reservationId) {
    fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const reservation = data.reservation;
            
            // Populate form fields
            document.getElementById('modal-reservation-date').value = reservation.date;
            document.getElementById('modal-reservation-time').value = reservation.time;
            document.getElementById('modal-reservation-name').value = reservation.name;
            document.getElementById('modal-reservation-guests').value = reservation.guests;
            document.getElementById('modal-reservation-phone').value = reservation.contact;
            document.getElementById('modal-reservation-email').value = reservation.email;
            document.getElementById('modal-reservation-seating').value = reservation.seating;
            document.getElementById('modal-reservation-status').value = reservation.status;
            document.getElementById('modal-reservation-special-requests').value = reservation.special_requests || '';
            
            // Set table if assigned
            if (reservation.table_id) {
                document.getElementById('modal-reservation-table').value = reservation.table_id;
            }
        } else {
            showToast('error', 'Error', 'Failed to load reservation details.');
        }
    })
    .catch(error => {
        console.error('Error loading reservation details:', error);
        showToast('error', 'Error', 'Failed to load reservation details.');
    });
}

// Save reservation
function saveReservation() {
    const form = document.getElementById('reservation-form');
    if (!form) return;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const reservationId = document.getElementById('reservation-id').value;
    const formData = {
        date: document.getElementById('modal-reservation-date').value,
        time: document.getElementById('modal-reservation-time').value,
        name: document.getElementById('modal-reservation-name').value,
        guests: parseInt(document.getElementById('modal-reservation-guests').value),
        contact: document.getElementById('modal-reservation-phone').value,
        email: document.getElementById('modal-reservation-email').value,
        seating: document.getElementById('modal-reservation-seating').value,
        status: document.getElementById('modal-reservation-status').value,
        specialRequests: document.getElementById('modal-reservation-special-requests').value,
        tableId: document.getElementById('modal-reservation-table').value || null
    };
    
    // API endpoint and method
    const apiUrl = reservationId ? `/api/admin/reservations/${reservationId}` : '/api/admin/reservations';
    const apiMethod = reservationId ? 'PUT' : 'POST';
    
    // Send request
    fetch(apiUrl, {
        method: apiMethod,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal
            document.getElementById('reservation-modal').style.display = 'none';
            
            // Show success toast
            showToast('success', 'Success', `Reservation ${reservationId ? 'updated' : 'added'} successfully!`);
            
            // Reload reservations
            loadReservations();
        } else {
            showToast('error', 'Error', data.message || `Failed to ${reservationId ? 'update' : 'add'} reservation.`);
        }
    })
    .catch(error => {
        console.error(`Error ${reservationId ? 'updating' : 'adding'} reservation:`, error);
        showToast('error', 'Error', `Failed to ${reservationId ? 'update' : 'add'} reservation.`);
    });
}

// Load tables for dropdown
function loadTablesForDropdown() {
    const dropdown = document.getElementById('modal-reservation-table');
    if (!dropdown) return;
    
    // Clear current options (except the default one)
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Fetch tables
    fetch('/api/admin/tables?status=available', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.tables.length > 0) {
            data.tables.forEach(table => {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = `Table ${table.table_number} (${table.capacity} guests, ${capitalizeFirstLetter(table.section)})`;
                dropdown.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading tables for dropdown:', error);
    });
}

// Table Modal Functions
function initTableModal() {
    const saveBtn = document.getElementById('table-modal-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveTable();
        });
    }
}

// Open Table Modal
function openTableModal(tableId = null) {
    const modal = document.getElementById('table-modal');
    const form = document.getElementById('table-form');
    const modalTitle = document.getElementById('table-modal-title');
    
    if (!modal || !form || !modalTitle) return;
    
    // Clear form
    form.reset();
    
    // Set table ID (if editing)
    document.getElementById('table-id').value = tableId;
    
    // Set modal title
    modalTitle.textContent = tableId ? 'Edit Table' : 'Add New Table';
    
    // If editing, load table data
    if (tableId) {
        loadTableDetails(tableId);
    } else {
        // Set default values for new table
        document.getElementById('modal-table-status').value = 'available';
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Load table details
function loadTableDetails(tableId) {
    fetch(`/api/admin/tables/${tableId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const table = data.table;
            
            // Populate form fields
            document.getElementById('modal-table-number').value = table.table_number;
            document.getElementById('modal-table-capacity').value = table.capacity;
            document.getElementById('modal-table-section').value = table.section;
            document.getElementById('modal-table-status').value = table.status;
            document.getElementById('modal-table-x').value = table.coordinates_x;
            document.getElementById('modal-table-y').value = table.coordinates_y;
        } else {
            showToast('error', 'Error', 'Failed to load table details.');
        }
    })
    .catch(error => {
        console.error('Error loading table details:', error);
        showToast('error', 'Error', 'Failed to load table details.');
    });
}

// Save table
function saveTable() {
    const form = document.getElementById('table-form');
    if (!form) return;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const tableId = document.getElementById('table-id').value;
    const formData = {
        tableNumber: document.getElementById('modal-table-number').value,
        capacity: parseInt(document.getElementById('modal-table-capacity').value),
        section: document.getElementById('modal-table-section').value,
        status: document.getElementById('modal-table-status').value,
        coordinatesX: parseInt(document.getElementById('modal-table-x').value),
        coordinatesY: parseInt(document.getElementById('modal-table-y').value)
    };
    
    // API endpoint and method
    const apiUrl = tableId ? `/api/admin/tables/${tableId}` : '/api/admin/tables';
    const apiMethod = tableId ? 'PUT' : 'POST';
    
    // Send request
    fetch(apiUrl, {
        method: apiMethod,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal
            document.getElementById('table-modal').style.display = 'none';
            
            // Show success toast
            showToast('success', 'Success', `Table ${tableId ? 'updated' : 'added'} successfully!`);
            
            // Reload tables
            loadTables();
        } else {
            showToast('error', 'Error', data.message || `Failed to ${tableId ? 'update' : 'add'} table.`);
        }
    })
    .catch(error => {
        console.error(`Error ${tableId ? 'updating' : 'adding'} table:`, error);
        showToast('error', 'Error', `Failed to ${tableId ? 'update' : 'add'} table.`);
    });
}

// Menu Item Modal Functions
function initMenuItemModal() {
    const saveBtn = document.getElementById('menu-item-modal-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveMenuItem();
        });
    }
    
    // Image preview
    const imageInput = document.getElementById('modal-menu-item-image');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            previewImage(this);
        });
    }
}

// Preview image
function previewImage(input) {
    const preview = document.getElementById('preview-image');
    if (!preview) return;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Open Menu Item Modal
function openMenuItemModal(menuItemId = null) {
    const modal = document.getElementById('menu-item-modal');
    const form = document.getElementById('menu-item-form');
    const modalTitle = document.getElementById('menu-item-modal-title');
    
    if (!modal || !form || !modalTitle) return;
    
    // Clear form
    form.reset();
    
    // Reset image preview
    document.getElementById('preview-image').src = '/images/placeholder.jpg';
    
    // Set menu item ID (if editing)
    document.getElementById('menu-item-id').value = menuItemId;
    
    // Set modal title
    modalTitle.textContent = menuItemId ? 'Edit Menu Item' : 'Add New Menu Item';
    
    // If editing, load menu item data
    if (menuItemId) {
        loadMenuItemDetails(menuItemId);
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Load menu item details
function loadMenuItemDetails(menuItemId) {
    fetch(`/api/admin/menu/${menuItemId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const menuItem = data.menuItem;
            
            // Populate form fields
            document.getElementById('modal-menu-item-name').value = menuItem.name;
            document.getElementById('modal-menu-item-price').value = menuItem.price;
            document.getElementById('modal-menu-item-description').value = menuItem.description;
            document.getElementById('modal-menu-item-category').value = menuItem.category;
            document.getElementById('modal-menu-item-subcategory').value = menuItem.subcategory;
            
            // Update image preview if available
            if (menuItem.image) {
                document.getElementById('preview-image').src = menuItem.image;
            }
        } else {
            showToast('error', 'Error', 'Failed to load menu item details.');
        }
    })
    .catch(error => {
        console.error('Error loading menu item details:', error);
        showToast('error', 'Error', 'Failed to load menu item details.');
    });
}

// Save menu item
function saveMenuItem() {
    const form = document.getElementById('menu-item-form');
    if (!form) return;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData(form);
    
    // Get menu item ID
    const menuItemId = document.getElementById('menu-item-id').value;
    
    // API endpoint and method
    const apiUrl = menuItemId ? `/api/admin/menu/${menuItemId}` : '/api/admin/menu';
    const apiMethod = menuItemId ? 'PUT' : 'POST';
    
    // Send request
    fetch(apiUrl, {
        method: apiMethod,
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal
            document.getElementById('menu-item-modal').style.display = 'none';
            
            // Show success toast
            showToast('success', 'Success', `Menu item ${menuItemId ? 'updated' : 'added'} successfully!`);
            
            // Reload menu items
            loadMenuItems();
        } else {
            showToast('error', 'Error', data.message || `Failed to ${menuItemId ? 'update' : 'add'} menu item.`);
        }
    })
    .catch(error => {
        console.error(`Error ${menuItemId ? 'updating' : 'adding'} menu item:`, error);
        showToast('error', 'Error', `Failed to ${menuItemId ? 'update' : 'add'} menu item.`);
    });
}

// User Modal Functions
function initUserModal() {
    const saveBtn = document.getElementById('user-modal-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveUser();
        });
    }
}

// Open User Modal
function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const modalTitle = document.getElementById('user-modal-title');
    const passwordGroup = document.getElementById('password-group');
    
    if (!modal || !form || !modalTitle || !passwordGroup) return;
    
    // Clear form
    form.reset();
    
    // Set user ID (if editing)
    document.getElementById('user-id').value = userId;
    
    // Set modal title
    modalTitle.textContent = userId ? 'Edit User' : 'Add New User';
    
    // Show/hide password field
    passwordGroup.style.display = userId ? 'none' : 'block';
    
    // If editing, load user data
    if (userId) {
        loadUserDetails(userId);
    } else {
        // Set default values for new user
        document.getElementById('modal-user-role').value = 'customer';
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Load user details
function loadUserDetails(userId) {
    fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const user = data.user;
            
            // Populate form fields
            document.getElementById('modal-user-first-name').value = user.first_name;
            document.getElementById('modal-user-last-name').value = user.last_name;
            document.getElementById('modal-user-email').value = user.email;
            document.getElementById('modal-user-phone').value = user.phone || '';
            document.getElementById('modal-user-role').value = user.role;
        } else {
            showToast('error', 'Error', 'Failed to load user details.');
        }
    })
    .catch(error => {
        console.error('Error loading user details:', error);
        showToast('error', 'Error', 'Failed to load user details.');
    });
}

// Save user
function saveUser() {
    const form = document.getElementById('user-form');
    if (!form) return;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const userId = document.getElementById('user-id').value;
    const formData = {
        firstName: document.getElementById('modal-user-first-name').value,
        lastName: document.getElementById('modal-user-last-name').value,
        email: document.getElementById('modal-user-email').value,
        phone: document.getElementById('modal-user-phone').value,
        role: document.getElementById('modal-user-role').value
    };
    
    // Add password for new users
    if (!userId) {
        formData.password = document.getElementById('modal-user-password').value;
    }
    
    // API endpoint and method
    const apiUrl = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
    const apiMethod = userId ? 'PUT' : 'POST';
    
    // Send request
    fetch(apiUrl, {
        method: apiMethod,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal
            document.getElementById('user-modal').style.display = 'none';
            
            // Show success toast
            showToast('success', 'Success', `User ${userId ? 'updated' : 'added'} successfully!`);
            
            // Reload users
            loadUsers();
        } else {
            showToast('error', 'Error', data.message || `Failed to ${userId ? 'update' : 'add'} user.`);
        }
    })
    .catch(error => {
        console.error(`Error ${userId ? 'updating' : 'adding'} user:`, error);
        showToast('error', 'Error', `Failed to ${userId ? 'update' : 'add'} user.`);
    });
}

// Confirmation Modal Functions
function initConfirmModal() {
    const confirmBtn = document.getElementById('confirm-modal-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const modal = document.getElementById('confirm-modal');
            const callback = modal.__callback;
            
            if (typeof callback === 'function') {
                callback();
            }
            
            modal.style.display = 'none';
        });
    }
}

// Show confirmation modal
function showConfirmModal(title, message, callback) {
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('confirm-modal-title');
    const modalMessage = document.getElementById('confirm-modal-message');
    
    if (!modal || !modalTitle || !modalMessage) return;
    
    // Set modal content
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Store callback
    modal.__callback = callback;
    
    // Show modal
    modal.style.display = 'block';
}

// Settings Functions
function saveGeneralSettings() {
    const form = document.getElementById('general-settings-form');
    if (!form) return;
    
    // Get form data
    const formData = {
        restaurantName: document.getElementById('restaurant-name').value,
        restaurantAddress: document.getElementById('restaurant-address').value,
        restaurantPhone: document.getElementById('restaurant-phone').value,
        restaurantEmail: document.getElementById('restaurant-email').value,
        restaurantCurrency: document.getElementById('restaurant-currency').value
    };
    
    // Send request
    fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Success', 'General settings saved successfully!');
        } else {
            showToast('error', 'Error', data.message || 'Failed to save general settings.');
        }
    })
    .catch(error => {
        console.error('Error saving general settings:', error);
        showToast('error', 'Error', 'Failed to save general settings.');
    });
}

function saveBusinessHours() {
    // Implementation for saving business hours
    showToast('success', 'Success', 'Business hours saved successfully!');
}

function saveEmailSettings() {
    // Implementation for saving email settings
    showToast('success', 'Success', 'Email settings saved successfully!');
}

function saveSeoSettings() {
    // Implementation for saving SEO settings
    showToast('success', 'Success', 'SEO settings saved successfully!');
}

function sendTestEmail() {
    // Implementation for sending test email
    showToast('info', 'Sending', 'Sending test email...');
    
    setTimeout(() => {
        showToast('success', 'Success', 'Test email sent successfully!');
    }, 2000);
}

// CRUD Functions for Reservations, Orders, Tables, Menu Items, Users
function viewReservation(id) {
    // Implementation for viewing reservation details
    console.log('View reservation:', id);
}

function editReservation(id) {
    // Open reservation modal for editing
    openReservationModal(id);
}

function deleteReservation(id) {
    // Show confirmation modal
    showConfirmModal('Delete Reservation', 'Are you sure you want to delete this reservation?', () => {
        // Send delete request
        fetch(`/api/admin/reservations/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', 'Reservation deleted successfully!');
                loadReservations();
            } else {
                showToast('error', 'Error', data.message || 'Failed to delete reservation.');
            }
        })
        .catch(error => {
            console.error('Error deleting reservation:', error);
            showToast('error', 'Error', 'Failed to delete reservation.');
        });
    });
}

function viewOrder(id) {
    // Implementation for viewing order details
    console.log('View order:', id);
}

function deleteOrder(id) {
    // Show confirmation modal
    showConfirmModal('Delete Order', 'Are you sure you want to delete this order?', () => {
        // Send delete request
        fetch(`/api/admin/orders/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', 'Order deleted successfully!');
                loadOrders();
            } else {
                showToast('error', 'Error', data.message || 'Failed to delete order.');
            }
        })
        .catch(error => {
            console.error('Error deleting order:', error);
            showToast('error', 'Error', 'Failed to delete order.');
        });
    });
}

function editTable(id) {
    // Open table modal for editing
    openTableModal(id);
}

function deleteTable(id) {
    // Show confirmation modal
    showConfirmModal('Delete Table', 'Are you sure you want to delete this table?', () => {
        // Send delete request
        fetch(`/api/admin/tables/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', 'Table deleted successfully!');
                loadTables();
            } else {
                showToast('error', 'Error', data.message || 'Failed to delete table.');
            }
        })
        .catch(error => {
            console.error('Error deleting table:', error);
            showToast('error', 'Error', 'Failed to delete table.');
        });
    });
}

function viewMenuItem(id) {
    // Implementation for viewing menu item details
    console.log('View menu item:', id);
}

function editMenuItem(id) {
    // Open menu item modal for editing
    openMenuItemModal(id);
}

function deleteMenuItem(id) {
    // Show confirmation modal
    showConfirmModal('Delete Menu Item', 'Are you sure you want to delete this menu item?', () => {
        // Send delete request
        fetch(`/api/admin/menu/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', 'Menu item deleted successfully!');
                loadMenuItems();
            } else {
                showToast('error', 'Error', data.message || 'Failed to delete menu item.');
            }
        })
        .catch(error => {
            console.error('Error deleting menu item:', error);
            showToast('error', 'Error', 'Failed to delete menu item.');
        });
    });
}

function viewUser(id) {
    // Implementation for viewing user details
    console.log('View user:', id);
}

function editUser(id) {
    // Open user modal for editing
    openUserModal(id);
}

function deleteUser(id) {
    // Show confirmation modal
    showConfirmModal('Delete User', 'Are you sure you want to delete this user?', () => {
        // Send delete request
        fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', 'User deleted successfully!');
                loadUsers();
            } else {
                showToast('error', 'Error', data.message || 'Failed to delete user.');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showToast('error', 'Error', 'Failed to delete user.');
        });
    });
}

// Utility Functions
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', function() {
        toastContainer.removeChild(toast);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toastContainer.removeChild(toast);
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

function generatePagination(containerId, currentPage, totalPages, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    
    // Previous button
    html += `<a href="#" class="page-link ${currentPage === 1 ? 'disabled' : ''}" ${currentPage > 1 ? `onclick="event.preventDefault(); ${loadFunction.name}(${currentPage - 1})"` : ''}>&laquo; Previous</a>`;
    
    // Page links
    const maxLinks = 5;
    const halfLinks = Math.floor(maxLinks / 2);
    
    let startPage = Math.max(1, currentPage - halfLinks);
    let endPage = Math.min(totalPages, startPage + maxLinks - 1);
    
    if (endPage - startPage + 1 < maxLinks) {
        startPage = Math.max(1, endPage - maxLinks + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<a href="#" class="page-link ${i === currentPage ? 'active' : ''}" onclick="event.preventDefault(); ${loadFunction.name}(${i})">${i}</a>`;
    }
    
    // Next button
    html += `<a href="#" class="page-link ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage < totalPages ? `onclick="event.preventDefault(); ${loadFunction.name}(${currentPage + 1})"` : ''}>Next &raquo;</a>`;
    
    container.innerHTML = html;
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
        return 'Just now';
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    
    if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    
    if (days < 30) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Convert to months
    const months = Math.floor(days / 30);
    
    if (months < 12) {
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // Convert to years
    const years = Math.floor(months / 12);
    
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
    field.setAttribute('type', type);
    
    // Toggle eye icon
    const icon = field.nextElementSibling.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }
}

// ========================================
// ADDITIONAL ADMIN FEATURES TO ADD TO YOUR admin.js FILE
// ========================================

// Add these functions to your existing admin.js file

// ==== ACTIVITY TRACKING FUNCTIONS ====
// Track user activities for admin analytics
function trackUserActivity(activityType, details = {}) {
    const activityData = {
        activityType: activityType,
        details: details,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    fetch('/api/track-activity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData),
        credentials: 'include'
    }).catch(error => {
        console.error('Error tracking activity:', error);
    });
}

// ==== ENHANCED DASHBOARD ANALYTICS ====
// Load comprehensive dashboard analytics
function loadEnhancedDashboardAnalytics() {
    // Load today's detailed stats
    Promise.all([
        fetch('/api/admin/analytics/today', { credentials: 'include' }),
        fetch('/api/admin/analytics/week', { credentials: 'include' }),
        fetch('/api/admin/analytics/month', { credentials: 'include' }),
        fetch('/api/admin/analytics/popular-items', { credentials: 'include' }),
        fetch('/api/admin/analytics/customer-insights', { credentials: 'include' })
    ]).then(responses => {
        return Promise.all(responses.map(r => r.json()));
    }).then(data => {
        if (data.every(d => d.success)) {
            updateEnhancedDashboard(data);
        }
    }).catch(error => {
        console.error('Error loading enhanced analytics:', error);
    });
}

function updateEnhancedDashboard(analyticsData) {
    const [todayData, weekData, monthData, popularItems, customerInsights] = analyticsData;
    
    // Update additional dashboard cards
    updateDashboardCard('avg-order-value', `₹${todayData.avgOrderValue || 0}`);
    updateDashboardCard('popular-item', popularItems.topItem || 'N/A');
    updateDashboardCard('customer-satisfaction', `${customerInsights.avgRating || 0}/5`);
    updateDashboardCard('table-utilization', `${weekData.tableUtilization || 0}%`);
    
    // Create enhanced charts
    createRevenueVsOrdersChart(weekData.revenueVsOrders);
    createCustomerActivityHeatmap(weekData.customerActivity);
    createPopularItemsChart(popularItems.items);
}

function updateDashboardCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.textContent = value;
    }
}

// ==== REAL-TIME UPDATES ====
// WebSocket or polling for real-time updates
function initializeRealTimeUpdates() {
    // Poll for updates every 30 seconds
    setInterval(() => {
        checkForNewActivity();
    }, 30000);
}

function checkForNewActivity() {
    fetch('/api/admin/activity/new-since', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastCheck: localStorage.getItem('lastActivityCheck') || new Date().toISOString() }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.newActivity.length > 0) {
            showNewActivityNotification(data.newActivity.length);
            updateRecentActivityList(data.newActivity);
            localStorage.setItem('lastActivityCheck', new Date().toISOString());
        }
    })
    .catch(error => console.error('Error checking for new activity:', error));
}

function showNewActivityNotification(count) {
    // Create a notification bubble
    const notification = document.createElement('div');
    notification.className = 'admin-notification';
    notification.innerHTML = `${count} new ${count === 1 ? 'activity' : 'activities'}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==== ADVANCED FILTERING AND SEARCH ====
// Enhanced search functionality across all sections
function initializeAdvancedSearch() {
    // Global search functionality
    const globalSearch = document.getElementById('global-admin-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce(performGlobalSearch, 300));
    }
}

function performGlobalSearch(searchTerm) {
    if (searchTerm.length < 2) return;
    
    Promise.all([
        searchReservations(searchTerm),
        searchOrders(searchTerm),
        searchUsers(searchTerm),
        searchMenuItems(searchTerm)
    ]).then(results => {
        displayGlobalSearchResults(results, searchTerm);
    });
}

function displayGlobalSearchResults(results, searchTerm) {
    const [reservations, orders, users, menuItems] = results;
    
    // Create search results popup
    const resultsContainer = document.getElementById('global-search-results') || createSearchResultsContainer();
    
    resultsContainer.innerHTML = `
        <div class="search-results-header">
            <h3>Search Results for "${searchTerm}"</h3>
            <button class="close-search" onclick="closeGlobalSearch()">&times;</button>
        </div>
        <div class="search-results-content">
            ${createSearchSection('Reservations', reservations, 'reservation')}
            ${createSearchSection('Orders', orders, 'order')}
            ${createSearchSection('Users', users, 'user')}
            ${createSearchSection('Menu Items', menuItems, 'menu')}
        </div>
    `;
    
    resultsContainer.style.display = 'block';
}

// ==== BULK OPERATIONS ====
// Bulk operations for admin efficiency
function initializeBulkOperations() {
    // Add checkboxes to all admin tables
    addBulkSelectionToTables();
    
    // Bulk action buttons
    const bulkActionButtons = document.querySelectorAll('.bulk-action-btn');
    bulkActionButtons.forEach(btn => {
        btn.addEventListener('click', handleBulkAction);
    });
}

function addBulkSelectionToTables() {
    const adminTables = document.querySelectorAll('.admin-table');
    adminTables.forEach(table => {
        // Add select all checkbox to header
        const headerRow = table.querySelector('thead tr');
        if (headerRow && !headerRow.querySelector('.bulk-select-all')) {
            const selectAllCell = document.createElement('th');
            selectAllCell.innerHTML = '<input type="checkbox" class="bulk-select-all">';
            headerRow.insertBefore(selectAllCell, headerRow.firstChild);
        }
        
        // Add individual checkboxes to each row
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            if (!row.querySelector('.bulk-select-item')) {
                const selectCell = document.createElement('td');
                selectCell.innerHTML = '<input type="checkbox" class="bulk-select-item">';
                row.insertBefore(selectCell, row.firstChild);
            }
        });
    });
    
    // Add event listeners for select all functionality
    const selectAllCheckboxes = document.querySelectorAll('.bulk-select-all');
    selectAllCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const table = this.closest('table');
            const itemCheckboxes = table.querySelectorAll('.bulk-select-item');
            itemCheckboxes.forEach(item => {
                item.checked = this.checked;
            });
            updateBulkActionButtons();
        });
    });
}

function handleBulkAction(event) {
    const action = event.target.getAttribute('data-action');
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
        alert('Please select items to perform bulk action');
        return;
    }
    
    switch (action) {
        case 'bulk-delete':
            confirmBulkDelete(selectedItems);
            break;
        case 'bulk-update-status':
            showBulkUpdateStatusModal(selectedItems);
            break;
        case 'bulk-export':
            exportSelectedItems(selectedItems);
            break;
    }
}

// ==== EXPORT FUNCTIONALITY ====
// Export data to CSV/Excel
function exportSelectedItems(items) {
    const exportData = items.map(item => ({
        id: item.id,
        type: item.type,
        data: item.data
    }));
    
    // Convert to CSV
    const csv = convertToCSV(exportData);
    downloadCSV(csv, `admin_export_${new Date().toISOString().split('T')[0]}.csv`);
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(','))
    ].join('\n');
    
    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==== ADVANCED CHARTS ====
// Create more sophisticated charts
function createRevenueVsOrdersChart(data) {
    const ctx = document.getElementById('revenue-vs-orders-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Revenue (₹)',
                data: data.revenue,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                yAxisID: 'y'
            }, {
                label: 'Orders',
                data: data.orders,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Orders'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

function createCustomerActivityHeatmap(data) {
    // Implementation for customer activity heatmap
    const ctx = document.getElementById('customer-activity-heatmap');
    if (!ctx) return;
    
    // This would use a heatmap library or custom implementation
    // For now, showing a simplified version
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.hours,
            datasets: [{
                label: 'Customer Activity',
                data: data.activity,
                backgroundColor: data.activity.map(value => 
                    `rgba(255, 99, 132, ${Math.min(value / Math.max(...data.activity), 1)})`
                )
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Customer Activity by Hour'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Activities'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hour of Day'
                    }
                }
            }
        }
    });
}

// ==== NOTIFICATION SYSTEM ====
// Admin notification system
function initializeNotificationSystem() {
    // Check for important notifications
    checkAdminNotifications();
    
    // Set up periodic checks
    setInterval(checkAdminNotifications, 60000); // Check every minute
}

function checkAdminNotifications() {
    fetch('/api/admin/notifications', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.notifications.length > 0) {
            displayAdminNotifications(data.notifications);
        }
    })
    .catch(error => console.error('Error checking notifications:', error));
}

function displayAdminNotifications(notifications) {
    const notificationContainer = document.getElementById('admin-notifications') || createNotificationContainer();
    
    notifications.forEach(notification => {
        if (!document.querySelector(`[data-notification-id="${notification.id}"]`)) {
            const notificationElement = createNotificationElement(notification);
            notificationContainer.appendChild(notificationElement);
        }
    });
}

function createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `admin-notification ${notification.type}`;
    element.setAttribute('data-notification-id', notification.id);
    
    element.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatTimeAgo(notification.created_at)}</div>
        </div>
        <div class="notification-actions">
            <button class="notification-action" onclick="markNotificationAsRead(${notification.id})">
                <i class="fas fa-check"></i>
            </button>
            <button class="notification-action" onclick="dismissNotification(${notification.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return element;
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle',
        'error': 'fa-exclamation-circle',
        'success': 'fa-check-circle',
        'reservation': 'fa-calendar-check',
        'order': 'fa-utensils',
        'user': 'fa-user',
        'system': 'fa-cog'
    };
    return icons[type] || 'fa-bell';
}

// ==== BACKUP AND RESTORE ====
// Database backup functionality
function initializeBackupRestore() {
    const backupBtn = document.getElementById('backup-database-btn');
    const restoreBtn = document.getElementById('restore-database-btn');
    
    if (backupBtn) {
        backupBtn.addEventListener('click', createDatabaseBackup);
    }
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            document.getElementById('restore-file-input').click();
        });
    }
}

function createDatabaseBackup() {
    fetch('/api/admin/backup/create', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `restaurant_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('success', 'Backup', 'Database backup created successfully!');
    })
    .catch(error => {
        console.error('Backup error:', error);
        showToast('error', 'Backup Failed', 'Failed to create database backup.');
    });
}

// ==== INITIALIZATION ====
// Initialize all admin enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on admin pages
    if (document.body.classList.contains('admin-body') || window.location.pathname.includes('/admin')) {
        initializeRealTimeUpdates();
        initializeAdvancedSearch();
        initializeBulkOperations();
        initializeNotificationSystem();
        initializeBackupRestore();
        loadEnhancedDashboardAnalytics();
    }
});

// ==== ADDITIONAL SERVER ENDPOINTS NEEDED ====
/*
Add these endpoints to your server.js file:

// Enhanced analytics endpoints
app.get('/api/admin/analytics/today', authenticateAdmin, (req, res) => {
    // Return today's detailed analytics
});

app.get('/api/admin/analytics/week', authenticateAdmin, (req, res) => {
    // Return week's analytics with customer activity patterns
});

app.get('/api/admin/analytics/popular-items', authenticateAdmin, (req, res) => {
    // Return most popular menu items and products
});

app.get('/api/admin/analytics/customer-insights', authenticateAdmin, (req, res) => {
    // Return customer behavior insights
});

// Activity tracking
app.post('/api/track-activity', (req, res) => {
    // Track user activity in user_activity_log table
});

app.get('/api/admin/activity/new-since', authenticateAdmin, (req, res) => {
    // Get new activities since last check
});

// Notifications
app.get('/api/admin/notifications', authenticateAdmin, (req, res) => {
    // Get pending admin notifications
});

// Backup/restore
app.post('/api/admin/backup/create', authenticateAdmin, (req, res) => {
    // Create database backup
});

app.post('/api/admin/backup/restore', authenticateAdmin, (req, res) => {
    // Restore from backup file
});
*/