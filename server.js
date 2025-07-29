require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// Use environment variables for database configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
        console.error('📍 Database Config Check:');
        console.error('   - DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Missing');
        console.error('   - DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ Missing');
        console.error('   - DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Set' : '❌ Missing');
        console.error('   - DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Missing');
        
        // Don't exit in production, try to continue
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    } else {
        console.log('✅ MySQL connected successfully!');
        
        // Create activity tracking table if it doesn't exist
        createActivityTrackingTable();
    }
});

// Handle connection errors
db.on('error', function(err) {
    console.error('💥 Database error:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Attempting to reconnect to database...');
    }
});

// Create activity tracking table
function createActivityTrackingTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS user_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            session_id VARCHAR(255) NOT NULL,
            activity_type VARCHAR(100) NOT NULL,
            activity_details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_activity_type (activity_type),
            INDEX idx_created_at (created_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `;
    
    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating activity tracking table:', err);
        } else {
            console.log('Activity tracking table ready');
        }
    });
}

// ==== MIDDLEWARE ====
// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and URL-encoded form data
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Use cookie parser middleware
app.use(cookieParser());

// Set up session
app.use(session({
    secret: process.env.SESSION_SECRET || 'spice_symphony_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware to capture IP address properly
app.use((req, res, next) => {
    req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
    next();
});

// ==== AUTHENTICATION MIDDLEWARE ====
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Admin access required' });
        }
    });
}

// Middleware to check authentication and redirect accordingly
function checkAuthAndRedirect(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) {
        // No token, redirect to welcome page
        return res.redirect('/welcome');
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret', (err, user) => {
        if (err) {
            // Invalid token, clear it and redirect to welcome page
            res.clearCookie('token');
            return res.redirect('/welcome');
        }
        
        req.user = user;
        next();
    });
}

// Helper function to round time to nearest slot
function roundTimeToNearestSlot(timeString) {
    const time = new Date(`2000-01-01T${timeString}`);
    const minutes = time.getMinutes();
    
    if (minutes < 15) {
        time.setMinutes(0);
    } else if (minutes < 45) {
        time.setMinutes(30);
    } else {
        time.setHours(time.getHours() + 1);
        time.setMinutes(0);
    }
    
    return time.toTimeString().substr(0, 5); // Format as HH:MM
}

// ==== PAGE ROUTES ====
// Create a landing page route (shows login/register options)
app.get('/welcome', (req, res) => {
    // Check if user is already logged in
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret', (err, user) => {
            if (!err) {
                // User is already authenticated, redirect based on role
                if (user.role === 'admin') {
                    return res.redirect('/admin');
                } else {
                    return res.redirect('/dashboard');
                }
            }
        });
    }
    
    // User not authenticated, show landing page
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Root route - redirect to appropriate page based on authentication
app.get('/', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/welcome');
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret', (err, user) => {
        if (err) {
            res.clearCookie('token');
            return res.redirect('/welcome');
        }
        
        // User is authenticated, serve based on role
        if (user.role === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/dashboard');
        }
    });
});

// Main website (protected route for customers)
app.get('/dashboard', checkAuthAndRedirect, (req, res) => {
    if (req.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    // Check if user is already logged in
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret', (err, user) => {
            if (!err) {
                // User is already authenticated, redirect based on role
                if (user.role === 'admin') {
                    return res.redirect('/admin');
                } else {
                    return res.redirect('/dashboard');
                }
            }
        });
    }
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    // Check if user is already logged in
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret', (err, user) => {
            if (!err) {
                // User is already authenticated, redirect based on role
                if (user.role === 'admin') {
                    return res.redirect('/admin');
                } else {
                    return res.redirect('/dashboard');
                }
            }
        });
    }
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Serve profile page (protected route)
app.get('/profile', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Serve admin dashboard (protected admin route)
app.get('/admin', authenticateAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// ==== AUTHENTICATION API ENDPOINTS ====
// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        
        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }
        
        // Check if user already exists
        const userExistsQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(userExistsQuery, [email], async (err, results) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).json({ success: false, message: 'Registration failed' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Begin transaction
            db.beginTransaction(async (err) => {
                if (err) {
                    console.error('Error starting transaction:', err);
                    return res.status(500).json({ success: false, message: 'Registration failed' });
                }
                
                try {
                    // Insert new user
                    const insertUserQuery = `
                        INSERT INTO users (email, password, first_name, last_name, phone)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    
                    db.query(insertUserQuery, [email, hashedPassword, firstName, lastName, phone || null], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error registering user:', err);
                                res.status(500).json({ success: false, message: 'Registration failed' });
                            });
                        }
                        
                        // Create empty profile for the user
                        const userId = result.insertId;
                        const createProfileQuery = 'INSERT INTO user_profiles (user_id) VALUES (?)';
                        
                        db.query(createProfileQuery, [userId], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error creating user profile:', err);
                                    res.status(500).json({ success: false, message: 'Registration failed' });
                                });
                            }
                            
                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction:', err);
                                        res.status(500).json({ success: false, message: 'Registration failed' });
                                    });
                                }
                                
                                console.log('User registered successfully:', userId);
                                res.json({ 
                                    success: true, 
                                    message: 'Registration successful',
                                    redirectTo: '/login'
                                });
                            });
                        });
                    });
                } catch (error) {
                    db.rollback(() => {
                        console.error('Registration error in transaction:', error);
                        res.status(500).json({ success: false, message: 'Registration failed' });
                    });
                }
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// User login endpoint
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        
        // Find user by email
        const findUserQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(findUserQuery, [email], async (err, results) => {
            if (err) {
                console.error('Error finding user:', err);
                return res.status(500).json({ success: false, message: 'Login failed' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            
            const user = results[0];
            
            // Compare password
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            
            // Update last login time
            db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
            
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'spice_symphony_jwt_secret',
                { expiresIn: '24h' }
            );
            
            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            // Create session
            const sessionId = require('crypto').randomBytes(16).toString('hex');
            const sessionExpiry = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours
            
            db.query(
                'INSERT INTO user_sessions (id, user_id, expires, data) VALUES (?, ?, ?, ?)',
                [sessionId, user.id, sessionExpiry, JSON.stringify({ lastActive: new Date() })],
                (err) => {
                    if (err) {
                        console.error('Error creating session:', err);
                    }
                }
            );
            
            // Determine redirect URL based on role
            const redirectTo = user.role === 'admin' ? '/admin' : '/dashboard';
            
            console.log('User logged in successfully:', user.id);
            res.json({
                success: true,
                message: 'Login successful',
                redirectTo: redirectTo,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// User logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logout successful', redirectTo: '/welcome' });
});

// ==== USER PROFILE API ENDPOINTS ====
// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    const query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, 
               p.address, p.city, p.state, p.postal_code, p.preferred_payment_method,
               p.dietary_preferences, p.allergies, p.favorite_dishes, 
               p.birthday, p.anniversary
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const user = results[0];
        
        res.json({
            success: true,
            profile: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                role: user.role,
                address: user.address,
                city: user.city,
                state: user.state,
                postalCode: user.postal_code,
                preferredPaymentMethod: user.preferred_payment_method,
                dietaryPreferences: user.dietary_preferences,
                allergies: user.allergies,
                favoriteDishes: user.favorite_dishes,
                birthday: user.birthday,
                anniversary: user.anniversary
            }
        });
    });
});

// Update user profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { firstName, lastName, phone, address, city, state, postalCode, 
            preferredPaymentMethod, dietaryPreferences, allergies, 
            favoriteDishes, birthday, anniversary } = req.body;
    
    // Begin transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: 'Failed to update profile' });
        }
        
        // Update user basic info
        const updateUserQuery = `
            UPDATE users 
            SET first_name = ?, last_name = ?, phone = ?
            WHERE id = ?
        `;
        
        db.query(updateUserQuery, [firstName, lastName, phone, userId], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error updating user info:', err);
                    res.status(500).json({ success: false, message: 'Failed to update profile' });
                });
            }
            
            // Update user profile
            const updateProfileQuery = `
                INSERT INTO user_profiles 
                    (user_id, address, city, state, postal_code, preferred_payment_method, 
                     dietary_preferences, allergies, favorite_dishes, birthday, anniversary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    address = VALUES(address),
                    city = VALUES(city),
                    state = VALUES(state),
                    postal_code = VALUES(postal_code),
                    preferred_payment_method = VALUES(preferred_payment_method),
                    dietary_preferences = VALUES(dietary_preferences),
                    allergies = VALUES(allergies),
                    favorite_dishes = VALUES(favorite_dishes),
                    birthday = VALUES(birthday),
                    anniversary = VALUES(anniversary)
            `;
            
            db.query(updateProfileQuery, [
                userId, address, city, state, postalCode, preferredPaymentMethod,
                dietaryPreferences, allergies, favoriteDishes, birthday, anniversary
            ], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating user profile:', err);
                        res.status(500).json({ success: false, message: 'Failed to update profile' });
                    });
                }
                
                // Commit transaction
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ success: false, message: 'Failed to update profile' });
                        });
                    }
                    
                    res.json({ success: true, message: 'Profile updated successfully' });
                });
            });
        });
    });
});

// Get user reservations
app.get('/api/user/reservations', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    const query = `
        SELECT r.*, t.table_number
        FROM reservations r 
        LEFT JOIN restaurant_tables t ON r.table_id = t.id
        WHERE r.user_id = ? 
        ORDER BY r.date DESC, r.time DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user reservations:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
        }
        
        res.json({ success: true, reservations: results });
    });
});

// Get user orders
app.get('/api/user/orders', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    const query = `
        SELECT * FROM orders 
        WHERE user_id = ? 
        ORDER BY order_time DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user orders:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
        }
        
        res.json({ success: true, orders: results });
    });
});

// Cancel reservation
app.delete('/api/reservation/:id', authenticateToken, (req, res) => {
    const reservationId = req.params.id;
    const userId = req.user.userId;
    
    // Verify the reservation belongs to the user
    const verifyQuery = 'SELECT * FROM reservations WHERE id = ? AND user_id = ?';
    db.query(verifyQuery, [reservationId, userId], (err, results) => {
        if (err) {
            console.error('Error verifying reservation:', err);
            return res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Reservation not found or not authorized' });
        }
        
        // Begin transaction to cancel reservation and update table availability
        db.beginTransaction((err) => {
            if (err) {
                console.error('Error starting transaction:', err);
                return res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
            }
            
            // Update reservation status to cancelled
            const updateReservationQuery = 'UPDATE reservations SET status = ? WHERE id = ?';
            db.query(updateReservationQuery, ['cancelled', reservationId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating reservation status:', err);
                        res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
                    });
                }
                
                // Update table availability if table was assigned
                if (results[0].table_id) {
                    const updateAvailabilityQuery = `
                        UPDATE table_availability 
                        SET is_available = TRUE, reservation_id = NULL 
                        WHERE table_id = ? AND date = ? AND time_slot = ? AND reservation_id = ?
                    `;
                    
                    db.query(updateAvailabilityQuery, [
                        results[0].table_id, 
                        results[0].date, 
                        results[0].time, 
                        reservationId
                    ], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error updating table availability:', err);
                                res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
                            });
                        }
                        
                        // Commit transaction
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error committing transaction:', err);
                                    res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
                                });
                            }
                            
                            res.json({ success: true, message: 'Reservation cancelled successfully' });
                        });
                    });
                } else {
                    // No table assigned, just commit
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', err);
                                res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
                            });
                        }
                        
                        res.json({ success: true, message: 'Reservation cancelled successfully' });
                    });
                }
            });
        });
    });
});

// ==== MENU API ENDPOINTS ====
// API endpoint to fetch menu items
app.get('/api/menu', (req, res) => {
    let sql = 'SELECT * FROM menu_items ORDER BY category, subcategory, name';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching menu items:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
        }

        // Group data by category and subcategory
        const groupedData = results.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = {};
            }
            if (!acc[item.category][item.subcategory]) {
                acc[item.category][item.subcategory] = [];
            }
            acc[item.category][item.subcategory].push(item);
            return acc;
        }, {});

        res.json(groupedData);
    });
});

// ==== TABLES API ENDPOINTS ====
// API endpoint to get all restaurant tables
app.get('/api/tables', (req, res) => {
    let sql = 'SELECT * FROM restaurant_tables ORDER BY section, table_number';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching tables:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch tables.' });
        }
        res.json(results);
    });
});

// API endpoint to check table availability
app.get('/api/tables/availability', (req, res) => {
    const { date, time, guests } = req.query;
    
    if (!date || !time || !guests) {
        return res.status(400).json({ success: false, message: 'Date, time, and number of guests are required.' });
    }
    
    // Validate date format
    if (isNaN(new Date(date))) {
        return res.status(400).json({ success: false, message: 'Invalid date format.' });
    }
    
    // Validate guests is a number
    const guestCount = parseInt(guests);
    if (isNaN(guestCount) || guestCount < 1) {
        return res.status(400).json({ success: false, message: 'Invalid number of guests.' });
    }
    
    // Round time to nearest hour or half-hour
    const roundedTime = roundTimeToNearestSlot(time);
    
    // Find tables with appropriate capacity and availability
    const query = `
        SELECT t.id, t.table_number, t.capacity, t.section, t.status, t.coordinates_x, t.coordinates_y
        FROM restaurant_tables t
        LEFT JOIN table_availability a ON t.id = a.table_id AND a.date = ? AND a.time_slot = ?
        WHERE t.capacity >= ? AND (a.is_available = TRUE OR a.id IS NULL) AND t.status = 'available'
        ORDER BY t.capacity ASC, t.section, t.table_number
    `;
    
    db.query(query, [date, roundedTime, guestCount], (err, results) => {
        if (err) {
            console.error('Error checking table availability:', err);
            return res.status(500).json({ success: false, message: 'Failed to check availability.' });
        }
        
        console.log(`Found ${results.length} available tables for ${guestCount} guests on ${date} at ${roundedTime}`);
        
        res.json({
            success: true,
            date,
            time: roundedTime,
            guests: guestCount,
            availableTables: results
        });
    });
});

// ==== RESERVATION API ENDPOINTS ====
// API endpoint to handle reservation form submission
app.post('/api/reservation', (req, res) => {
    const { date, time, guests, name, contact, email, seating, specialRequests, confirmationMethod, tableId } = req.body;
    
    // Get user ID if authenticated, otherwise null
    let userId = null;
    const token = req.cookies.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret');
            userId = decoded.userId;
        } catch (error) {
            // Token invalid, but continue with reservation as guest
            console.log('Invalid token for reservation, proceeding as guest');
        }
    }

    // Validate required fields
    if (!date || !time || !guests || !name || !contact || !email || !seating || !confirmationMethod) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Validate guest count
    const guestCount = parseInt(guests);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 20) {
        return res.status(400).json({ success: false, message: 'Invalid number of guests.' });
    }

    // Start a database transaction
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: 'Failed to process reservation.' });
        }

        // Insert reservation into the database
        const insertReservationSql = `
            INSERT INTO reservations (date, time, guests, name, contact, email, seating, special_requests, confirmation_method, user_id, table_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `;
        const reservationValues = [date, time, guestCount, name, contact, email, seating, specialRequests || null, confirmationMethod, userId, tableId || null];

        db.query(insertReservationSql, reservationValues, (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error inserting reservation:', err);
                    res.status(500).json({ success: false, message: 'Failed to submit reservation.' });
                });
            }

            const reservationId = result.insertId;

            // If a specific table was selected, update table availability
            if (tableId) {
                const roundedTime = roundTimeToNearestSlot(time);
                const updateTableSql = `
                    INSERT INTO table_availability (table_id, date, time_slot, is_available, reservation_id)
                    VALUES (?, ?, ?, FALSE, ?)
                    ON DUPLICATE KEY UPDATE is_available = FALSE, reservation_id = ?
                `;
                
                db.query(updateTableSql, [tableId, date, roundedTime, reservationId, reservationId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error updating table availability:', err);
                            res.status(500).json({ success: false, message: 'Failed to reserve table.' });
                        });
                    }

                    // Commit the transaction
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', err);
                                res.status(500).json({ success: false, message: 'Failed to finalize reservation.' });
                            });
                        }

                        console.log('Reservation submitted successfully:', reservationId);
                        res.json({ success: true, message: 'Reservation submitted successfully!', reservationId });
                    });
                });
            } else {
                // No specific table was selected, just commit the reservation
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ success: false, message: 'Failed to finalize reservation.' });
                        });
                    }

                    console.log('Reservation submitted successfully:', reservationId);
                    res.json({ success: true, message: 'Reservation submitted successfully!', reservationId });
                });
            }
        });
    });
});

// ==== TESTIMONIALS API ENDPOINTS ====
// API endpoint to fetch testimonials
app.get('/api/testimonials', (req, res) => {
    let sql = 'SELECT * FROM testimonials ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching testimonials:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
        }
        res.json(results);
    });
});

// API endpoint to submit a review
app.post('/api/testimonials', (req, res) => {
    const { name, role, rating, review } = req.body;

    // Validate required fields
    if (!name || !role || !rating || !review) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Ensure rating is a number
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
    }

    // Validate text fields length
    if (name.length > 255 || role.length > 255) {
        return res.status(400).json({ success: false, message: 'Name and role must be less than 255 characters.' });
    }

    if (review.length > 1000) {
        return res.status(400).json({ success: false, message: 'Review must be less than 1000 characters.' });
    }

    // Insert review into the database
    const sql = `
        INSERT INTO testimonials (name, role, rating, review)
        VALUES (?, ?, ?, ?)
    `;
    const values = [name, role, ratingNum, review];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting review:', err);
            return res.status(500).json({ success: false, message: 'Failed to submit review.' });
        }

        console.log('Review submitted successfully:', result.insertId);
        res.json({ success: true, message: 'Review submitted successfully!' });
    });
});

// ==== PRODUCTS API ENDPOINTS ====
// API endpoint to fetch products
app.get('/api/products', (req, res) => {
    let sql = 'SELECT * FROM products ORDER BY category, name';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
        }
        res.json(results);
    });
});

// ==== ENHANCED ORDERS API ENDPOINTS ====
// API endpoint to submit orders (enhanced with better validation and error handling)
app.post('/api/orders', (req, res) => {
    const { name, tableNumber, specialRequests, items, total } = req.body;
    
    console.log('Received order request:', { name, tableNumber, specialRequests, items, total });
    
    // Get user ID if authenticated, otherwise null
    let userId = null;
    const token = req.cookies.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spice_symphony_jwt_secret');
            userId = decoded.userId;
            console.log('Authenticated user placing order:', userId);
        } catch (error) {
            // Token invalid, but continue with order as guest
            console.log('Invalid token for order, proceeding as guest');
        }
    }

    // Enhanced validation
    if (!name || !tableNumber || !items || total === undefined || total === null) {
        console.error('Missing required fields for order:', { name, tableNumber, items, total });
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields. Please provide name, table number, items, and total.' 
        });
    }

    // Validate name and table number
    if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid name provided.' 
        });
    }

    if (typeof tableNumber !== 'string' || tableNumber.trim().length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid table number provided.' 
        });
    }

    // Validate total amount
    const totalAmount = parseFloat(total);
    if (isNaN(totalAmount) || totalAmount < 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid total amount.' 
        });
    }

    // Validate items
    if (typeof items !== 'string' || items.trim().length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid items provided.' 
        });
    }

    // Validate field lengths
    if (name.length > 255 || tableNumber.length > 50) {
        return res.status(400).json({ 
            success: false, 
            message: 'Name or table number too long.' 
        });
    }

    // Validate special requests length if provided
    if (specialRequests && specialRequests.length > 1000) {
        return res.status(400).json({ 
            success: false, 
            message: 'Special requests too long.' 
        });
    }

    const query = `
        INSERT INTO orders (name, table_number, special_requests, items, total, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    console.log('Inserting order with values:', [name.trim(), tableNumber.trim(), specialRequests?.trim() || null, items.trim(), totalAmount, userId]);

    db.query(query, [name.trim(), tableNumber.trim(), specialRequests?.trim() || null, items.trim(), totalAmount, userId], (err, result) => {
        if (err) {
            console.error('Error inserting order:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to submit order. Please try again.' 
            });
        }
        
        console.log('Order submitted successfully:', result.insertId);
        res.json({ 
            success: true, 
            message: 'Order submitted successfully!',
            orderId: result.insertId 
        });
    });
});

// Reorder items from previous order
app.post('/api/orders/:id/reorder', authenticateToken, (req, res) => {
    const orderId = req.params.id;
    const userId = req.user.userId;
    
    // Get the original order
    const getOrderQuery = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
    db.query(getOrderQuery, [orderId, userId], (err, results) => {
        if (err) {
            console.error('Error getting order for reorder:', err);
            return res.status(500).json({ success: false, message: 'Failed to reorder items' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
        }
        
        // For now, just return success (you can implement cart addition logic here)
        res.json({ success: true, message: 'Items would be added to cart' });
    });
});

// ==== ADMIN API ENDPOINTS ====
// Get admin stats for dashboard
app.get('/api/admin/stats/reservations/today', authenticateAdmin, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
        SELECT COUNT(*) AS count FROM reservations 
        WHERE date = ?
    `;
    
    db.query(query, [today], (err, results) => {
        if (err) {
            console.error('Error getting today\'s reservations count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get reservations count' });
        }
        
        res.json({ success: true, count: results[0].count });
    });
});

app.get('/api/admin/stats/orders/today', authenticateAdmin, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
        SELECT COUNT(*) AS count FROM orders 
        WHERE DATE(order_time) = ?
    `;
    
    db.query(query, [today], (err, results) => {
        if (err) {
            console.error('Error getting today\'s orders count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get orders count' });
        }
        
        res.json({ success: true, count: results[0].count });
    });
});

app.get('/api/admin/stats/users/total', authenticateAdmin, (req, res) => {
    const query = `
        SELECT COUNT(*) AS count FROM users 
        WHERE role = 'customer'
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getting total customers count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get customers count' });
        }
        
        res.json({ success: true, count: results[0].count });
    });
});

app.get('/api/admin/stats/revenue/month', authenticateAdmin, (req, res) => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const query = `
        SELECT SUM(total) AS revenue FROM orders 
        WHERE DATE(order_time) BETWEEN ? AND ?
    `;
    
    db.query(query, [firstDay, lastDay], (err, results) => {
        if (err) {
            console.error('Error getting monthly revenue:', err);
            return res.status(500).json({ success: false, message: 'Failed to get monthly revenue' });
        }
        
        res.json({ success: true, revenue: results[0].revenue || 0 });
    });
});

// ==== ADMIN RESERVATIONS MANAGEMENT ====
// Get all reservations with pagination and filtering
app.get('/api/admin/reservations', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const date = req.query.date;
    const status = req.query.status;
    const search = req.query.search;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (date) {
        whereConditions.push('r.date = ?');
        queryParams.push(date);
    }
    
    if (status && status !== 'all') {
        whereConditions.push('r.status = ?');
        queryParams.push(status);
    }
    
    if (search) {
        whereConditions.push('(r.name LIKE ? OR r.contact LIKE ? OR r.email LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM reservations r 
        LEFT JOIN users u ON r.user_id = u.id 
        ${whereClause}
    `;
    
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error('Error getting reservations count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get reservations' });
        }
        
        const totalReservations = countResult[0].total;
        const totalPages = Math.ceil(totalReservations / limit);
        
        // Get reservations with pagination
        const dataQuery = `
            SELECT r.*, u.first_name, u.last_name,
                   t.table_number
            FROM reservations r 
            LEFT JOIN users u ON r.user_id = u.id 
            LEFT JOIN restaurant_tables t ON r.table_id = t.id
            ${whereClause}
            ORDER BY r.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(limit, offset);
        
        db.query(dataQuery, queryParams, (err, results) => {
            if (err) {
                console.error('Error getting reservations:', err);
                return res.status(500).json({ success: false, message: 'Failed to get reservations' });
            }
            
            res.json({
                success: true,
                reservations: results,
                currentPage: page,
                totalPages: totalPages,
                totalReservations: totalReservations
            });
        });
    });
});

// Get single reservation details
app.get('/api/admin/reservations/:id', authenticateAdmin, (req, res) => {
    const reservationId = req.params.id;
    
    const query = `
        SELECT r.*, u.first_name, u.last_name, u.email as user_email,
               t.table_number
        FROM reservations r 
        LEFT JOIN users u ON r.user_id = u.id 
        LEFT JOIN restaurant_tables t ON r.table_id = t.id
        WHERE r.id = ?
    `;
    
    db.query(query, [reservationId], (err, results) => {
        if (err) {
            console.error('Error getting reservation details:', err);
            return res.status(500).json({ success: false, message: 'Failed to get reservation details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        
        res.json({ success: true, reservation: results[0] });
    });
});

// Update reservation
app.put('/api/admin/reservations/:id', authenticateAdmin, (req, res) => {
    const reservationId = req.params.id;
    const { date, time, name, guests, contact, email, seating, status, specialRequests, tableId } = req.body;
    
    const query = `
        UPDATE reservations 
        SET date = ?, time = ?, name = ?, guests = ?, contact = ?, email = ?, 
            seating = ?, status = ?, special_requests = ?, table_id = ?
        WHERE id = ?
    `;
    
    db.query(query, [date, time, name, guests, contact, email, seating, status, specialRequests, tableId, reservationId], (err, result) => {
        if (err) {
            console.error('Error updating reservation:', err);
            return res.status(500).json({ success: false, message: 'Failed to update reservation' });
        }
        
        res.json({ success: true, message: 'Reservation updated successfully' });
    });
});

// Delete reservation
app.delete('/api/admin/reservations/:id', authenticateAdmin, (req, res) => {
    const reservationId = req.params.id;
    
    db.query('DELETE FROM reservations WHERE id = ?', [reservationId], (err, result) => {
        if (err) {
            console.error('Error deleting reservation:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete reservation' });
        }
        
        res.json({ success: true, message: 'Reservation deleted successfully' });
    });
});

// ==== ADMIN ORDERS MANAGEMENT ====
// Get all orders with pagination and filtering
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const date = req.query.date;
    const search = req.query.search;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (date) {
        whereConditions.push('DATE(o.order_time) = ?');
        queryParams.push(date);
    }
    
    if (search) {
        whereConditions.push('(o.name LIKE ? OR o.id LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error('Error getting orders count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get orders' });
        }
        
        const totalOrders = countResult[0].total;
        const totalPages = Math.ceil(totalOrders / limit);
        
        // Get orders with pagination
        const dataQuery = `
            SELECT o.*, u.first_name, u.last_name
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ${whereClause}
            ORDER BY o.order_time DESC 
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(limit, offset);
        
        db.query(dataQuery, queryParams, (err, results) => {
            if (err) {
                console.error('Error getting orders:', err);
                return res.status(500).json({ success: false, message: 'Failed to get orders' });
            }
            
            res.json({
                success: true,
                orders: results,
                currentPage: page,
                totalPages: totalPages,
                totalOrders: totalOrders
            });
        });
    });
});

// Delete order
app.delete('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
    const orderId = req.params.id;
    
    db.query('DELETE FROM orders WHERE id = ?', [orderId], (err, result) => {
        if (err) {
            console.error('Error deleting order:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete order' });
        }
        
        res.json({ success: true, message: 'Order deleted successfully' });
    });
});

// ==== ADMIN TABLES MANAGEMENT ====
// Get all tables with filtering
app.get('/api/admin/tables', authenticateAdmin, (req, res) => {
    const section = req.query.section;
    const status = req.query.status;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (section && section !== 'all') {
        whereConditions.push('section = ?');
        queryParams.push(section);
    }
    
    if (status && status !== 'all') {
        whereConditions.push('status = ?');
        queryParams.push(status);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const query = `SELECT * FROM restaurant_tables ${whereClause} ORDER BY table_number`;
    
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error getting tables:', err);
            return res.status(500).json({ success: false, message: 'Failed to get tables' });
        }
        
        res.json({ success: true, tables: results });
    });
});

// Get single table details
app.get('/api/admin/tables/:id', authenticateAdmin, (req, res) => {
    const tableId = req.params.id;
    
    db.query('SELECT * FROM restaurant_tables WHERE id = ?', [tableId], (err, results) => {
        if (err) {
            console.error('Error getting table details:', err);
            return res.status(500).json({ success: false, message: 'Failed to get table details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }
        
        res.json({ success: true, table: results[0] });
    });
});

// Add new table
app.post('/api/admin/tables', authenticateAdmin, (req, res) => {
    const { tableNumber, capacity, section, status, coordinatesX, coordinatesY } = req.body;
    
    // Validate required fields
    if (!tableNumber || !capacity || !section || !status) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    
    const query = `
        INSERT INTO restaurant_tables (table_number, capacity, section, status, coordinates_x, coordinates_y)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [tableNumber, capacity, section, status, coordinatesX || 0, coordinatesY || 0], (err, result) => {
        if (err) {
            console.error('Error adding table:', err);
            return res.status(500).json({ success: false, message: 'Failed to add table' });
        }
        
        res.json({ success: true, message: 'Table added successfully', tableId: result.insertId });
    });
});

// Update table
app.put('/api/admin/tables/:id', authenticateAdmin, (req, res) => {
    const tableId = req.params.id;
    const { tableNumber, capacity, section, status, coordinatesX, coordinatesY } = req.body;
    
    const query = `
        UPDATE restaurant_tables 
        SET table_number = ?, capacity = ?, section = ?, status = ?, coordinates_x = ?, coordinates_y = ?
        WHERE id = ?
    `;
    
    db.query(query, [tableNumber, capacity, section, status, coordinatesX, coordinatesY, tableId], (err, result) => {
        if (err) {
            console.error('Error updating table:', err);
            return res.status(500).json({ success: false, message: 'Failed to update table' });
        }
        
        res.json({ success: true, message: 'Table updated successfully' });
    });
});

// Delete table
app.delete('/api/admin/tables/:id', authenticateAdmin, (req, res) => {
    const tableId = req.params.id;
    
    db.query('DELETE FROM restaurant_tables WHERE id = ?', [tableId], (err, result) => {
        if (err) {
            console.error('Error deleting table:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete table' });
        }
        
        res.json({ success: true, message: 'Table deleted successfully' });
    });
});

// ==== ADMIN MENU MANAGEMENT ====
// Get all menu items with pagination and filtering
app.get('/api/admin/menu', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (category && category !== 'all') {
        whereConditions.push('category = ?');
        queryParams.push(category);
    }
    
    if (search) {
        whereConditions.push('name LIKE ?');
        queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM menu_items ${whereClause}`;
    
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error('Error getting menu items count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get menu items' });
        }
        
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        
        // Get menu items with pagination
        const dataQuery = `
            SELECT * FROM menu_items 
            ${whereClause}
            ORDER BY category, subcategory, name 
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(limit, offset);
        
        db.query(dataQuery, queryParams, (err, results) => {
            if (err) {
                console.error('Error getting menu items:', err);
                return res.status(500).json({ success: false, message: 'Failed to get menu items' });
            }
            
            res.json({
                success: true,
                menuItems: results,
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems
            });
        });
    });
});

// Get single menu item details
app.get('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
    const itemId = req.params.id;
    
    db.query('SELECT * FROM menu_items WHERE id = ?', [itemId], (err, results) => {
        if (err) {
            console.error('Error getting menu item details:', err);
            return res.status(500).json({ success: false, message: 'Failed to get menu item details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }
        
        res.json({ success: true, menuItem: results[0] });
    });
});

// Add new menu item
app.post('/api/admin/menu', authenticateAdmin, (req, res) => {
    const { name, description, price, category, subcategory, image } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !subcategory) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    
    const query = `
        INSERT INTO menu_items (name, description, price, category, subcategory, image)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [name, description, price, category, subcategory, image], (err, result) => {
        if (err) {
            console.error('Error adding menu item:', err);
            return res.status(500).json({ success: false, message: 'Failed to add menu item' });
        }
        
        res.json({ success: true, message: 'Menu item added successfully', itemId: result.insertId });
    });
});

// Update menu item
app.put('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
    const itemId = req.params.id;
    const { name, description, price, category, subcategory, image } = req.body;
    
    const query = `
        UPDATE menu_items 
        SET name = ?, description = ?, price = ?, category = ?, subcategory = ?, image = ?
        WHERE id = ?
    `;
    
    db.query(query, [name, description, price, category, subcategory, image, itemId], (err, result) => {
        if (err) {
            console.error('Error updating menu item:', err);
            return res.status(500).json({ success: false, message: 'Failed to update menu item' });
        }
        
        res.json({ success: true, message: 'Menu item updated successfully' });
    });
});

// Delete menu item
app.delete('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
    const itemId = req.params.id;
    
    db.query('DELETE FROM menu_items WHERE id = ?', [itemId], (err, result) => {
        if (err) {
            console.error('Error deleting menu item:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete menu item' });
        }
        
        res.json({ success: true, message: 'Menu item deleted successfully' });
    });
});

// ==== ADMIN USERS MANAGEMENT ====
// Get all users with pagination and filtering
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (role && role !== 'all') {
        whereConditions.push('role = ?');
        queryParams.push(role);
    }
    
    if (search) {
        whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error('Error getting users count:', err);
            return res.status(500).json({ success: false, message: 'Failed to get users' });
        }
        
        const totalUsers = countResult[0].total;
        const totalPages = Math.ceil(totalUsers / limit);
        
        // Get users with pagination (don't return passwords)
        const dataQuery = `
            SELECT id, email, first_name, last_name, phone, role, created_at, last_login
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(limit, offset);
        
        db.query(dataQuery, queryParams, (err, results) => {
            if (err) {
                console.error('Error getting users:', err);
                return res.status(500).json({ success: false, message: 'Failed to get users' });
            }
            
            res.json({
                success: true,
                users: results,
                currentPage: page,
                totalPages: totalPages,
                totalUsers: totalUsers
            });
        });
    });
});

// Get single user details
app.get('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    const userId = req.params.id;
    
    const query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at, u.last_login,
               p.address, p.city, p.state, p.postal_code, p.preferred_payment_method,
               p.dietary_preferences, p.allergies, p.favorite_dishes, p.birthday, p.anniversary
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error getting user details:', err);
            return res.status(500).json({ success: false, message: 'Failed to get user details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, user: results[0] });
    });
});

// Add new user
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
    const { firstName, lastName, email, phone, role, password } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !role || !password) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    
    try {
        // Check if user already exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).json({ success: false, message: 'Failed to add user' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const query = `
                INSERT INTO users (first_name, last_name, email, phone, role, password)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.query(query, [firstName, lastName, email, phone || null, role, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error adding user:', err);
                    return res.status(500).json({ success: false, message: 'Failed to add user' });
                }
                
                // Create empty profile
                db.query('INSERT INTO user_profiles (user_id) VALUES (?)', [result.insertId], (err) => {
                    if (err) {
                        console.error('Error creating user profile:', err);
                    }
                });
                
                res.json({ success: true, message: 'User added successfully', userId: result.insertId });
            });
        });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, message: 'Failed to add user' });
    }
});

// Update user
app.put('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    const userId = req.params.id;
    const { firstName, lastName, email, phone, role } = req.body;
    
    const query = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?
        WHERE id = ?
    `;
    
    db.query(query, [firstName, lastName, email, phone, role, userId], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ success: false, message: 'Failed to update user' });
        }
        
        res.json({ success: true, message: 'User updated successfully' });
    });
});

// Delete user
app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    const userId = req.params.id;
    
    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete user' });
        }
        
        res.json({ success: true, message: 'User deleted successfully' });
    });
});

// ==== ADMIN ACTIVITY & ANALYTICS ====
// Get recent activity
app.get('/api/admin/activity/recent', authenticateAdmin, (req, res) => {
    const query = `
        (SELECT 'reservation' as type, 'New Reservation' as title, 
                CONCAT('Reservation by ', name, ' for ', guests, ' guests') as details,
                created_at as timestamp
         FROM reservations 
         ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'order' as type, 'New Order' as title,
                CONCAT('Order by ', name, ' - ₹', total) as details,
                order_time as timestamp
         FROM orders 
         ORDER BY order_time DESC LIMIT 5)
        UNION ALL
        (SELECT 'user' as type, 'New User' as title,
                CONCAT(first_name, ' ', last_name, ' registered') as details,
                created_at as timestamp
         FROM users 
         WHERE role = 'customer'
         ORDER BY created_at DESC LIMIT 3)
        ORDER BY timestamp DESC LIMIT 10
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getting recent activity:', err);
            return res.status(500).json({ success: false, message: 'Failed to get recent activity' });
        }
        
        res.json({ success: true, activities: results });
    });
});

// Get weekly reservations data for chart
app.get('/api/admin/stats/reservations/weekly', authenticateAdmin, (req, res) => {
    const query = `
        SELECT DATE(date) as day, COUNT(*) as count
        FROM reservations 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(date)
        ORDER BY day
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getting weekly reservations:', err);
            return res.status(500).json({ success: false, message: 'Failed to get weekly reservations' });
        }
        
        const labels = results.map(r => new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }));
        const values = results.map(r => r.count);
        
        res.json({ success: true, labels, values });
    });
});

// Get monthly revenue data for chart
app.get('/api/admin/stats/revenue/monthly', authenticateAdmin, (req, res) => {
    const query = `
        SELECT DATE_FORMAT(order_time, '%Y-%m') as month, SUM(total) as revenue
        FROM orders 
        WHERE order_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(order_time, '%Y-%m')
        ORDER BY month
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getting monthly revenue:', err);
            return res.status(500).json({ success: false, message: 'Failed to get monthly revenue' });
        }
        
        const labels = results.map(r => {
            const date = new Date(r.month + '-01');
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const values = results.map(r => parseFloat(r.revenue));
        
        res.json({ success: true, labels, values });
    });
});

// ==== ADMIN TESTIMONIALS MANAGEMENT ====
// Get all testimonials for admin
app.get('/api/admin/testimonials', authenticateAdmin, (req, res) => {
    const query = 'SELECT * FROM testimonials ORDER BY created_at DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getting testimonials:', err);
            return res.status(500).json({ success: false, message: 'Failed to get testimonials' });
        }
        
        res.json({ success: true, testimonials: results });
    });
});

// Delete testimonial
app.delete('/api/admin/testimonials/:id', authenticateAdmin, (req, res) => {
    const testimonialId = req.params.id;
    
    db.query('DELETE FROM testimonials WHERE id = ?', [testimonialId], (err, result) => {
        if (err) {
            console.error('Error deleting testimonial:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete testimonial' });
        }
        
        res.json({ success: true, message: 'Testimonial deleted successfully' });
    });
});

// ==== ADMIN SETTINGS MANAGEMENT ====
// Save general settings
app.post('/api/admin/settings/general', authenticateAdmin, (req, res) => {
    // This would save to a settings table - you'll need to create this table
    // For now, just return success
    res.json({ success: true, message: 'General settings saved successfully' });
});

// ==== ENHANCED ACTIVITY TRACKING ====
// Track user activity endpoint with better error handling
app.post('/api/track-activity', (req, res) => {
    const { activityType, sessionId, details } = req.body;
    const userId = req.user ? req.user.userId : null;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    // Validate required fields
    if (!activityType || !sessionId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Truncate long activity types to fit database constraints
    const truncatedActivityType = activityType.substring(0, 50);
    
    // Ensure details is valid JSON string
    let detailsJson;
    try {
        detailsJson = typeof details === 'string' ? details : JSON.stringify(details || {});
        // Truncate if too long (MySQL TEXT limit is ~65,535 characters)
        if (detailsJson.length > 60000) {
            detailsJson = JSON.stringify({ 
                ...JSON.parse(detailsJson.substring(0, 30000)), 
                _truncated: true 
            });
        }
    } catch (e) {
        detailsJson = JSON.stringify({ error: 'Invalid details format' });
    }
    
    const query = `
        INSERT INTO user_activity_log (user_id, session_id, activity_type, activity_details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [userId, sessionId, truncatedActivityType, detailsJson, ip, userAgent], (err, result) => {
        if (err) {
            // Log error but don't fail the request (activity tracking should be non-blocking)
            console.error('Error tracking activity:', {
                error: err.message,
                activityType: truncatedActivityType,
                userId: userId,
                sessionId: sessionId
            });
            
            // Still return success to avoid breaking the frontend
            return res.json({ success: true, message: 'Activity logged (with warnings)' });
        }
        
        res.json({ success: true, activityId: result.insertId });
    });
});

// ==== ERROR HANDLING MIDDLEWARE ====
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ==== START SERVER ====
// Use environment variable for port
const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`🚀 Server started on port ${port}`);
    console.log(`📍 Restaurant website available at:`);
    console.log(`   - Main site: http://localhost:${port}/welcome`);
    console.log(`   - Admin panel: http://localhost:${port}/admin`);
    console.log(`   - Customer dashboard: http://localhost:${port}/dashboard`);

    // Use dynamic import to load 'open' and redirect to welcome page
    try {
        const open = (await import('open')).default;
        await open(`http://localhost:${port}/welcome`);
    } catch (error) {
        console.log(`⚠️  Could not open browser automatically. Please visit: http://localhost:${port}/welcome`);
    }
});