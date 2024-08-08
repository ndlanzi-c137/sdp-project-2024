// server.js
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');

const app = express();

// MySQL connection with SSL
const connection = mysql.createConnection({
    host: 'dining-service-db.mysql.database.azure.com',
    user: 'dining',
    password: '123cyad#',
    database: 'DINING_SERVICES',
    port: 3306,
    ssl: {
        ca: 'DigiCertGlobalRootCA.crt.pem',
        rejectUnauthorized: false
    }
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