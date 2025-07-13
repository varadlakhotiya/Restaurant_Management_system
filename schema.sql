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

-- Restaurant tables
CREATE TABLE restaurant_tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
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
    feedback_rating INTEGER,
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

-- Testimonials table
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    review TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- User activity log
CREATE TABLE user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    activity_type VARCHAR(100) NOT NULL,
    activity_details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_url VARCHAR(500),
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
    COALESCE(r.total_reservations, 0) as total_reservations,
    COALESCE(o.total_orders, 0) as total_orders,
    COALESCE(o.total_spent, 0.00) as total_spent,
    CASE 
        WHEN COALESCE(o.total_orders, 0) > 0 
        THEN COALESCE(o.total_spent, 0.00) / COALESCE(o.total_orders, 0)
        ELSE 0.00 
    END as average_order_value,
    o.last_order_date,
    r.last_reservation_date
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_reservations, MAX(date) as last_reservation_date
    FROM reservations 
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) r ON u.id = r.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_orders, SUM(total) as total_spent, MAX(order_time) as last_order_date
    FROM orders 
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) o ON u.id = o.user_id
WHERE u.role = 'customer';

-- Create indexes for better performance
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_time ON orders(order_time);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_session_id ON user_activity_log(session_id);
CREATE INDEX idx_table_availability_table_date ON table_availability(table_id, date);