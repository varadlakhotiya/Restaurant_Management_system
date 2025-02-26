require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Use environment variables for database configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the index.html file when someone visits the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API endpoint to fetch menu items
app.get('/api/menu', (req, res) => {
    let sql = 'SELECT * FROM menu_items';
    db.query(sql, (err, results) => {
        if (err) throw err;

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

// API endpoint to handle reservation form submission
app.post('/api/reservation', (req, res) => {
    const { date, time, guests, name, contact, email, seating, specialRequests, confirmationMethod } = req.body;

    // Validate required fields
    if (!date || !time || !guests || !name || !contact || !email || !seating || !confirmationMethod) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Insert reservation into the database
    const sql = `
        INSERT INTO reservations (date, time, guests, name, contact, email, seating, special_requests, confirmation_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [date, time, guests, name, contact, email, seating, specialRequests, confirmationMethod];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting reservation:', err);
            return res.status(500).json({ success: false, message: 'Failed to submit reservation.' });
        }

        console.log('Reservation submitted successfully:', result);
        res.json({ success: true, message: 'Reservation submitted successfully!' });
    });
});

// API endpoint to fetch testimonials
app.get('/api/testimonials', (req, res) => {
    let sql = 'SELECT * FROM testimonials';
    db.query(sql, (err, results) => {
        if (err) throw err;
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
    if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
    }

    // Insert review into the database
    const sql = `
        INSERT INTO testimonials (name, role, rating, review)
        VALUES (?, ?, ?, ?)
    `;
    const values = [name, role, parseInt(rating), review]; // Ensure rating is an integer

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting review:', err);
            return res.status(500).json({ success: false, message: 'Failed to submit review.' });
        }

        console.log('Review submitted successfully:', result);
        res.json({ success: true, message: 'Review submitted successfully!' });
    });
});

// API endpoint to fetch products
app.get('/api/products', (req, res) => {
    let sql = 'SELECT * FROM products'; // Query to fetch all products
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
        }
        res.json(results); // Send the product data as JSON
    });
});

// API endpoint to submit orders
app.post('/api/orders', (req, res) => {
    const { name, tableNumber, specialRequests, items, total } = req.body;

    const query = `
        INSERT INTO orders (name, table_number, special_requests, items, total)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [name, tableNumber, specialRequests, items, total], (err, result) => {
        if (err) {
            console.error('Error inserting order:', err);
            res.status(500).json({ success: false });
            return;
        }
        res.json({ success: true, orderId: result.insertId });
    });
});

// Use environment variable for port
const port = process.env.PORT || 3000; // Fallback to 3000 if PORT is not set
app.listen(port, async () => {
    console.log(`Server started on port ${port}`);

    // Use dynamic import to load 'open'
    const open = (await import('open')).default;

    await open(`http://localhost:${port}`);
});