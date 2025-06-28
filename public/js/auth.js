// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // Register form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            togglePasswordVisibility(passwordField);
        });
    });
});

// Login function with role-based redirection
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Include cookies
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Check user role and redirect accordingly
            if (data.user.role === 'admin') {
                // Redirect admin users to admin dashboard
                window.location.href = '/admin';
            } else {
                // Redirect regular users to homepage
                window.location.href = '/';
            }
        } else {
            // Show error message
            errorDiv.textContent = data.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        errorDiv.textContent = 'An error occurred. Please try again later.';
        errorDiv.style.display = 'block';
    });
}

// Enhanced checkAuthStatus function with URL-based redirection
function checkAuthStatus() {
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
            // User is logged in
            updateUIForLoggedInUser(data.profile);
            
            // Check if admin is trying to access admin page
            const currentPath = window.location.pathname;
            if (currentPath === '/admin' && data.profile.role !== 'admin') {
                // Non-admin trying to access admin page, redirect to home
                window.location.href = '/';
            }
        } else {
            // User is not logged in
            updateUIForLoggedOutUser();
            
            // Check if trying to access protected pages
            const currentPath = window.location.pathname;
            if (currentPath === '/admin' || currentPath === '/profile') {
                // Redirect to login page
                window.location.href = '/login';
            }
        }
    })
    .catch(error => {
        console.error('Auth check error:', error);
        updateUIForLoggedOutUser();
        
        // Check if trying to access protected pages
        const currentPath = window.location.pathname;
        if (currentPath === '/admin' || currentPath === '/profile') {
            // Redirect to login page
            window.location.href = '/login';
        }
    });
}

// Register function
function register() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    // Validate password match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Check if terms are accepted
    if (!document.getElementById('terms').checked) {
        errorDiv.textContent = 'You must accept the Terms and Conditions.';
        errorDiv.style.display = 'block';
        return;
    }
    
    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, email, phone, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect to login page
            window.location.href = '/login?registered=true';
        } else {
            // Show error message
            errorDiv.textContent = data.message || 'Registration failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        errorDiv.textContent = 'An error occurred. Please try again later.';
        errorDiv.style.display = 'block';
    });
}

// Logout function
function logout() {
    fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect to homepage
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Redirect anyway
        window.location.href = '/';
    });
}

// Update UI for logged in user
function updateUIForLoggedInUser(profile) {
    const userNav = document.getElementById('userNav');
    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link');
    const userName = document.getElementById('userName');
    
    // Show user nav
    if (userNav) {
        userNav.style.display = 'inline-block';
    }
    
    // Update user name
    if (userName) {
        userName.textContent = `${profile.firstName} ${profile.lastName}`;
    }
    
    // Hide login links
    loginLinks.forEach(link => {
        link.style.display = 'none';
    });
    
    // Show logout and profile links
    logoutLinks.forEach(link => {
        link.style.display = 'inline-block';
    });
    
    profileLinks.forEach(link => {
        link.style.display = 'inline-block';
    });
    
    // Add user role to body for styling
    document.body.setAttribute('data-role', profile.role);
    
    // Show admin dashboard link if admin
    if (profile.role === 'admin') {
        const adminLinks = document.querySelectorAll('.admin-link');
        adminLinks.forEach(link => {
            link.style.display = 'inline-block';
        });
    }
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    const userNav = document.getElementById('userNav');
    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link');
    const adminLinks = document.querySelectorAll('.admin-link');
    
    // Hide user nav
    if (userNav) {
        userNav.style.display = 'none';
    }
    
    // Show login links
    loginLinks.forEach(link => {
        link.style.display = 'inline-block';
    });
    
    // Hide logout and profile links
    logoutLinks.forEach(link => {
        link.style.display = 'none';
    });
    
    profileLinks.forEach(link => {
        link.style.display = 'none';
    });
    
    // Hide admin links
    adminLinks.forEach(link => {
        link.style.display = 'none';
    });
    
    // Remove user role from body
    document.body.removeAttribute('data-role');
}

// Toggle password visibility
function togglePasswordVisibility(field) {
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

