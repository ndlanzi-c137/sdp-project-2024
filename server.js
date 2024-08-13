// server.js
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

const app = express();

console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME, process.env.SSL_CA);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        ca: fs.readFileSync(process.env.SSL_CA),
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database as ID ' + connection.threadId);
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/names', (req, res) => {
    // Fetch all names from the `people` table
    connection.query('SELECT name FROM people', (error, results) => {
        if (error) throw error;

        // Send the names as JSON
        const names = results.map(row => row.name);
        res.json(names);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});