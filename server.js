const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');  // For JWT handling
const nodemailer = require('nodemailer');  // For sending emails
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

// Create a MySQL connection with SSL
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
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

global.connection = connection;

// Set up session management
app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport.js to use Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    connection.query('SELECT * FROM users WHERE google_id = ?', [profile.id], async (err, results) => {
        if (err) {
            return done(err);
        }

        if (results.length > 0) {
            return done(null, results[0]);
        } else {
            const newUser = {
                google_id: profile.id,
                username: profile.displayName,
                email: profile.emails[0].value // Google's email
            };

            connection.query('INSERT INTO users (google_id, username, email) VALUES (?, ?, ?)', 
              [newUser.google_id, newUser.username, newUser.email], (err, result) => {
                if (err) {
                    return done(err);
                }
                newUser.id = result.insertId;
                return done(null, newUser);
            });
        }
    });
  }
));

// Serialize user information into the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user information from the session
passport.deserializeUser((id, done) => {
    connection.query('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user[0]);
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Generate a JWT token
        const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send the token to the client (you can set it in a cookie or return as JSON)
        res.json({ msg: 'Login successful', token });
    }
);

// Email verification route
app.get('/verify-email', (req, res) => {
    const token = req.query.token;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Update the user's verified status in the database
        connection.query('UPDATE users SET verified = 1 WHERE id = ?', [decoded.id], (err, result) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).send('Server Error: Unable to verify email.');
            }

            if (result.affectedRows === 0) {
                return res.status(400).send('Invalid or expired verification token.');
            }

            res.send('Email verified successfully. You can now log in.');
        });
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(400).send('Invalid or expired token.');
    }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        const username = req.user.displayName || req.user.username || 'User';

        fs.readFile(path.join(__dirname, 'public', 'dashboard.html'), 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return res.status(500).send('Server Error');
            }

            const updatedData = data.replace('Hello, User!', `Hello, ${username}!`);
            res.send(updatedData);
        });
    } else {
        res.redirect('/login');
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ msg: 'Server Error: Unable to log out' });
        }
        res.redirect('/login');
    });
});

// Send verification email
function sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        text: `Click the link to verify your email: https://dining-service-4d.azurewebsites.net//verify-email?token=${token}`,
        html: `<p>Click the link to verify your email: <a href="https://dining-service-4d.azurewebsites.net//verify-email?token=${token}">Verify Email</a></p>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
        } else {
            console.log('Verification email sent:', info.response);
        }
    });
}

// Handle the signup form submission
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ msg: 'Server Error: Database query failed' });
            }

            if (results.length > 0) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
              [username, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Database insert error:', err);
                    return res.status(500).json({ msg: 'Server Error: Unable to insert user' });
                }

                // Generate a verification token
                const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });

                // Send verification email
                sendVerificationEmail(email, token);

                return res.status(200).json({ msg: 'Signup successful, please check your email for verification link.' });
            });
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ msg: `Server Error: Unexpected error occurred - ${err.message}` });
    }
});

// Handle the login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    try {
        connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ msg: 'Server Error: Database query failed' });
            }

            if (results.length === 0) {
                return res.status(400).json({ msg: 'Invalid email or password' });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid email or password' });
            }

            req.login(user, (err) => {
                if (err) {
                    console.error('Error during login:', err);
                    return res.status(500).json({ msg: 'Server Error: Unable to log in' });
                }

                // Generate a JWT token
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

                return res.status(200).json({ msg: 'Login successful, redirecting...', token });
            });
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ msg: `Server Error: Unexpected error occurred - ${err.message}` });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
