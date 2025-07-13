// scripts/migrate-from-mysql.js
// This script helps migrate existing data from MySQL to PostgreSQL
require('dotenv').config();

const mysql = require('mysql');
const { Pool } = require('pg');

// MySQL connection (your old database)
const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

// PostgreSQL connection (your new database)
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateData() {
    console.log('🔄 Starting migration from MySQL to PostgreSQL...');
    
    try {
        // Connect to MySQL
        await connectMySQL();
        
        // Get PostgreSQL client
        const pgClient = await pgPool.connect();
        
        try {
            // Migrate each table
            await migrateUsers(pgClient);
            await migrateUserProfiles(pgClient);
            await migrateRestaurantTables(pgClient);
            await migrateMenuItems(pgClient);
            await migrateProducts(pgClient);
            await migrateReservations(pgClient);
            await migrateOrders(pgClient);
            await migrateTestimonials(pgClient);
            
            console.log('✅ Migration completed successfully!');
        } finally {
            pgClient.release();
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        mysqlConnection.end();
        await pgPool.end();
    }
}

function connectMySQL() {
    return new Promise((resolve, reject) => {
        mysqlConnection.connect((err) => {
            if (err) {
                console.error('❌ MySQL connection failed:', err);
                reject(err);
            } else {
                console.log('✅ Connected to MySQL');
                resolve();
            }
        });
    });
}

function queryMySQL(sql) {
    return new Promise((resolve, reject) => {
        mysqlConnection.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function migrateUsers(pgClient) {
    console.log('👥 Migrating users...');
    
    try {
        const mysqlUsers = await queryMySQL('SELECT * FROM users');
        
        for (const user of mysqlUsers) {
            await pgClient.query(`
                INSERT INTO users (id, email, password, first_name, last_name, phone, role, created_at, last_login)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    password = EXCLUDED.password,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    phone = EXCLUDED.phone,
                    role = EXCLUDED.role,
                    created_at = EXCLUDED.created_at,
                    last_login = EXCLUDED.last_login
            `, [
                user.id,
                user.email,
                user.password,
                user.first_name,
                user.last_name,
                user.phone,
                user.role,
                user.created_at,
                user.last_login
            ]);
        }
        
        // Update sequence
        if (mysqlUsers.length > 0) {
            const maxId = Math.max(...mysqlUsers.map(u => u.id));
            await pgClient.query(`SELECT setval('users_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlUsers.length} users`);
    } catch (error) {
        console.error('❌ Error migrating users:', error);
        throw error;
    }
}

async function migrateUserProfiles(pgClient) {
    console.log('📝 Migrating user profiles...');
    
    try {
        const mysqlProfiles = await queryMySQL('SELECT * FROM user_profiles');
        
        for (const profile of mysqlProfiles) {
            await pgClient.query(`
                INSERT INTO user_profiles (user_id, address, city, state, postal_code, preferred_payment_method, dietary_preferences, allergies, favorite_dishes, birthday, anniversary)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (user_id) DO UPDATE SET
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    postal_code = EXCLUDED.postal_code,
                    preferred_payment_method = EXCLUDED.preferred_payment_method,
                    dietary_preferences = EXCLUDED.dietary_preferences,
                    allergies = EXCLUDED.allergies,
                    favorite_dishes = EXCLUDED.favorite_dishes,
                    birthday = EXCLUDED.birthday,
                    anniversary = EXCLUDED.anniversary
            `, [
                profile.user_id,
                profile.address,
                profile.city,
                profile.state,
                profile.postal_code,
                profile.preferred_payment_method,
                profile.dietary_preferences,
                profile.allergies,
                profile.favorite_dishes,
                profile.birthday,
                profile.anniversary
            ]);
        }
        
        console.log(`✅ Migrated ${mysqlProfiles.length} user profiles`);
    } catch (error) {
        console.error('❌ Error migrating user profiles:', error);
        throw error;
    }
}

async function migrateRestaurantTables(pgClient) {
    console.log('🪑 Migrating restaurant tables...');
    
    try {
        const mysqlTables = await queryMySQL('SELECT * FROM restaurant_tables');
        
        for (const table of mysqlTables) {
            await pgClient.query(`
                INSERT INTO restaurant_tables (id, table_number, capacity, section, status, coordinates_x, coordinates_y)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                    table_number = EXCLUDED.table_number,
                    capacity = EXCLUDED.capacity,
                    section = EXCLUDED.section,
                    status = EXCLUDED.status,
                    coordinates_x = EXCLUDED.coordinates_x,
                    coordinates_y = EXCLUDED.coordinates_y
            `, [
                table.id,
                table.table_number,
                table.capacity,
                table.section,
                table.status,
                table.coordinates_x,
                table.coordinates_y
            ]);
        }
        
        // Update sequence
        if (mysqlTables.length > 0) {
            const maxId = Math.max(...mysqlTables.map(t => t.id));
            await pgClient.query(`SELECT setval('restaurant_tables_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlTables.length} restaurant tables`);
    } catch (error) {
        console.error('❌ Error migrating restaurant tables:', error);
        throw error;
    }
}

async function migrateMenuItems(pgClient) {
    console.log('🍽️ Migrating menu items...');
    
    try {
        const mysqlItems = await queryMySQL('SELECT * FROM menu_items');
        
        for (const item of mysqlItems) {
            await pgClient.query(`
                INSERT INTO menu_items (id, name, description, price, category, subcategory, image, calories, ingredients, allergens, is_vegan, is_vegetarian, spice_level, preparation_time, is_available)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    category = EXCLUDED.category,
                    subcategory = EXCLUDED.subcategory,
                    image = EXCLUDED.image,
                    calories = EXCLUDED.calories,
                    ingredients = EXCLUDED.ingredients,
                    allergens = EXCLUDED.allergens,
                    is_vegan = EXCLUDED.is_vegan,
                    is_vegetarian = EXCLUDED.is_vegetarian,
                    spice_level = EXCLUDED.spice_level,
                    preparation_time = EXCLUDED.preparation_time,
                    is_available = EXCLUDED.is_available
            `, [
                item.id,
                item.name,
                item.description,
                item.price,
                item.category,
                item.subcategory,
                item.image,
                item.calories,
                item.ingredients,
                item.allergens,
                Boolean(item.is_vegan),
                Boolean(item.is_vegetarian),
                item.spice_level,
                item.preparation_time,
                Boolean(item.is_available)
            ]);
        }
        
        // Update sequence
        if (mysqlItems.length > 0) {
            const maxId = Math.max(...mysqlItems.map(i => i.id));
            await pgClient.query(`SELECT setval('menu_items_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlItems.length} menu items`);
    } catch (error) {
        console.error('❌ Error migrating menu items:', error);
        throw error;
    }
}

async function migrateProducts(pgClient) {
    console.log('🛒 Migrating products...');
    
    try {
        const mysqlProducts = await queryMySQL('SELECT * FROM products');
        
        for (const product of mysqlProducts) {
            await pgClient.query(`
                INSERT INTO products (id, category, name, description, price, image_url, rating, review_count, badge, stock_availability, created_at, sku, category_id, is_active, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (id) DO UPDATE SET
                    category = EXCLUDED.category,
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    image_url = EXCLUDED.image_url,
                    rating = EXCLUDED.rating,
                    review_count = EXCLUDED.review_count,
                    badge = EXCLUDED.badge,
                    stock_availability = EXCLUDED.stock_availability,
                    created_at = EXCLUDED.created_at,
                    sku = EXCLUDED.sku,
                    category_id = EXCLUDED.category_id,
                    is_active = EXCLUDED.is_active,
                    updated_at = EXCLUDED.updated_at
            `, [
                product.id,
                product.category,
                product.name,
                product.description,
                product.price,
                product.image_url,
                product.rating,
                product.review_count,
                product.badge,
                product.stock_availability,
                product.created_at,
                product.sku,
                product.category_id,
                Boolean(product.is_active),
                product.updated_at
            ]);
        }
        
        // Update sequence
        if (mysqlProducts.length > 0) {
            const maxId = Math.max(...mysqlProducts.map(p => p.id));
            await pgClient.query(`SELECT setval('products_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlProducts.length} products`);
    } catch (error) {
        console.error('❌ Error migrating products:', error);
        throw error;
    }
}

async function migrateReservations(pgClient) {
    console.log('📅 Migrating reservations...');
    
    try {
        const mysqlReservations = await queryMySQL('SELECT * FROM reservations');
        
        for (const reservation of mysqlReservations) {
            await pgClient.query(`
                INSERT INTO reservations (id, date, time, guests, name, contact, email, seating, special_requests, status, confirmation_method, created_at, user_id, table_id, estimated_duration, actual_arrival_time, actual_departure_time, total_spent, feedback_rating, feedback_notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                ON CONFLICT (id) DO UPDATE SET
                    date = EXCLUDED.date,
                    time = EXCLUDED.time,
                    guests = EXCLUDED.guests,
                    name = EXCLUDED.name,
                    contact = EXCLUDED.contact,
                    email = EXCLUDED.email,
                    seating = EXCLUDED.seating,
                    special_requests = EXCLUDED.special_requests,
                    status = EXCLUDED.status,
                    confirmation_method = EXCLUDED.confirmation_method,
                    created_at = EXCLUDED.created_at,
                    user_id = EXCLUDED.user_id,
                    table_id = EXCLUDED.table_id,
                    estimated_duration = EXCLUDED.estimated_duration,
                    actual_arrival_time = EXCLUDED.actual_arrival_time,
                    actual_departure_time = EXCLUDED.actual_departure_time,
                    total_spent = EXCLUDED.total_spent,
                    feedback_rating = EXCLUDED.feedback_rating,
                    feedback_notes = EXCLUDED.feedback_notes
            `, [
                reservation.id,
                reservation.date,
                reservation.time,
                reservation.guests,
                reservation.name,
                reservation.contact,
                reservation.email,
                reservation.seating,
                reservation.special_requests,
                reservation.status,
                reservation.confirmation_method,
                reservation.created_at,
                reservation.user_id,
                reservation.table_id,
                reservation.estimated_duration,
                reservation.actual_arrival_time,
                reservation.actual_departure_time,
                reservation.total_spent,
                reservation.feedback_rating,
                reservation.feedback_notes
            ]);
        }
        
        // Update sequence
        if (mysqlReservations.length > 0) {
            const maxId = Math.max(...mysqlReservations.map(r => r.id));
            await pgClient.query(`SELECT setval('reservations_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlReservations.length} reservations`);
    } catch (error) {
        console.error('❌ Error migrating reservations:', error);
        throw error;
    }
}

async function migrateOrders(pgClient) {
    console.log('🍽️ Migrating orders...');
    
    try {
        const mysqlOrders = await queryMySQL('SELECT * FROM orders');
        
        for (const order of mysqlOrders) {
            await pgClient.query(`
                INSERT INTO orders (id, name, table_number, special_requests, items, total, order_time, user_id, payment_method, payment_status, order_type, estimated_ready_time, actual_ready_time, delivery_address, order_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    table_number = EXCLUDED.table_number,
                    special_requests = EXCLUDED.special_requests,
                    items = EXCLUDED.items,
                    total = EXCLUDED.total,
                    order_time = EXCLUDED.order_time,
                    user_id = EXCLUDED.user_id,
                    payment_method = EXCLUDED.payment_method,
                    payment_status = EXCLUDED.payment_status,
                    order_type = EXCLUDED.order_type,
                    estimated_ready_time = EXCLUDED.estimated_ready_time,
                    actual_ready_time = EXCLUDED.actual_ready_time,
                    delivery_address = EXCLUDED.delivery_address,
                    order_status = EXCLUDED.order_status
            `, [
                order.id,
                order.name,
                order.table_number,
                order.special_requests,
                order.items,
                order.total,
                order.order_time,
                order.user_id,
                order.payment_method,
                order.payment_status,
                order.order_type,
                order.estimated_ready_time,
                order.actual_ready_time,
                order.delivery_address,
                order.order_status
            ]);
        }
        
        // Update sequence
        if (mysqlOrders.length > 0) {
            const maxId = Math.max(...mysqlOrders.map(o => o.id));
            await pgClient.query(`SELECT setval('orders_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlOrders.length} orders`);
    } catch (error) {
        console.error('❌ Error migrating orders:', error);
        throw error;
    }
}

async function migrateTestimonials(pgClient) {
    console.log('💬 Migrating testimonials...');
    
    try {
        const mysqlTestimonials = await queryMySQL('SELECT * FROM testimonials');
        
        for (const testimonial of mysqlTestimonials) {
            await pgClient.query(`
                INSERT INTO testimonials (id, name, role, rating, review, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    rating = EXCLUDED.rating,
                    review = EXCLUDED.review,
                    created_at = EXCLUDED.created_at
            `, [
                testimonial.id,
                testimonial.name,
                testimonial.role,
                testimonial.rating,
                testimonial.review,
                testimonial.created_at
            ]);
        }
        
        // Update sequence
        if (mysqlTestimonials.length > 0) {
            const maxId = Math.max(...mysqlTestimonials.map(t => t.id));
            await pgClient.query(`SELECT setval('testimonials_id_seq', $1)`, [maxId]);
        }
        
        console.log(`✅ Migrated ${mysqlTestimonials.length} testimonials`);
    } catch (error) {
        console.error('❌ Error migrating testimonials:', error);
        throw error;
    }
}

// Run migration
if (require.main === module) {
    console.log('🚀 Starting MySQL to PostgreSQL migration...');
    console.log('📝 Make sure to set the following environment variables:');
    console.log('   - MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
    console.log('   - DATABASE_URL (PostgreSQL connection string)');
    console.log('');

    migrateData()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateData };