// Enhanced auth.js - Compatible with fixed server.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Auth.js loaded');
    
    checkAuthStatus();
    setupEventListeners();
    showRegistrationSuccess();
    
    // Re-check auth when page becomes visible or focused
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(checkAuthStatus, 100);
        }
    });
    
    window.addEventListener('focus', function() {
        setTimeout(checkAuthStatus, 100);
    });
});

// Setup all event listeners
function setupEventListeners() {
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
    
    // Main navigation logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Profile page logout button
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    // Password visibility toggles
    setupPasswordToggles();
}

// Setup password visibility toggles
function setupPasswordToggles() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        const toggle = field.parentElement.querySelector('.password-toggle');
        if (toggle) {
            toggle.addEventListener('click', function() {
                togglePasswordVisibility(field);
            });
        }
    });
}

// Enhanced checkAuthStatus function
function checkAuthStatus() {
    console.log('🔍 Checking auth status...');
    
    fetch('/api/user/profile', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        console.log('📊 Auth check response status:', response.status);
        if (response.ok) {
            return response.json();
        }
        throw new Error('Not authenticated');
    })
    .then(data => {
        console.log('✅ User is authenticated:', data.profile);
        
        if (data.success) {
            updateUIForLoggedInUser(data.profile);
            handleAuthenticatedPageRedirects(data.profile);
        } else {
            updateUIForLoggedOutUser();
            handleUnauthenticatedPageRedirects();
        }
    })
    .catch(error => {
        console.log('❌ User is not authenticated:', error.message);
        updateUIForLoggedOutUser();
        handleUnauthenticatedPageRedirects();
    });
}

// Handle redirects for authenticated users
function handleAuthenticatedPageRedirects(profile) {
    const currentPath = window.location.pathname;
    
    // Redirect from login/register pages
    if (currentPath === '/login' || currentPath === '/register' || currentPath === '/welcome') {
        if (profile.role === 'admin') {
            window.location.href = '/admin';
        } else {
            window.location.href = '/dashboard';
        }
        return;
    }
    
    // Prevent non-admin from accessing admin page
    if (currentPath === '/admin' && profile.role !== 'admin') {
        window.location.href = '/dashboard';
        return;
    }
}

// Handle redirects for unauthenticated users
function handleUnauthenticatedPageRedirects() {
    const currentPath = window.location.pathname;
    const protectedPaths = ['/admin', '/profile', '/dashboard'];
    
    if (protectedPaths.includes(currentPath)) {
        window.location.href = '/login';
    }
}

// Enhanced login function with better error handling
function login() {
    console.log('🔐 Starting login process...');
    
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        errorDiv.className = 'auth-error';
    }
    
    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields', errorDiv);
        return;
    }
    
    // Show loading state
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
    }
    
    console.log('📡 Sending login request for:', email);
    
    // Make login request with enhanced debugging
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            email: email, 
            password: password 
        }),
        credentials: 'include'
    })
    .then(response => {
        console.log('📊 Login response status:', response.status);
        console.log('📊 Login response headers:', [...response.headers.entries()]);
        return response.json();
    })
    .then(data => {
        console.log('📊 Login response data:', data);
        
        if (data.success) {
            console.log('✅ Login successful, redirecting to:', data.redirectTo);
            
            // Show success message
            if (errorDiv) {
                errorDiv.textContent = 'Login successful! Redirecting...';
                errorDiv.className = 'auth-success';
                errorDiv.style.display = 'block';
            }
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = data.redirectTo || '/dashboard';
            }, 1000);
        } else {
            console.log('❌ Login failed:', data.message);
            showError(data.message || 'Login failed. Please try again.', errorDiv);
            resetButton(submitButton, originalText);
        }
    })
    .catch(error => {
        console.error('💥 Login error:', error);
        showError('Network error. Please check your connection and try again.', errorDiv);
        resetButton(submitButton, originalText);
    });
}

// Enhanced register function
function register() {
    console.log('📝 Starting registration process...');
    
    const firstName = document.getElementById('firstName')?.value?.trim();
    const lastName = document.getElementById('lastName')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const errorDiv = document.getElementById('registerError');
    
    // Clear previous errors
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        errorDiv.className = 'auth-error';
    }
    
    // Validate inputs
    if (!firstName || !lastName || !email || !password) {
        showError('Please fill in all required fields', errorDiv);
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match', errorDiv);
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long', errorDiv);
        return;
    }
    
    // Check terms checkbox
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox && !termsCheckbox.checked) {
        showError('You must accept the Terms and Conditions', errorDiv);
        return;
    }
    
    // Show loading state
    const submitButton = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;
    }
    
    console.log('📡 Sending registration request for:', email);
    
    // Make registration request
    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            firstName: firstName,
            lastName: lastName, 
            email: email, 
            phone: phone, 
            password: password 
        }),
        credentials: 'include'
    })
    .then(response => {
        console.log('📊 Registration response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📊 Registration response data:', data);
        
        if (data.success) {
            console.log('✅ Registration successful');
            
            // Show success message
            if (errorDiv) {
                errorDiv.textContent = 'Registration successful! Redirecting to login...';
                errorDiv.className = 'auth-success';
                errorDiv.style.display = 'block';
            }
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = data.redirectTo || '/login?registered=true';
            }, 2000);
        } else {
            console.log('❌ Registration failed:', data.message);
            showError(data.message || 'Registration failed. Please try again.', errorDiv);
            resetButton(submitButton, originalText);
        }
    })
    .catch(error => {
        console.error('💥 Registration error:', error);
        showError('Network error. Please check your connection and try again.', errorDiv);
        resetButton(submitButton, originalText);
    });
}

// Enhanced logout function
function logout() {
    console.log('🚪 Starting logout process...');
    
    // Show loading state
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    const mainLogoutBtn = document.getElementById('logoutBtn');
    const activeLogoutBtn = profileLogoutBtn || mainLogoutBtn;
    
    if (activeLogoutBtn) {
        activeLogoutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging out...';
        activeLogoutBtn.disabled = true;
    }
    
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Logout successful');
        
        // Clear any cached data
        if (typeof(Storage) !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
        }
        
        // Update UI immediately
        updateUIForLoggedOutUser();
        
        // Show success message if notification function exists
        if (typeof showNotification === 'function') {
            showNotification('Logged out successfully!', 'success');
        }
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = data.redirectTo || '/';
        }, 1000);
    })
    .catch(error => {
        console.error('💥 Logout error:', error);
        // Update UI and redirect anyway
        updateUIForLoggedOutUser();
        window.location.href = '/';
    });
}

// Update UI for logged in user
function updateUIForLoggedInUser(profile) {
    console.log('🎨 Updating UI for logged in user:', profile.firstName, profile.lastName);
    
    // Get navigation elements
    const loginLinks = document.querySelectorAll('.login-link, a[href="/login"]');
    const registerLinks = document.querySelectorAll('.register-link, a[href="/register"]');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link, a[href="/profile"]');
    const adminLinks = document.querySelectorAll('.admin-link, a[href="/admin"]');
    const userName = document.getElementById('userName');
    
    // Update user name display
    if (userName) {
        userName.textContent = `${profile.firstName} ${profile.lastName}`;
    }
    
    // Hide login and register links
    hideElements(loginLinks);
    hideElements(registerLinks);
    
    // Show profile links
    showElements(profileLinks);
    
    // Show logout button only in profile page context
    if (window.location.pathname === '/profile') {
        showElements(logoutLinks);
    } else {
        hideElements(logoutLinks);
    }
    
    // Show admin links if user is admin
    if (profile.role === 'admin') {
        showElements(adminLinks);
    } else {
        hideElements(adminLinks);
    }
    
    // Add user role to body for CSS styling
    document.body.setAttribute('data-role', profile.role);
    document.body.setAttribute('data-authenticated', 'true');
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    console.log('🎨 Updating UI for logged out user');
    
    // Get navigation elements
    const loginLinks = document.querySelectorAll('.login-link, a[href="/login"]');
    const registerLinks = document.querySelectorAll('.register-link, a[href="/register"]');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link, a[href="/profile"]');
    const adminLinks = document.querySelectorAll('.admin-link, a[href="/admin"]');
    
    // Show login and register links
    showElements(loginLinks);
    showElements(registerLinks);
    
    // Hide logout, profile and admin links
    hideElements(logoutLinks);
    hideElements(profileLinks);
    hideElements(adminLinks);
    
    // Remove user attributes from body
    document.body.removeAttribute('data-role');
    document.body.setAttribute('data-authenticated', 'false');
}

// Helper function to hide elements
function hideElements(elements) {
    elements.forEach(element => {
        const listItem = element.tagName === 'LI' ? element : element.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
        } else {
            element.style.display = 'none';
        }
    });
}

// Helper function to show elements
function showElements(elements) {
    elements.forEach(element => {
        const listItem = element.tagName === 'LI' ? element : element.closest('li');
        if (listItem) {
            listItem.style.display = 'inline-block';
        } else {
            element.style.display = 'inline-block';
        }
    });
}

// Toggle password visibility
function togglePasswordVisibility(field) {
    if (!field) return;
    
    const isPassword = field.getAttribute('type') === 'password';
    field.setAttribute('type', isPassword ? 'text' : 'password');
    
    // Toggle eye icon
    const toggle = field.parentElement.querySelector('.password-toggle i');
    if (toggle) {
        toggle.classList.toggle('fa-eye');
        toggle.classList.toggle('fa-eye-slash');
    }
}

// Show error message
function showError(message, errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.className = 'auth-error';
        errorDiv.style.display = 'block';
    } else {
        console.error('❌', message);
        alert(message); // Fallback
    }
}

// Reset button state
function resetButton(button, originalText) {
    if (button) {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Show registration success message
function showRegistrationSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'auth-success';
        messageDiv.textContent = 'Registration successful! Please log in with your credentials.';
        messageDiv.style.margin = '10px 0';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.parentNode.insertBefore(messageDiv, loginForm);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }
}