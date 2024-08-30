const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const lunchRoute = require("./menu_backend/menuRoutes/lunchRoute");
const breakfastRoute=require('./menu_backend/menuRoutes/breakfastRoute');
const dinnerRoute=require('./menu_backend/menuRoutes/dinnerRoute');

// Initialize the Express app
const app = express();

// Create a MySQL connection with SSL
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306,
    ssl: {
        ca: fs.readFileSync(process.env.MYSQL_CA_CERT), // Ensure this path is correct
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
app.use(express.static(path.join(__dirname, 'menu_frontend')));

// Use body-parser middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to serve the signup page
app.get('/', (req, res) => {
    res.redirect('/index.html');
});


app.use('/breakfast',breakfastRoute);
app.use('/lunch',lunchRoute);
app.use('/dinner',dinnerRoute);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
