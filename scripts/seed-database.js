// scripts/seed-database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
    const client = await pool.connect();
    try {
        console.log('🌱 Starting database seeding...');

        // Seed restaurant tables
        await seedRestaurantTables(client);
        
        // Seed menu items
        await seedMenuItems(client);
        
        // Seed products
        await seedProducts(client);
        
        // Seed sample testimonials
        await seedTestimonials(client);
        
        // Create admin user
        await createAdminUser(client);

        console.log('✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

async function seedRestaurantTables(client) {
    console.log('📍 Seeding restaurant tables...');
    
    const tables = [
        { table_number: 'A1', capacity: 2, section: 'indoor', coordinates_x: 100, coordinates_y: 100 },
        { table_number: 'A2', capacity: 2, section: 'indoor', coordinates_x: 100, coordinates_y: 200 },
        { table_number: 'A3', capacity: 4, section: 'indoor', coordinates_x: 100, coordinates_y: 300 },
        { table_number: 'A4', capacity: 4, section: 'indoor', coordinates_x: 100, coordinates_y: 400 },
        { table_number: 'B1', capacity: 4, section: 'indoor', coordinates_x: 200, coordinates_y: 100 },
        { table_number: 'B2', capacity: 4, section: 'indoor', coordinates_x: 200, coordinates_y: 200 },
        { table_number: 'B3', capacity: 6, section: 'indoor', coordinates_x: 200, coordinates_y: 300 },
        { table_number: 'B4', capacity: 6, section: 'indoor', coordinates_x: 200, coordinates_y: 400 },
        { table_number: 'C1', capacity: 2, section: 'outdoor', coordinates_x: 300, coordinates_y: 100 },
        { table_number: 'C2', capacity: 4, section: 'outdoor', coordinates_x: 300, coordinates_y: 200 },
        { table_number: 'C3', capacity: 6, section: 'outdoor', coordinates_x: 300, coordinates_y: 300 },
        { table_number: 'C4', capacity: 8, section: 'outdoor', coordinates_x: 300, coordinates_y: 400 }
    ];

    for (const table of tables) {
        await client.query(`
            INSERT INTO restaurant_tables (table_number, capacity, section, coordinates_x, coordinates_y)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (table_number) DO NOTHING
        `, [table.table_number, table.capacity, table.section, table.coordinates_x, table.coordinates_y]);
    }
    
    console.log(`✅ Seeded ${tables.length} restaurant tables`);
}

async function seedMenuItems(client) {
    console.log('🍽️ Seeding menu items...');
    
    const menuItems = [
        // Appetizers
        { name: 'Samosa (2 pieces)', description: 'Crispy fried pastries filled with spiced potatoes and peas', price: 80, category: 'appetizers', subcategory: 'fried', image: '/images/samosa.jpg' },
        { name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled to perfection', price: 220, category: 'appetizers', subcategory: 'grilled', image: '/images/paneer-tikka.jpg' },
        { name: 'Aloo Tikki (2 pieces)', description: 'Crispy potato patties served with chutneys', price: 100, category: 'appetizers', subcategory: 'fried', image: '/images/aloo-tikki.jpg' },
        
        // Main Course
        { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato and butter gravy', price: 280, category: 'main-course', subcategory: 'paneer', image: '/images/paneer-butter-masala.jpg' },
        { name: 'Dal Makhani', description: 'Creamy black lentils cooked overnight with butter and cream', price: 220, category: 'main-course', subcategory: 'dal', image: '/images/dal-makhani.jpg' },
        { name: 'Chole Bhature', description: 'Spiced chickpeas served with fluffy fried bread', price: 180, category: 'main-course', subcategory: 'combo', image: '/images/chole-bhature.jpg' },
        { name: 'Rajma Chawal', description: 'Kidney beans curry served with steamed rice', price: 160, category: 'main-course', subcategory: 'combo', image: '/images/rajma-chawal.jpg' },
        
        // South Indian
        { name: 'Masala Dosa', description: 'Crispy crepe filled with spiced potato filling', price: 120, category: 'south-indian', subcategory: 'dosa', image: '/images/masala-dosa.jpg' },
        { name: 'Idli Sambar (4 pieces)', description: 'Steamed rice cakes served with lentil soup', price: 100, category: 'south-indian', subcategory: 'breakfast', image: '/images/idli-sambar.jpg' },
        { name: 'Medu Vada (3 pieces)', description: 'Crispy lentil donuts served with sambar and chutney', price: 90, category: 'south-indian', subcategory: 'breakfast', image: '/images/medu-vada.jpg' },
        
        // Breads
        { name: 'Butter Naan', description: 'Soft flatbread brushed with butter', price: 60, category: 'breads', subcategory: 'naan', image: '/images/butter-naan.jpg' },
        { name: 'Garlic Naan', description: 'Naan topped with fresh garlic and coriander', price: 80, category: 'breads', subcategory: 'naan', image: '/images/garlic-naan.jpg' },
        { name: 'Roti (2 pieces)', description: 'Whole wheat flatbread', price: 40, category: 'breads', subcategory: 'roti', image: '/images/roti.jpg' },
        
        // Rice Dishes
        { name: 'Vegetable Biryani', description: 'Fragrant basmati rice cooked with mixed vegetables and spices', price: 200, category: 'rice-dishes', subcategory: 'biryani', image: '/images/veg-biryani.jpg' },
        { name: 'Jeera Rice', description: 'Basmati rice tempered with cumin seeds', price: 120, category: 'rice-dishes', subcategory: 'plain', image: '/images/jeera-rice.jpg' },
        
        // Street Food
        { name: 'Pav Bhaji', description: 'Spiced vegetable curry served with buttered bread rolls', price: 140, category: 'street-food', subcategory: 'mumbai-special', image: '/images/pav-bhaji.jpg' },
        { name: 'Bhel Puri', description: 'Crunchy mix of puffed rice, sev, and chutneys', price: 80, category: 'street-food', subcategory: 'chaat', image: '/images/bhel-puri.jpg' },
        { name: 'Dahi Puri (6 pieces)', description: 'Crispy puris filled with spiced water, chutneys, and yogurt', price: 100, category: 'street-food', subcategory: 'chaat', image: '/images/dahi-puri.jpg' },
        
        // Beverages
        { name: 'Masala Chai', description: 'Traditional spiced tea', price: 40, category: 'beverages', subcategory: 'hot', image: '/images/masala-chai.jpg' },
        { name: 'Fresh Lime Soda', description: 'Refreshing lime drink with soda', price: 60, category: 'beverages', subcategory: 'cold', image: '/images/lime-soda.jpg' },
        { name: 'Mango Lassi', description: 'Creamy yogurt drink with mango', price: 80, category: 'beverages', subcategory: 'lassi', image: '/images/mango-lassi.jpg' },
        
        // Desserts
        { name: 'Gulab Jamun (2 pieces)', description: 'Sweet milk dumplings in sugar syrup', price: 80, category: 'desserts', subcategory: 'traditional', image: '/images/gulab-jamun.jpg' },
        { name: 'Ras Malai (2 pieces)', description: 'Cottage cheese dumplings in sweetened milk', price: 100, category: 'desserts', subcategory: 'traditional', image: '/images/ras-malai.jpg' },
        { name: 'Kulfi', description: 'Traditional Indian ice cream', price: 70, category: 'desserts', subcategory: 'frozen', image: '/images/kulfi.jpg' }
    ];

    for (const item of menuItems) {
        await client.query(`
            INSERT INTO menu_items (name, description, price, category, subcategory, image)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO NOTHING
        `, [item.name, item.description, item.price, item.category, item.subcategory, item.image]);
    }
    
    console.log(`✅ Seeded ${menuItems.length} menu items`);
}

async function seedProducts(client) {
    console.log('🛒 Seeding products...');
    
    const products = [
        // Spices
        { category: 'spices', name: 'Garam Masala Powder', description: 'Authentic blend of aromatic spices', price: 150, image_url: '/images/products/garam-masala.jpg', rating: 4.5, review_count: 45, badge: 'Bestseller', stock_availability: 'In Stock' },
        { category: 'spices', name: 'Turmeric Powder', description: 'Pure organic turmeric powder', price: 80, image_url: '/images/products/turmeric.jpg', rating: 4.7, review_count: 67, badge: 'Organic', stock_availability: 'In Stock' },
        { category: 'spices', name: 'Red Chili Powder', description: 'Hot and flavorful red chili powder', price: 100, image_url: '/images/products/chili-powder.jpg', rating: 4.3, review_count: 33, badge: '', stock_availability: 'In Stock' },
        
        // Beverages
        { category: 'beverages', name: 'Masala Chai Mix', description: 'Ready-to-brew spiced tea blend', price: 200, image_url: '/images/products/chai-mix.jpg', rating: 4.6, review_count: 52, badge: 'Premium', stock_availability: 'In Stock' },
        { category: 'beverages', name: 'Indian Filter Coffee', description: 'South Indian style coffee powder', price: 250, image_url: '/images/products/filter-coffee.jpg', rating: 4.8, review_count: 28, badge: 'South Indian Special', stock_availability: 'In Stock' },
        
        // Marinades
        { category: 'marinades', name: 'Tandoori Marinade', description: 'Authentic tandoori spice mix', price: 120, image_url: '/images/products/tandoori-marinade.jpg', rating: 4.4, review_count: 19, badge: '', stock_availability: 'In Stock' },
        { category: 'marinades', name: 'Tikka Masala Sauce', description: 'Ready-to-use tikka masala base', price: 180, image_url: '/images/products/tikka-sauce.jpg', rating: 4.2, review_count: 41, badge: '', stock_availability: 'Low Stock' },
        
        // Snacks
        { category: 'snacks', name: 'Namkeen Mix', description: 'Crispy savory snack mix', price: 160, image_url: '/images/products/namkeen.jpg', rating: 4.3, review_count: 36, badge: '', stock_availability: 'In Stock' },
        { category: 'snacks', name: 'Chakli Spiral', description: 'Traditional spiral-shaped snack', price: 140, image_url: '/images/products/chakli.jpg', rating: 4.5, review_count: 22, badge: 'Handmade', stock_availability: 'In Stock' },
        
        // Desserts
        { category: 'desserts', name: 'Kaju Katli', description: 'Premium cashew sweet', price: 400, image_url: '/images/products/kaju-katli.jpg', rating: 4.9, review_count: 15, badge: 'Premium', stock_availability: 'In Stock' },
        { category: 'desserts', name: 'Gulab Jamun Mix', description: 'Instant gulab jamun powder', price: 90, image_url: '/images/products/gulab-jamun-mix.jpg', rating: 4.1, review_count: 38, badge: '', stock_availability: 'In Stock' },
        
        // Herbs
        { category: 'herbs', name: 'Dried Mint Leaves', description: 'Aromatic dried mint for seasoning', price: 70, image_url: '/images/products/mint-leaves.jpg', rating: 4.4, review_count: 25, badge: 'Natural', stock_availability: 'In Stock' },
        { category: 'herbs', name: 'Curry Leaves Powder', description: 'Ground curry leaves for authentic flavor', price: 85, image_url: '/images/products/curry-leaves.jpg', rating: 4.6, review_count: 31, badge: 'Fresh', stock_availability: 'In Stock' }
    ];

    for (const product of products) {
        await client.query(`
            INSERT INTO products (category, name, description, price, image_url, rating, review_count, badge, stock_availability)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (name) DO NOTHING
        `, [product.category, product.name, product.description, product.price, product.image_url, product.rating, product.review_count, product.badge, product.stock_availability]);
    }
    
    console.log(`✅ Seeded ${products.length} products`);
}

async function seedTestimonials(client) {
    console.log('💬 Seeding testimonials...');
    
    const testimonials = [
        { name: 'Priya Sharma', role: 'Food Blogger', rating: 5, review: 'Absolutely amazing experience! The flavors were authentic and the service was exceptional. Highly recommend the Paneer Butter Masala!' },
        { name: 'Rajesh Kumar', role: 'Regular Customer', rating: 5, review: 'Best Indian restaurant in the city! The ambiance is perfect for family dinners and the food quality is consistently excellent.' },
        { name: 'Meera Patel', role: 'Food Enthusiast', rating: 4, review: 'Great variety of vegetarian options. The South Indian dishes are particularly good. Will definitely visit again!' },
        { name: 'Arjun Singh', role: 'Corporate Client', rating: 5, review: 'Organized a team lunch here and everyone loved it. The staff was very accommodating and the food was served hot and fresh.' },
        { name: 'Sneha Reddy', role: 'Local Resident', rating: 4, review: 'Love the traditional taste and the modern presentation. The online ordering system is also very convenient.' }
    ];

    for (const testimonial of testimonials) {
        await client.query(`
            INSERT INTO testimonials (name, role, rating, review)
            VALUES ($1, $2, $3, $4)
        `, [testimonial.name, testimonial.role, testimonial.rating, testimonial.review]);
    }
    
    console.log(`✅ Seeded ${testimonials.length} testimonials`);
}

async function createAdminUser(client) {
    console.log('👤 Creating admin user...');
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
        // Insert admin user
        const result = await client.query(`
            INSERT INTO users (email, password, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            ON CONFLICT (email) DO NOTHING
        `, ['admin@spicesymphony.com', hashedPassword, 'Admin', 'User', 'admin']);
        
        if (result.rows.length > 0) {
            const userId = result.rows[0].id;
            
            // Create admin profile
            await client.query(`
                INSERT INTO user_profiles (user_id)
                VALUES ($1)
                ON CONFLICT (user_id) DO NOTHING
            `, [userId]);
            
            console.log('✅ Admin user created successfully');
            console.log('📧 Email: admin@spicesymphony.com');
            console.log('🔑 Password: admin123');
            console.log('⚠️  Please change this password after first login!');
        } else {
            console.log('ℹ️  Admin user already exists');
        }
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
}

// Run the seeding
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('🎉 Database seeding completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };