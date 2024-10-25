// controllers/authController.js
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables

// Create a MySQL connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Login function
exports.login = (req, res) => {
    const { username, password } = req.body;

    // Query the database to find the user
    db.query('SELECT * FROM admin WHERE username = ?', [username], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }

        // Check if user exists and verify password
        if (results.length > 0) {
            const user = results[0]; // Get the first user found
            bcrypt.compare(password, user.password_hash, (err, match) => {
                if (match) {
                    req.session.userId = user.id; // Store user ID in session
                    req.session.role = 'admin'; // Set user role to 'admin'
                    return res.redirect('/admin/dashboard'); // Redirect to admin dashboard
                } else {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            });
        } else {
            // Check if the user is a patient (you can modify this part to fetch from a 'patients' table)
            db.query('SELECT * FROM patients WHERE username = ?', [username], (error, patientResults) => {
                if (error) {
                    return res.status(500).json({ error: error.sqlMessage });
                }

                if (patientResults.length > 0) {
                    const patient = patientResults[0]; // Get the first patient found
                    bcrypt.compare(password, patient.password_hash, (err, match) => {
                        if (match) {
                            req.session.userId = patient.id; // Store patient ID in session
                            req.session.role = 'patient'; // Set user role to 'patient'
                            return res.redirect('/patient/dashboard'); // Redirect to patient dashboard
                        } else {
                            return res.status(401).json({ message: 'Invalid credentials' });
                        }
                    });
                } else {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            });
        }
    });
};
