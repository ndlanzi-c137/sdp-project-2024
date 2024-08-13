//data.js
const express = require('express');

const router = express.Router();

router.get('/name', (req, res) => {
    connection.query('SELECT name FROM people', (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            res.status(500).json({ msg: 'Database query failed' });
            return;
        }

        const names = results.map(row => row.name);
        res.json(names);
    });
});


module.exports = router;