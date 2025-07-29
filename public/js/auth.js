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

// Enhanced checkAuthStatus function with proper UI updates
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
            
            // Check if we're on login/register page and user is already logged in
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/register') {
                // Redirect to appropriate dashboard
                if (data.profile.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            }
            
            // Check if admin is trying to access admin page
            if (currentPath === '/admin' && data.profile.role !== 'admin') {
                // Non-admin trying to access admin page, redirect to dashboard
                window.location.href = '/dashboard';
            }
        } else {
            // User is not logged in
            updateUIForLoggedOutUser();
            
            // Check if trying to access protected pages
            const currentPath = window.location.pathname;
            if (currentPath === '/admin' || currentPath === '/profile' || currentPath === '/dashboard') {
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
        if (currentPath === '/admin' || currentPath === '/profile' || currentPath === '/dashboard') {
            // Redirect to login page
            window.location.href = '/login';
        }
    });
}

// Login function with role-based redirection
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // Clear any previous errors
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    
    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
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
            // Show success message briefly
            if (errorDiv) {
                errorDiv.textContent = 'Login successful! Redirecting...';
                errorDiv.className = 'auth-success';
                errorDiv.style.display = 'block';
            }
            
            // Redirect based on server response
            setTimeout(() => {
                window.location.href = data.redirectTo || '/dashboard';
            }, 1000);
        } else {
            // Show error message
            if (errorDiv) {
                errorDiv.textContent = data.message || 'Login failed. Please try again.';
                errorDiv.className = 'auth-error';
                errorDiv.style.display = 'block';
            }
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        if (errorDiv) {
            errorDiv.textContent = 'An error occurred. Please try again later.';
            errorDiv.className = 'auth-error';
            errorDiv.style.display = 'block';
        }
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
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
    
    // Clear any previous errors
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        if (errorDiv) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.className = 'auth-error';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Check if terms are accepted
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox && !termsCheckbox.checked) {
        if (errorDiv) {
            errorDiv.textContent = 'You must accept the Terms and Conditions.';
            errorDiv.className = 'auth-error';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    
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
            // Show error message
            if (errorDiv) {
                errorDiv.textContent = data.message || 'Registration failed. Please try again.';
                errorDiv.className = 'auth-error';
                errorDiv.style.display = 'block';
            }
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        if (errorDiv) {
            errorDiv.textContent = 'An error occurred. Please try again later.';
            errorDiv.className = 'auth-error';
            errorDiv.style.display = 'block';
        }
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

// Logout function
function logout() {
    // Show loading state
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging out...';
        logoutBtn.disabled = true;
    }
    
    fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear any cached data
            if (typeof(Storage) !== "undefined") {
                localStorage.clear();
                sessionStorage.clear();
            }
            
            // Update UI immediately
            updateUIForLoggedOutUser();
            
            // Redirect to login page
            window.location.href = data.redirectTo || '/login';
        } else {
            // Update UI and redirect anyway
            updateUIForLoggedOutUser();
            window.location.href = '/login';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Update UI and redirect anyway
        updateUIForLoggedOutUser();
        window.location.href = '/login';
    });
}

// Update UI for logged in user - MODIFIED to hide logout from main nav
function updateUIForLoggedInUser(profile) {
    console.log('Updating UI for logged in user:', profile);
    
    // Get all navigation elements
    const loginLinks = document.querySelectorAll('.login-link, li a[href="/login"]');
    const registerLinks = document.querySelectorAll('.register-link, li a[href="/register"]');
    const logoutLinks = document.querySelectorAll('.logout-link'); // Keep reference but don't show
    const profileLinks = document.querySelectorAll('.profile-link');
    const adminLinks = document.querySelectorAll('.admin-link');
    const userName = document.getElementById('userName');
    
    // Update user name if element exists
    if (userName) {
        userName.textContent = `${profile.firstName} ${profile.lastName}`;
    }
    
    // Hide login links (both by class and href)
    loginLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
        }
    });
    
    // Hide register links (both by class and href)
    registerLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
        }
    });
    
    // KEEP LOGOUT LINKS HIDDEN IN MAIN NAV - they should only appear in profile
    logoutLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'none'; // Changed from 'inline-block' to 'none'
        }
    });
    
    // Show profile links
    profileLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'inline-block';
        }
    });
    
    // Show admin links if user is admin
    if (profile.role === 'admin') {
        adminLinks.forEach(link => {
            const listItem = link.tagName === 'LI' ? link : link.closest('li');
            if (listItem) {
                listItem.style.display = 'inline-block';
            }
        });
    }
    
    // Add user role to body for styling
    document.body.setAttribute('data-role', profile.role);
    
    console.log('UI updated for logged in user');
}

// Enhanced logout function that works from anywhere
function logout() {
    // Show loading state - check if we're on profile page or main nav
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    const mainLogoutBtn = document.getElementById('logoutBtn');
    const activeLogoutBtn = profileLogoutBtn || mainLogoutBtn;
    
    if (activeLogoutBtn) {
        activeLogoutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging out...';
        activeLogoutBtn.disabled = true;
    }
    
    fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear any cached data
            if (typeof(Storage) !== "undefined") {
                localStorage.clear();
                sessionStorage.clear();
            }
            
            // Update UI immediately
            updateUIForLoggedOutUser();
            
            // Show success message
            if (typeof showNotification === 'function') {
                showNotification('Logged out successfully!', 'success');
            }
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = data.redirectTo || '/';
            }, 1000);
        } else {
            // Update UI and redirect anyway
            updateUIForLoggedOutUser();
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Update UI and redirect anyway
        updateUIForLoggedOutUser();
        window.location.href = '/';
    });
}

// Enhanced event listener setup
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
    
    // Main navigation logout button (if it still exists)
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
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
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

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    console.log('Updating UI for logged out user'); // Debug log
    
    // Get all navigation elements
    const loginLinks = document.querySelectorAll('.login-link, li a[href="/login"]');
    const registerLinks = document.querySelectorAll('.register-link, li a[href="/register"]');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link');
    const adminLinks = document.querySelectorAll('.admin-link');
    
    // Show login and register links
    loginLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'inline-block';
        }
    });
    
    registerLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'inline-block';
        }
    });
    
    // Hide logout, profile and admin links
    logoutLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
        }
    });
    
    profileLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
        }
    });
    
    adminLinks.forEach(link => {
        const listItem = link.tagName === 'LI' ? link : link.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
        }
    });
    
    // Remove user role from body
    document.body.removeAttribute('data-role');
    
    console.log('UI updated for logged out user'); // Debug log
}

// Toggle password visibility
function togglePasswordVisibility(field) {
    if (!field) return;
    
    const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
    field.setAttribute('type', type);
    
    // Toggle eye icon
    const icon = field.nextElementSibling?.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }
}

// Show welcome message for new registrations
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'auth-success';
        messageDiv.textContent = 'Registration successful! Please log in with your credentials.';
        messageDiv.style.margin = '10px 0';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.parentNode.insertBefore(messageDiv, loginForm);
            
            // Remove the message after 5 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }
});

// Force re-check auth status when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Delay slightly to ensure any server-side changes are reflected
        setTimeout(checkAuthStatus, 100);
    }
});

// Also check auth status when window regains focus
window.addEventListener('focus', function() {
    setTimeout(checkAuthStatus, 100);
});