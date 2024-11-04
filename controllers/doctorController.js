// doctorController.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // Ensure you have bcrypt imported
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'telemedicine',
});

// Login a doctor
exports.loginDoctor = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Fetch the doctor by email
        const [rows] = await pool.query('SELECT * FROM doctors WHERE email = ?', [email]);

        if (rows.length > 0) {
            const storedPasswordHash = rows[0].password_hash; // Use the correct column name
            
            // Compare the provided password with the hashed password in the database
            const isPasswordValid = await bcrypt.compare(password, storedPasswordHash);
            if (isPasswordValid) {
                // On successful login, set session user info
                req.session.user = { 
                    id: rows[0].id, // Store the doctor's ID
                    email: rows[0].email,
                    role: 'doctor' 
                };
                return res.redirect('/doctors/dashboard'); // Redirect to dashboard
            }
        }
        // Redirect to login with error if authentication fails
        res.redirect('/doctors/login?error=Invalid credentials');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Register a doctor
exports.registerDoctor = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

        // Implement registration logic (e.g., insert into database)
        await pool.query('INSERT INTO doctors (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)', [firstName, lastName, email, hashedPassword]);

        // On successful registration, redirect to login
        res.redirect('/doctors/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); // Handle errors appropriately
    }
};

// View appointments for a doctor
exports.viewAppointments = async (req, res) => {
    const doctorId = req.session.user.id; // Get doctor ID from session

    try {
        // Fetch appointments from the database
        const [appointments] = await pool.query('SELECT * FROM appointments WHERE doctor_id = ?', [doctorId]);
        res.render('doctors/appointments', { 
            user: req.session.user, // Pass user data for layout access
            appointments 
        }); // Render appointments page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); // Handle errors appropriately
    }
};

// View doctor's profile
exports.viewProfile = async (req, res) => {
    const doctorId = req.session.user.id; // Get doctor ID from session

    try {
        // Fetch doctor details from the database
        const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [doctorId]);
        
        if (rows.length > 0) {
            res.render('doctors/doctor_profile', { 
                user: req.session.user, // Pass user data for layout access
                doctor: rows[0] // Pass doctor details to the view
            }); // Render doctor profile page
        } else {
            res.status(404).send('Doctor not found'); // Handle case where doctor is not found
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); // Handle errors appropriately
    }
};
