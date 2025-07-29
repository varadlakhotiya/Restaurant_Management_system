require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql2'); // Using mysql2
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const fs = require('fs');

// Simple and working mysql2 configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false,
    charset: 'utf8mb4',
    connectTimeout: 60000,
    multipleStatements: true
});

// Test the connection
db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
        console.error('📍 Database Config Check:');
        console.error('   - DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Missing');
        console.error('   - DB_PORT:', process.env.DB_PORT ? '✅ Set' : '❌ Missing');
        console.error('   - DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ Missing');
        console.error('   - DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Set' : '❌ Missing');
        console.error('   - DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Missing');
        console.error('   - DB_SSL:', process.env.DB_SSL ? '✅ Set' : '❌ Missing');
        
        // Don't exit in production, try to continue
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    } else {
        console.log('✅ MySQL connected successfully!');
        console.log(`📊 Connected to database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        
        // Initialize database
        initializeDatabase();
    }
});

// Handle connection errors
db.on('error', function(err) {
    console.error('💥 Database error:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Connection lost, will reconnect...');
    }
});

// Enhanced database initialization
function initializeDatabase() {
    console.log('🔧 Initializing database...');
    
    // First, create the spice_symphony database if it doesn't exist
    db.query('CREATE DATABASE IF NOT EXISTS spice_symphony', (err) => {
        if (err) {
            console.error('Error creating database:', err);
            console.log('📝 Continuing with current database...');
            ensureTablesExist();
        } else {
            console.log('✅ Database spice_symphony ensured');
            
            // Switch to spice_symphony database
            db.query('USE spice_symphony', (err) => {
                if (err) {
                    console.error('Error switching to spice_symphony database:', err);
                    console.log('📝 Continuing with current database...');
                } else {
                    console.log('✅ Switched to spice_symphony database');
                }
                ensureTablesExist();
            });
        }
    });
}

// Function to ensure all tables exist
function ensureTablesExist() {
    console.log('🔧 Ensuring database tables exist...');
    
    // Create all tables
    createAllTables();
}

// Create all required tables
function createAllTables() {
    // Users table with correct schema
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            phone VARCHAR(20),
            role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL
        )
    `;
    
    db.query(createUsersTableQuery, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('✅ Users table ready');
        }
    });

    // User profiles table
    const userProfilesQuery = `
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INT PRIMARY KEY,
            address TEXT,
            city VARCHAR(50),
            state VARCHAR(50),
            postal_code VARCHAR(20),
            preferred_payment_method VARCHAR(50),
            dietary_preferences TEXT,
            allergies TEXT,
            favorite_dishes TEXT,
            birthday DATE,
            anniversary DATE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    db.query(userProfilesQuery, (err) => {
        if (err) {
            console.error('Error creating user_profiles table:', err);
        } else {
            console.log('✅ User profiles table ready');
        }
    });

    // User sessions table
    const userSessionsQuery = `
        CREATE TABLE IF NOT EXISTS user_sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id INT NOT NULL,
            expires TIMESTAMP NOT NULL,
            data TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    db.query(userSessionsQuery, (err) => {
        if (err) {
            console.error('Error creating user_sessions table:', err);
        } else {
            console.log('✅ User sessions table ready');
        }
    });

    // Restaurant tables
    const restaurantTablesQuery = `
        CREATE TABLE IF NOT EXISTS restaurant_tables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_number VARCHAR(10) NOT NULL UNIQUE,
            capacity INT NOT NULL,
            section ENUM('indoor', 'outdoor') NOT NULL,
            status ENUM('available', 'reserved', 'occupied', 'maintenance') DEFAULT 'available',
            coordinates_x INT,
            coordinates_y INT
        )
    `;
    
    db.query(restaurantTablesQuery, (err) => {
        if (err) {
            console.error('Error creating restaurant_tables table:', err);
        } else {
            console.log('✅ Restaurant tables table ready');
        }
    });

    // Table availability
    const tableAvailabilityQuery = `
        CREATE TABLE IF NOT EXISTS table_availability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_id INT NOT NULL,
            date DATE NOT NULL,
            time_slot TIME NOT NULL,
            is_available TINYINT(1) DEFAULT 1,
            reservation_id INT,
            FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE,
            UNIQUE KEY unique_table_datetime (table_id, date, time_slot)
        )
    `;
    
    db.query(tableAvailabilityQuery, (err) => {
        if (err) {
            console.error('Error creating table_availability table:', err);
        } else {
            console.log('✅ Table availability table ready');
        }
    });

    // Reservations table
    const reservationsQuery = `
        CREATE TABLE IF NOT EXISTS reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            time TIME NOT NULL,
            guests INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            contact VARCHAR(20) NOT NULL,
            email VARCHAR(100) NOT NULL,
            seating ENUM('indoor', 'outdoor', 'no-preference') NOT NULL,
            special_requests TEXT,
            status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
            confirmation_method ENUM('sms', 'email') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INT,
            table_id INT,
            estimated_duration INT DEFAULT 120,
            actual_arrival_time TIMESTAMP NULL,
            actual_departure_time TIMESTAMP NULL,
            total_spent DECIMAL(10,2) DEFAULT 0.00,
            feedback_rating INT,
            feedback_notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL
        )
    `;
    
    db.query(reservationsQuery, (err) => {
        if (err) {
            console.error('Error creating reservations table:', err);
        } else {
            console.log('✅ Reservations table ready');
        }
    });

    // Menu items table
    const menuItemsQuery = `
        CREATE TABLE IF NOT EXISTS menu_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            category VARCHAR(100) NOT NULL,
            subcategory VARCHAR(100),
            image VARCHAR(255) NOT NULL,
            calories INT,
            ingredients TEXT,
            allergens TEXT,
            is_vegan TINYINT(1) DEFAULT 0,
            is_vegetarian TINYINT(1) DEFAULT 1,
            spice_level ENUM('mild', 'medium', 'spicy', 'very_spicy') DEFAULT 'medium',
            preparation_time INT,
            is_available TINYINT(1) DEFAULT 1
        )
    `;
    
    db.query(menuItemsQuery, (err) => {
        if (err) {
            console.error('Error creating menu_items table:', err);
        } else {
            console.log('✅ Menu items table ready');
        }
    });

    // Orders table
    const ordersQuery = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            table_number VARCHAR(50) NOT NULL,
            special_requests TEXT,
            items TEXT NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INT,
            payment_method VARCHAR(50),
            payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
            order_type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'dine_in',
            estimated_ready_time TIMESTAMP NULL,
            actual_ready_time TIMESTAMP NULL,
            delivery_address TEXT,
            order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `;
    
    db.query(ordersQuery, (err) => {
        if (err) {
            console.error('Error creating orders table:', err);
        } else {
            console.log('✅ Orders table ready');
        }
    });

    // Products table
    const productsQuery = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            image_url VARCHAR(255),
            rating DECIMAL(3,2),
            review_count INT,
            badge VARCHAR(50),
            stock_availability VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sku VARCHAR(100),
            category_id INT,
            is_active TINYINT(1) DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    db.query(productsQuery, (err) => {
        if (err) {
            console.error('Error creating products table:', err);
        } else {
            console.log('✅ Products table ready');
        }
    });

    // Testimonials table
    const testimonialsQuery = `
        CREATE TABLE IF NOT EXISTS testimonials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            review TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(testimonialsQuery, (err) => {
        if (err) {
            console.error('Error creating testimonials table:', err);
        } else {
            console.log('✅ Testimonials table ready');
        }
    });

    // Activity tracking table
    const activityTrackingQuery = `
        CREATE TABLE IF NOT EXISTS user_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(255),
            activity_type VARCHAR(50) NOT NULL,
            activity_details JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            page_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_activity_type (activity_type),
            INDEX idx_created_at (created_at)
        )
    `;
    
    db.query(activityTrackingQuery, (err) => {
        if (err) {
            console.error('Error creating activity tracking table:', err);
        } else {
            console.log('✅ Activity tracking table ready');
            console.log('🎉 Database initialization complete!');
            
            // Now debug and fix users after a small delay
            setTimeout(() => {
                debugAndFixUsers();
            }, 2000);
        }
    });
}

// Debug function to check existing users and fix admin
function debugAndFixUsers() {
    console.log('🔍 DEBUGGING USER DATABASE...');
    
    // First, let's see what users exist
    const getUsersQuery = 'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id';
    
    db.query(getUsersQuery, (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return;
        }
        
        console.log('👥 EXISTING USERS IN DATABASE:');
        console.log('=====================================');
        
        if (users.length === 0) {
            console.log('❌ No users found in database');
            createFreshAdminUser();
        } else {
            users.forEach(user => {
                console.log(`ID: ${user.id} | Email: ${user.email} | Name: ${user.first_name} ${user.last_name} | Role: ${user.role}`);
            });
            
            console.log('=====================================');
            
            // Check if we have an admin user
            const hasAdmin = users.some(user => user.role === 'admin');
            
            if (!hasAdmin) {
                console.log('⚠️  No admin user found. Creating one...');
                createFreshAdminUser();
            } else {
                console.log('✅ Admin user exists');
                // Let's fix the existing admin user password
                resetAdminPassword();
            }
            
            // Give instructions for existing users
            console.log('📋 EXISTING USER LOGIN INSTRUCTIONS:');
            users.forEach(user => {
                if (user.role !== 'admin') {
                    console.log(`👤 ${user.email} - Try password: "user123" (default password set)`);
                }
            });
        }
    });
}

// Create a fresh admin user
async function createFreshAdminUser() {
    try {
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const insertAdminQuery = `
            INSERT INTO users (email, password, first_name, last_name, role)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            password = VALUES(password),
            role = VALUES(role)
        `;
        
        db.query(insertAdminQuery, [
            'admin@spicesymphony.com', 
            hashedPassword, 
            'Admin', 
            'User', 
            'admin'
        ], (err, result) => {
            if (err) {
                console.error('Error creating/updating admin:', err);
            } else {
                console.log('✅ Admin user created/updated successfully!');
                console.log('🎯 ADMIN LOGIN CREDENTIALS:');
                console.log('📧 Email: admin@spicesymphony.com');
                console.log('🔑 Password: admin123');
                console.log('🌐 URL: https://restaurant-management-system-z09l.onrender.com/login');
                
                // Ensure user profile exists
                ensureUserProfile('admin@spicesymphony.com');
            }
        });
    } catch (error) {
        console.error('Error hashing admin password:', error);
    }
}

// Reset admin password
async function resetAdminPassword() {
    try {
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const updateAdminQuery = `
            UPDATE users 
            SET password = ?, role = 'admin'
            WHERE email = 'admin@spicesymphony.com' OR role = 'admin'
        `;
        
        db.query(updateAdminQuery, [hashedPassword], (err, result) => {
            if (err) {
                console.error('Error updating admin password:', err);
            } else {
                console.log('✅ Admin password reset successfully!');
                console.log('🎯 ADMIN LOGIN CREDENTIALS:');
                console.log('📧 Email: admin@spicesymphony.com');
                console.log('🔑 Password: admin123');
                console.log('🌐 URL: https://restaurant-management-system-z09l.onrender.com/login');
                
                // Set default passwords for existing users
                setDefaultPasswordsForExistingUsers();
            }
        });
    } catch (error) {
        console.error('Error hashing new admin password:', error);
    }
}

// Set default passwords for existing users
async function setDefaultPasswordsForExistingUsers() {
    try {
        const defaultPassword = 'user123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Update all non-admin users with the default password
        const updateUsersQuery = `
            UPDATE users 
            SET password = ?
            WHERE role != 'admin'
        `;
        
        db.query(updateUsersQuery, [hashedPassword], (err, result) => {
            if (err) {
                console.error('Error updating user passwords:', err);
            } else {
                console.log(`✅ Updated passwords for ${result.affectedRows} existing users`);
                console.log('🔑 Default password for existing users: user123');
                
                // List all users with their login info
                listAllUserCredentials();
            }
        });
    } catch (error) {
        console.error('Error setting default passwords:', error);
    }
}

// List all user credentials
function listAllUserCredentials() {
    const getUsersQuery = 'SELECT email, first_name, last_name, role FROM users ORDER BY role DESC, id';
    
    db.query(getUsersQuery, (err, users) => {
        if (err) {
            console.error('Error fetching users for credentials list:', err);
            return;
        }
        
        console.log('🎯 ALL USER LOGIN CREDENTIALS:');
        console.log('=====================================');
        
        users.forEach(user => {
            const password = user.role === 'admin' ? 'admin123' : 'user123';
            console.log(`👤 ${user.first_name} ${user.last_name} (${user.role})`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔑 Password: ${password}`);
            console.log('   ---');
        });
        
        console.log('=====================================');
        console.log('🌐 Login URL: https://restaurant-management-system-z09l.onrender.com/login');
    });
}

// Ensure user profile exists for an email
function ensureUserProfile(email) {
    const getUserIdQuery = 'SELECT id FROM users WHERE email = ?';
    
    db.query(getUserIdQuery, [email], (err, results) => {
        if (err || results.length === 0) return;
        
        const userId = results[0].id;
        const createProfileQuery = 'INSERT IGNORE INTO user_profiles (user_id) VALUES (?)';
        
        db.query(createProfileQuery, [userId], (err) => {
            if (err) {
                console.error('Error creating user profile:', err);
            }
        });
    });
}

// Function to ensure all tables exist (matching your existing schema)
function ensureTablesExist() {
    console.log('🔧 Ensuring database tables exist...');
    
    // Check if users table exists and has correct structure
    checkAndCreateUsersTable();
}

// Check and create users table with correct schema
function checkAndCreateUsersTable() {
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            phone VARCHAR(20),
            role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL
        )
    `;
    
    db.query(createUsersTableQuery, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('✅ Users table ready');
            
            // Now check for admin user and create if needed
            setTimeout(() => {
                createDefaultAdminUser();
            }, 1000); // Small delay to ensure table is fully created
            
            // Create other tables
            createOtherRequiredTables();
        }
    });
}

// Create default admin user
function createDefaultAdminUser() {
    // First check if any admin user exists
    const checkAdminQuery = `SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    
    db.query(checkAdminQuery, async (err, results) => {
        if (err) {
            console.error('Error checking for admin user:', err);
            return;
        }
        
        if (results && results.length === 0) {
            try {
                const adminPassword = 'admin123';
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                
                const insertAdminQuery = `
                    INSERT INTO users (email, password, first_name, last_name, role)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(insertAdminQuery, [
                    'admin@spicesymphony.com', 
                    hashedPassword, 
                    'Admin', 
                    'User', 
                    'admin'
                ], (err, result) => {
                    if (err) {
                        console.error('Error creating default admin:', err);
                    } else {
                        console.log('✅ Default admin user created successfully!');
                        console.log('🎯 LOGIN CREDENTIALS:');
                        console.log('📧 Email: admin@spicesymphony.com');
                        console.log('🔑 Password: admin123');
                        console.log('🌐 Admin Panel: https://restaurant-management-system-z09l.onrender.com/admin');
                        
                        // Create user profile for admin
                        createUserProfile(result.insertId);
                    }
                });
            } catch (error) {
                console.error('Error hashing admin password:', error);
            }
        } else {
            console.log('✅ Admin user already exists');
            console.log('🌐 Admin Panel: https://restaurant-management-system-z09l.onrender.com/admin');
        }
    });
}

// Create user profile for a user
function createUserProfile(userId) {
    const createProfileQuery = `
        INSERT IGNORE INTO user_profiles (user_id) VALUES (?)
    `;
    
    db.query(createProfileQuery, [userId], (err) => {
        if (err) {
            console.error('Error creating user profile:', err);
        } else {
            console.log('✅ User profile created for admin');
        }
    });
}

// Create other required tables
function createOtherRequiredTables() {
    // User profiles table
    const userProfilesQuery = `
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INT PRIMARY KEY,
            address TEXT,
            city VARCHAR(50),
            state VARCHAR(50),
            postal_code VARCHAR(20),
            preferred_payment_method VARCHAR(50),
            dietary_preferences TEXT,
            allergies TEXT,
            favorite_dishes TEXT,
            birthday DATE,
            anniversary DATE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    db.query(userProfilesQuery, (err) => {
        if (err) {
            console.error('Error creating user_profiles table:', err);
        } else {
            console.log('✅ User profiles table ready');
        }
    });

    // User sessions table
    const userSessionsQuery = `
        CREATE TABLE IF NOT EXISTS user_sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id INT NOT NULL,
            expires TIMESTAMP NOT NULL,
            data TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    db.query(userSessionsQuery, (err) => {
        if (err) {
            console.error('Error creating user_sessions table:', err);
        } else {
            console.log('✅ User sessions table ready');
        }
    });

    // Restaurant tables
    const restaurantTablesQuery = `
        CREATE TABLE IF NOT EXISTS restaurant_tables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_number VARCHAR(10) NOT NULL UNIQUE,
            capacity INT NOT NULL,
            section ENUM('indoor', 'outdoor') NOT NULL,
            status ENUM('available', 'reserved', 'occupied', 'maintenance') DEFAULT 'available',
            coordinates_x INT,
            coordinates_y INT
        )
    `;
    
    db.query(restaurantTablesQuery, (err) => {
        if (err) {
            console.error('Error creating restaurant_tables table:', err);
        } else {
            console.log('✅ Restaurant tables table ready');
            insertSampleDataIfNeeded();
        }
    });

    // Table availability
    const tableAvailabilityQuery = `
        CREATE TABLE IF NOT EXISTS table_availability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_id INT NOT NULL,
            date DATE NOT NULL,
            time_slot TIME NOT NULL,
            is_available TINYINT(1) DEFAULT 1,
            reservation_id INT,
            FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE,
            UNIQUE KEY unique_table_datetime (table_id, date, time_slot)
        )
    `;
    
    db.query(tableAvailabilityQuery, (err) => {
        if (err) {
            console.error('Error creating table_availability table:', err);
        } else {
            console.log('✅ Table availability table ready');
        }
    });

    // Reservations table
    const reservationsQuery = `
        CREATE TABLE IF NOT EXISTS reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            time TIME NOT NULL,
            guests INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            contact VARCHAR(20) NOT NULL,
            email VARCHAR(100) NOT NULL,
            seating ENUM('indoor', 'outdoor', 'no-preference') NOT NULL,
            special_requests TEXT,
            status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
            confirmation_method ENUM('sms', 'email') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INT,
            table_id INT,
            estimated_duration INT DEFAULT 120,
            actual_arrival_time TIMESTAMP NULL,
            actual_departure_time TIMESTAMP NULL,
            total_spent DECIMAL(10,2) DEFAULT 0.00,
            feedback_rating INT,
            feedback_notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL
        )
    `;
    
    db.query(reservationsQuery, (err) => {
        if (err) {
            console.error('Error creating reservations table:', err);
        } else {
            console.log('✅ Reservations table ready');
        }
    });

    // Menu items table (matching your schema)
    const menuItemsQuery = `
        CREATE TABLE IF NOT EXISTS menu_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            category VARCHAR(100) NOT NULL,
            subcategory VARCHAR(100),
            image VARCHAR(255) NOT NULL,
            calories INT,
            ingredients TEXT,
            allergens TEXT,
            is_vegan TINYINT(1) DEFAULT 0,
            is_vegetarian TINYINT(1) DEFAULT 1,
            spice_level ENUM('mild', 'medium', 'spicy', 'very_spicy') DEFAULT 'medium',
            preparation_time INT,
            is_available TINYINT(1) DEFAULT 1
        )
    `;
    
    db.query(menuItemsQuery, (err) => {
        if (err) {
            console.error('Error creating menu_items table:', err);
        } else {
            console.log('✅ Menu items table ready');
        }
    });

    // Orders table
    const ordersQuery = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            table_number VARCHAR(50) NOT NULL,
            special_requests TEXT,
            items TEXT NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INT,
            payment_method VARCHAR(50),
            payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
            order_type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'dine_in',
            estimated_ready_time TIMESTAMP NULL,
            actual_ready_time TIMESTAMP NULL,
            delivery_address TEXT,
            order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `;
    
    db.query(ordersQuery, (err) => {
        if (err) {
            console.error('Error creating orders table:', err);
        } else {
            console.log('✅ Orders table ready');
        }
    });

    // Products table
    const productsQuery = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            image_url VARCHAR(255),
            rating DECIMAL(3,2),
            review_count INT,
            badge VARCHAR(50),
            stock_availability VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sku VARCHAR(100),
            category_id INT,
            is_active TINYINT(1) DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    db.query(productsQuery, (err) => {
        if (err) {
            console.error('Error creating products table:', err);
        } else {
            console.log('✅ Products table ready');
        }
    });

    // Testimonials table
    const testimonialsQuery = `
        CREATE TABLE IF NOT EXISTS testimonials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            review TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(testimonialsQuery, (err) => {
        if (err) {
            console.error('Error creating testimonials table:', err);
        } else {
            console.log('✅ Testimonials table ready');
        }
    });

    // Activity tracking table (simplified)
    const activityTrackingQuery = `
        CREATE TABLE IF NOT EXISTS user_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(255),
            activity_type VARCHAR(50) NOT NULL,
            activity_details JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            page_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_activity_type (activity_type),
            INDEX idx_created_at (created_at)
        )
    `;
    
    db.query(activityTrackingQuery, (err) => {
        if (err) {
            console.error('Error creating activity tracking table:', err);
        } else {
            console.log('✅ Activity tracking table ready');
            console.log('🎉 Database initialization complete!');
        }
    });
}

// Insert sample data if tables are empty
function insertSampleDataIfNeeded() {
    // Check if restaurant_tables has data
    db.query('SELECT COUNT(*) as count FROM restaurant_tables', (err, results) => {
        if (err || !results || results[0].count > 0) return;
        
        console.log('📝 Inserting sample restaurant tables...');
        const sampleTables = [
            ['A1', 2, 'indoor', 'available', 100, 100],
            ['A2', 2, 'indoor', 'available', 100, 200],
            ['A3', 4, 'indoor', 'available', 100, 300],
            ['B1', 4, 'indoor', 'available', 200, 100],
            ['B2', 4, 'indoor', 'available', 200, 200],
            ['C1', 2, 'outdoor', 'available', 300, 100],
            ['C2', 4, 'outdoor', 'available', 300, 200]
        ];
        
        const insertQuery = 'INSERT INTO restaurant_tables (table_number, capacity, section, status, coordinates_x, coordinates_y) VALUES ?';
        db.query(insertQuery, [sampleTables], (err) => {
            if (err) {
                console.error('Error inserting sample tables:', err);
            } else {
                console.log('✅ Sample restaurant tables added');
            }
        });
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
// Replace your existing registration endpoint with this improved version

// User registration endpoint with better error handling
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        
        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided' 
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address' 
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }
        
        // Check if user already exists
        const userExistsQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(userExistsQuery, [email], async (err, results) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Registration failed. Please try again.' 
                });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `An account with email ${email} already exists. Please use a different email or try logging in.` 
                });
            }
            
            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // Begin transaction
                db.beginTransaction(async (err) => {
                    if (err) {
                        console.error('Error starting transaction:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Registration failed. Please try again.' 
                        });
                    }
                    
                    // Insert new user
                    const insertUserQuery = `
                        INSERT INTO users (email, password, first_name, last_name, phone)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    
                    db.query(insertUserQuery, [email, hashedPassword, firstName, lastName, phone || null], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error registering user:', err);
                                
                                // Check if it's a duplicate entry error
                                if (err.code === 'ER_DUP_ENTRY') {
                                    res.status(400).json({ 
                                        success: false, 
                                        message: `An account with email ${email} already exists. Please use a different email or try logging in.` 
                                    });
                                } else {
                                    res.status(500).json({ 
                                        success: false, 
                                        message: 'Registration failed. Please try again.' 
                                    });
                                }
                            });
                        }
                        
                        // Create empty profile for the user
                        const userId = result.insertId;
                        const createProfileQuery = 'INSERT INTO user_profiles (user_id) VALUES (?)';
                        
                        db.query(createProfileQuery, [userId], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error creating user profile:', err);
                                    res.status(500).json({ 
                                        success: false, 
                                        message: 'Registration failed. Please try again.' 
                                    });
                                });
                            }
                            
                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction:', err);
                                        res.status(500).json({ 
                                            success: false, 
                                            message: 'Registration failed. Please try again.' 
                                        });
                                    });
                                }
                                
                                console.log('User registered successfully:', userId);
                                res.json({ 
                                    success: true, 
                                    message: 'Registration successful! You can now log in with your credentials.',
                                    redirectTo: '/login'
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                console.error('Registration error in password hashing:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Registration failed. Please try again.' 
                });
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed. Please try again.' 
        });
    }
});

// Add debug endpoints for troubleshooting (you can remove these later)
app.get('/api/debug/users', (req, res) => {
    const getUsersQuery = 'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id';
    
    db.query(getUsersQuery, (err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching users' });
        }
        
        res.json({ success: true, users });
    });
});

app.post('/api/debug/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE email = ?';
        
        db.query(updatePasswordQuery, [hashedPassword, email], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error updating password' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            res.json({ 
                success: true, 
                message: `Password updated for ${email}` 
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error hashing password' });
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