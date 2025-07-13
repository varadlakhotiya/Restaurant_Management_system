-- PostgreSQL Database Schema for Restaurant Management System
-- Run this script to create all tables in PostgreSQL

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- User profiles table
CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    preferred_payment_method VARCHAR(50),
    dietary_preferences TEXT,
    allergies TEXT,
    favorite_dishes TEXT,
    birthday DATE,
    anniversary DATE
);

-- User sessions table
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL,
    data TEXT
);

-- Restaurant tables
CREATE TABLE restaurant_tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    section VARCHAR(20) NOT NULL CHECK (section IN ('indoor', 'outdoor')),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'maintenance')),
    coordinates_x INTEGER,
    coordinates_y INTEGER
);

-- Reservations table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    seating VARCHAR(20) NOT NULL CHECK (seating IN ('indoor', 'outdoor', 'no-preference')),
    special_requests TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    confirmation_method VARCHAR(10) NOT NULL CHECK (confirmation_method IN ('sms', 'email')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    table_id INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    estimated_duration INTEGER DEFAULT 120,
    actual_arrival_time TIMESTAMP,
    actual_departure_time TIMESTAMP,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_notes TEXT
);

-- Table availability
CREATE TABLE table_availability (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    UNIQUE(table_id, date, time_slot)
);

-- Menu items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    image VARCHAR(255) NOT NULL,
    calories INTEGER,
    ingredients TEXT,
    allergens TEXT,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT TRUE,
    spice_level VARCHAR(20) DEFAULT 'medium' CHECK (spice_level IN ('mild', 'medium', 'spicy', 'very_spicy')),
    preparation_time INTEGER,
    is_available BOOLEAN DEFAULT TRUE
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    table_number VARCHAR(50) NOT NULL,
    special_requests TEXT,
    items TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_type VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
    estimated_ready_time TIMESTAMP,
    actual_ready_time TIMESTAMP,
    delivery_address TEXT,
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'))
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    rating DECIMAL(3,2),
    review_count INTEGER,
    badge VARCHAR(50),
    stock_availability VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sku VARCHAR(100),
    category_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials table
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity log table
CREATE TABLE user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    activity_type VARCHAR(100) NOT NULL,
    activity_details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Views for analytics
CREATE VIEW customer_analytics AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.created_at as registration_date,
    COUNT(DISTINCT r.id) as total_reservations,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    CASE 
        WHEN COUNT(DISTINCT o.id) > 0 THEN COALESCE(SUM(o.total), 0) / COUNT(DISTINCT o.id)
        ELSE 0 
    END as average_order_value,
    MAX(o.order_time) as last_order_date,
    MAX(r.date) as last_reservation_date
FROM users u
LEFT JOIN reservations r ON u.id = r.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'customer'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.created_at;

CREATE VIEW daily_sales_summary AS
SELECT 
    DATE(order_time) as order_date,
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    AVG(total) as average_order_value,
    COUNT(DISTINCT user_id) as unique_customers
FROM orders 
GROUP BY DATE(order_time)
ORDER BY order_date DESC;

CREATE VIEW table_utilization AS
SELECT 
    rt.id,
    rt.table_number,
    rt.capacity,
    rt.section,
    COUNT(r.id) as total_reservations,
    AVG(r.guests::DECIMAL) as average_guests,
    CASE 
        WHEN rt.capacity > 0 THEN (AVG(r.guests::DECIMAL) / rt.capacity) * 100
        ELSE 0 
    END as utilization_percentage
FROM restaurant_tables rt
LEFT JOIN reservations r ON rt.id = r.table_id
GROUP BY rt.id, rt.table_number, rt.capacity, rt.section;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_table_id ON reservations(table_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_orders_order_time ON orders(order_time);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_table_availability_date ON table_availability(date);
CREATE INDEX idx_table_availability_table_id ON table_availability(table_id);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_session_id ON user_activity_log(session_id);
CREATE INDEX idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();