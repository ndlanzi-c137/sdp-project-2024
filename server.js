// server.js
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const userRoutes = require('./auth-routes/userRoute');
const dataRoutes = require('./auth-routes/data');

// Initialize the Express app
const app = express();

// Log environment variables (for debugging purposes, remove in production)
console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME, process.env.SSL_CA);

// Create a MySQL connection with SSL
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Default MySQL port
    ssl: {
        ca: fs.readFileSync(process.env.SSL_CA), // Ensure this path is correct
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database as ID ' + connection.threadId);
});

// Make the connection globally accessible
global.connection = connection;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use body-parser middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use routes
app.use('/user', userRoutes);
app.use('/names', dataRoutes);

// Route to serve the signup page
app.get('/', (req, res) => {
    res.redirect('/signup.html');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
