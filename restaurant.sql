-- User table schema
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- User profile table schema
CREATE TABLE user_profiles (
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
);

-- User sessions table for persistent login
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    expires TIMESTAMP NOT NULL,
    data TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table schema for restaurant tables
CREATE TABLE restaurant_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
    capacity INT NOT NULL,
    section ENUM('indoor', 'outdoor') NOT NULL,
    status ENUM('available', 'reserved', 'occupied', 'maintenance') DEFAULT 'available',
    coordinates_x INT,
    coordinates_y INT
);

-- Table slot availability schema
CREATE TABLE table_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    reservation_id INT NULL,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    UNIQUE KEY unique_table_slot (table_id, date, time_slot)
);

SHOW TABLES;
Select * FROM menu_items;
Select * FROM orders;
Select * FROM products;
Select * FROM reservations;
Select * FROM restaurant_tables;
Select * FROM table_availability;
Select * FROM testimonials;
Select * FROM user_profiles;
Select * FROM user_sessions;
Select * FROM users;


-- Check your user's role
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'admin@spicesymphony.com';

-- If role is not 'admin', update it:
UPDATE users SET role = 'admin' WHERE email = 'admin@spicesymphony.com';

and password is Admin123






-- 2. User Activity Tracking (for admin analytics)
CREATE TABLE user_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    activity_type ENUM('login', 'logout', 'register', 'profile_update', 'reservation', 'order', 'cart_add', 'cart_remove', 'review', 'page_view') NOT NULL,
    activity_details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Restaurant Settings Table
CREATE TABLE restaurant_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default restaurant settings
INSERT INTO restaurant_settings (setting_key, setting_value, setting_type, description) VALUES
('restaurant_name', 'Spice Symphony', 'string', 'Restaurant name'),
('restaurant_address', 'Aurangabad, Maharashtra', 'string', 'Restaurant address'),
('restaurant_phone', '+91-123-456-7890', 'string', 'Restaurant phone number'),
('restaurant_email', 'contact@spicesymphony.com', 'string', 'Restaurant email'),
('restaurant_currency', 'INR', 'string', 'Restaurant currency'),
('business_hours', '{"monday":{"open":"11:00","close":"22:00","closed":false},"tuesday":{"open":"11:00","close":"22:00","closed":false},"wednesday":{"open":"11:00","close":"22:00","closed":false},"thursday":{"open":"11:00","close":"22:00","closed":false},"friday":{"open":"11:00","close":"22:00","closed":false},"saturday":{"open":"10:00","close":"23:00","closed":false},"sunday":{"open":"10:00","close":"23:00","closed":false}}', 'json', 'Business hours for each day'),
('email_notifications', '{"new_reservation":true,"cancelled_reservation":true,"new_order":true,"new_user":true}', 'json', 'Email notification preferences'),
('seo_meta_title', 'Spice Symphony - Authentic Indian Cuisine', 'string', 'SEO meta title'),
('seo_meta_description', 'Experience authentic Indian cuisine and shop for spices and beverages at our tropical-themed restaurant.', 'string', 'SEO meta description'),
('seo_meta_keywords', 'Indian restaurant, authentic Indian cuisine, vegetarian food, spices, Indian beverages, online reservation, Indian food delivery', 'string', 'SEO meta keywords');

-- 4. Order Items Details (for better order tracking)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_type ENUM('menu_item', 'product') NOT NULL,
    item_id INT,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);


-- 11. Analytics and Reports Data
CREATE TABLE daily_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE UNIQUE NOT NULL,
    total_reservations INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    total_customers INT DEFAULT 0,
    new_customers INT DEFAULT 0,
    avg_order_value DECIMAL(10, 2) DEFAULT 0,
    most_popular_item VARCHAR(255),
    busiest_hour TIME,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- ENHANCED EXISTING TABLES
-- ====================================

-- Add missing columns to existing tables
ALTER TABLE products ADD COLUMN sku VARCHAR(100);
ALTER TABLE products ADD COLUMN category_id INT;
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add nutrition info to menu items
ALTER TABLE menu_items ADD COLUMN calories INT;
ALTER TABLE menu_items ADD COLUMN ingredients TEXT;
ALTER TABLE menu_items ADD COLUMN allergens TEXT;
ALTER TABLE menu_items ADD COLUMN is_vegan BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN is_vegetarian BOOLEAN DEFAULT TRUE;
ALTER TABLE menu_items ADD COLUMN spice_level ENUM('mild', 'medium', 'spicy', 'very_spicy') DEFAULT 'medium';
ALTER TABLE menu_items ADD COLUMN preparation_time INT; -- in minutes
ALTER TABLE menu_items ADD COLUMN is_available BOOLEAN DEFAULT TRUE;

-- Add more fields to reservations
ALTER TABLE reservations ADD COLUMN estimated_duration INT DEFAULT 120; -- in minutes
ALTER TABLE reservations ADD COLUMN actual_arrival_time TIMESTAMP NULL;
ALTER TABLE reservations ADD COLUMN actual_departure_time TIMESTAMP NULL;
ALTER TABLE reservations ADD COLUMN total_spent DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE reservations ADD COLUMN feedback_rating INT;
ALTER TABLE reservations ADD COLUMN feedback_notes TEXT;

-- Add payment info to orders
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN order_type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'dine_in';
ALTER TABLE orders ADD COLUMN estimated_ready_time TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN actual_ready_time TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending';

-- ====================================
-- USEFUL VIEWS FOR ADMIN ANALYTICS
-- ====================================

-- View for daily sales summary
CREATE VIEW daily_sales_summary AS
SELECT 
    DATE(order_time) as order_date,
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    AVG(total) as average_order_value,
    COUNT(DISTINCT user_id) as unique_customers
FROM orders 
WHERE payment_status = 'paid'
GROUP BY DATE(order_time);

-- View for popular menu items
CREATE VIEW popular_menu_items AS
SELECT 
    mi.id,
    mi.name,
    mi.category,
    mi.subcategory,
    COUNT(oi.item_id) as order_count,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue
FROM menu_items mi
LEFT JOIN order_items oi ON mi.id = oi.item_id AND oi.item_type = 'menu_item'
GROUP BY mi.id, mi.name, mi.category, mi.subcategory
ORDER BY order_count DESC;

-- View for customer analytics
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
    COALESCE(AVG(o.total), 0) as average_order_value,
    MAX(o.order_time) as last_order_date,
    MAX(r.date) as last_reservation_date
FROM users u
LEFT JOIN reservations r ON u.id = r.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'customer'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.created_at;

-- View for table utilization
CREATE VIEW table_utilization AS
SELECT 
    rt.id,
    rt.table_number,
    rt.capacity,
    rt.section,
    COUNT(r.id) as total_reservations,
    AVG(r.guests) as average_guests,
    (COUNT(r.id) * 100.0 / (SELECT COUNT(*) FROM reservations)) as utilization_percentage
FROM restaurant_tables rt
LEFT JOIN reservations r ON rt.id = r.table_id
GROUP BY rt.id, rt.table_number, rt.capacity, rt.section;

-- ====================================
-- INDEXES FOR BETTER PERFORMANCE
-- ====================================

-- User activity indexes
CREATE INDEX idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity_log(created_at);

-- Shopping cart indexes
CREATE INDEX idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX idx_shopping_cart_session_id ON shopping_cart(session_id);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id, item_type);

-- Financial transactions indexes
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);

-- Analytics indexes
CREATE INDEX idx_daily_analytics_date ON daily_analytics(report_date);

-- Existing table performance indexes
CREATE INDEX idx_reservations_date_time ON reservations(date, time);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_time ON orders(order_time);
CREATE INDEX idx_orders_status ON orders(order_status);

CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);


SHOW TABLES;
-- Retrieve all rows from every table

SELECT * FROM customer_analytics;
SELECT * FROM daily_sales_summary;
SELECT * FROM menu_items;
SELECT * FROM orders;
SELECT * FROM popular_menu_items;
SELECT * FROM products;
SELECT * FROM reservations;
SELECT * FROM restaurant_tables;
SELECT * FROM table_availability;
SELECT * FROM table_utilization;
SELECT * FROM testimonials;
SELECT * FROM user_activity_log;
SELECT * FROM user_profiles;
SELECT * FROM user_sessions;
SELECT * FROM users;


-- Check remaining tables
SHOW TABLES;



