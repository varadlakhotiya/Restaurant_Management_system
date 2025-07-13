require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const { Pool } = require('pg'); // Changed from mysql to pg
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// Use environment variables for PostgreSQL database configuration
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Connect to the database
db.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
        process.exit(1);
    }
    console.log('PostgreSQL connected...');
    release();
    
    // Create activity tracking table if it doesn't exist
    createActivityTrackingTable();
});

// Create activity tracking table
async function createActivityTrackingTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS user_activity_log (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            session_id VARCHAR(255) NOT NULL,
            activity_type VARCHAR(100) NOT NULL,
            activity_details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_session_id ON user_activity_log(session_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
    `;
    
    try {
        await db.query(createTableQuery);
        console.log('Activity tracking table ready');
    } catch (err) {
        console.error('Error creating activity tracking table:', err);
    }
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
    const client = await db.connect();
    
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        
        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }
        
        // Check if user already exists
        const userExistsQuery = 'SELECT * FROM users WHERE email = $1';
        const userExistsResult = await client.query(userExistsQuery, [email]);
        
        if (userExistsResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Begin transaction
        await client.query('BEGIN');
        
        try {
            // Insert new user
            const insertUserQuery = `
                INSERT INTO users (email, password, first_name, last_name, phone)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;
            
            const result = await client.query(insertUserQuery, [email, hashedPassword, firstName, lastName, phone || null]);
            const userId = result.rows[0].id;
            
            // Create empty profile for the user
            const createProfileQuery = 'INSERT INTO user_profiles (user_id) VALUES ($1)';
            await client.query(createProfileQuery, [userId]);
            
            // Commit transaction
            await client.query('COMMIT');
            
            console.log('User registered successfully:', userId);
            res.json({ 
                success: true, 
                message: 'Registration successful',
                redirectTo: '/login'
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    } finally {
        client.release();
    }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        
        // Find user by email
        const findUserQuery = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(findUserQuery, [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const user = result.rows[0];
        
        // Compare password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        // Update last login time
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        
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
        
        await db.query(
            'INSERT INTO user_sessions (id, user_id, expires, data) VALUES ($1, $2, $3, $4)',
            [sessionId, user.id, sessionExpiry, JSON.stringify({ lastActive: new Date() })]
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

// ==== MENU API ENDPOINTS ====
// API endpoint to fetch menu items
app.get('/api/menu', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items ORDER BY category, subcategory, name');
        
        // Group data by category and subcategory
        const groupedData = result.rows.reduce((acc, item) => {
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
    } catch (err) {
        console.error('Error fetching menu items:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
    }
});

// ==== TABLES API ENDPOINTS ====
// API endpoint to get all restaurant tables
app.get('/api/tables', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM restaurant_tables ORDER BY section, table_number');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch tables.' });
    }
});

// API endpoint to check table availability
app.get('/api/tables/availability', async (req, res) => {
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
    
    try {
        // Find tables with appropriate capacity and availability
        const query = `
            SELECT t.id, t.table_number, t.capacity, t.section, t.status, t.coordinates_x, t.coordinates_y
            FROM restaurant_tables t
            LEFT JOIN table_availability a ON t.id = a.table_id AND a.date = $1 AND a.time_slot = $2
            WHERE t.capacity >= $3 AND (a.is_available = TRUE OR a.id IS NULL) AND t.status = 'available'
            ORDER BY t.capacity ASC, t.section, t.table_number
        `;
        
        const result = await db.query(query, [date, roundedTime, guestCount]);
        
        console.log(`Found ${result.rows.length} available tables for ${guestCount} guests on ${date} at ${roundedTime}`);
        
        res.json({
            success: true,
            date,
            time: roundedTime,
            guests: guestCount,
            availableTables: result.rows
        });
    } catch (err) {
        console.error('Error checking table availability:', err);
        res.status(500).json({ success: false, message: 'Failed to check availability.' });
    }
});

// ==== RESERVATION API ENDPOINTS ====
// API endpoint to handle reservation form submission
app.post('/api/reservation', async (req, res) => {
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

    const client = await db.connect();
    
    try {
        // Start transaction
        await client.query('BEGIN');

        // Insert reservation into the database
        const insertReservationSql = `
            INSERT INTO reservations (date, time, guests, name, contact, email, seating, special_requests, confirmation_method, user_id, table_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed')
            RETURNING id
        `;
        const reservationValues = [date, time, guestCount, name, contact, email, seating, specialRequests || null, confirmationMethod, userId, tableId || null];

        const result = await client.query(insertReservationSql, reservationValues);
        const reservationId = result.rows[0].id;

        // If a specific table was selected, update table availability
        if (tableId) {
            const roundedTime = roundTimeToNearestSlot(time);
            const updateTableSql = `
                INSERT INTO table_availability (table_id, date, time_slot, is_available, reservation_id)
                VALUES ($1, $2, $3, FALSE, $4)
                ON CONFLICT (table_id, date, time_slot) 
                DO UPDATE SET is_available = FALSE, reservation_id = $4
            `;
            
            await client.query(updateTableSql, [tableId, date, roundedTime, reservationId]);
        }

        // Commit the transaction
        await client.query('COMMIT');

        console.log('Reservation submitted successfully:', reservationId);
        res.json({ success: true, message: 'Reservation submitted successfully!', reservationId });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error processing reservation:', err);
        res.status(500).json({ success: false, message: 'Failed to submit reservation.' });
    } finally {
        client.release();
    }
});

// ==== TESTIMONIALS API ENDPOINTS ====
// API endpoint to fetch testimonials
app.get('/api/testimonials', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
    }
});

// API endpoint to submit a review
app.post('/api/testimonials', async (req, res) => {
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

    try {
        // Insert review into the database
        const sql = `
            INSERT INTO testimonials (name, role, rating, review)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const values = [name, role, ratingNum, review];

        const result = await db.query(sql, values);

        console.log('Review submitted successfully:', result.rows[0].id);
        res.json({ success: true, message: 'Review submitted successfully!' });
    } catch (err) {
        console.error('Error inserting review:', err);
        res.status(500).json({ success: false, message: 'Failed to submit review.' });
    }
});

// ==== ENHANCED ORDERS API ENDPOINTS ====
// API endpoint to submit orders (enhanced with better validation and error handling)
app.post('/api/orders', async (req, res) => {
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

    try {
        const query = `
            INSERT INTO orders (name, table_number, special_requests, items, total, user_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;

        console.log('Inserting order with values:', [name.trim(), tableNumber.trim(), specialRequests?.trim() || null, items.trim(), totalAmount, userId]);

        const result = await db.query(query, [name.trim(), tableNumber.trim(), specialRequests?.trim() || null, items.trim(), totalAmount, userId]);
        
        console.log('Order submitted successfully:', result.rows[0].id);
        res.json({ 
            success: true, 
            message: 'Order submitted successfully!',
            orderId: result.rows[0].id 
        });
    } catch (err) {
        console.error('Error inserting order:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit order. Please try again.' 
        });
    }
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

    // Only try to open browser in development
    if (process.env.NODE_ENV !== 'production') {
        try {
            const open = (await import('open')).default;
            await open(`http://localhost:${port}/welcome`);
        } catch (error) {
            console.log(`⚠️  Could not open browser automatically. Please visit: http://localhost:${port}/welcome`);
        }
    }
});