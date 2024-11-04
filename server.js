const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const mysql = require('mysql2/promise');
const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const doctorRoutes = require('./routes/doctorRoutes'); // Import doctor routes
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Set up session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'telemedicine',
});

// Passport JWT strategy
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret'
};

passport.use(new Strategy(opts, async (jwt_payload, done) => {
    try {
        const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [jwt_payload.id]);
        if (results.length > 0) return done(null, results[0]);
        return done(null, false);
    } catch (err) {
        return done(err, false);
    }
}));

// Initialize passport
app.use(passport.initialize());

// ===================== ROUTES ===================== //

// Use doctor routes
app.use('/doctors', doctorRoutes);

// Use admin routes
app.use('/admin', adminRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

// Patient registration page
app.get('/register', (req, res) => {
    res.render('register');
});

// Patient registration logic
app.post('/register', 
    [
        body('first_name').notEmpty().withMessage('First name is required'),
        body('last_name').notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { first_name, last_name, email, password } = req.body;

        try {
            const [userExists] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (userExists.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            const hash = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', 
                [first_name, last_name, email, hash, 'patient']);
            
            res.redirect('/login');
        } catch (err) {
            console.error('Error during registration:', err);
            res.status(500).json({ error: err.message });
        }
});

// Patient login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Patient login logic
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user[0].password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user[0].id, email: user[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        req.session.user = { id: user[0].id, email: user[0].email, first_name: user[0].first_name, last_name: user[0].last_name, role: user[0].role, token };
        
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Patient logout logic
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Error logging out');
        res.redirect('/');
    });
});

// Patient profile
app.get('/profile', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('profile', { user: req.session.user });
});

// Patient appointments
app.get('/appointments', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        const [appointments] = await pool.query('SELECT * FROM appointments WHERE patient_id = ?', [req.session.user.id]);
        res.render('appointments', { appointments });
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).send('Error fetching appointments');
    }
});

// Book an appointment
app.get('/appointments/book', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        const [doctors] = await pool.query('SELECT * FROM doctors');
        res.render('appointments/book_appointment', { doctors });
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).send('Error fetching doctors');
    }
});

// Appointment booking logic
app.post('/appointments/book', async (req, res) => {
    const { doctorId, appointmentDate, appointmentTime } = req.body;
    const patientId = req.session.user.id;
    const patientName = `${req.session.user.first_name} ${req.session.user.last_name}`;

    if (!doctorId || !appointmentDate || !appointmentTime) {
        return res.status(400).send('All fields are required');
    }

    try {
        const [doctor] = await pool.query('SELECT CONCAT(first_name, " ", last_name) AS name FROM doctors WHERE id = ?', [doctorId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Doctor not found' });

        const doctorName = doctor[0].name;
        await pool.query(
            'INSERT INTO appointments (doctor_id, doctor_name, appointment_date, appointment_time, patient_id, patient_name) VALUES (?, ?, ?, ?, ?, ?)',
            [doctorId, doctorName, appointmentDate, appointmentTime, patientId, patientName]
        );

        res.render('appointments/appointment_confirmation', {
            doctorName,
            appointmentDate,
            appointmentTime,
            location: 'Online Consultation', 
            patientName
        });
    } catch (err) {
        console.error('Error booking appointment:', err);
        res.status(500).send('Error booking appointment');
    }
});

// Cancel Appointment Logic
app.post('/appointments/cancel/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        await pool.query('DELETE FROM appointments WHERE id = ?', [appointmentId]);
        res.redirect('/appointments');
    } catch (err) {
        console.error('Error cancelling appointment:', err);
        res.status(500).send('Error cancelling appointment');
    }
});

// ===================== DOCTOR ROUTES ===================== //

// Doctor registration page
app.get('/doctors/register', (req, res) => {
    res.render('doctors/doctor_register'); // Create this view file
});

// Doctor registration logic
app.post('/doctors/register', 
    [
        body('first_name').notEmpty().withMessage('First name is required'),
        body('last_name').notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { first_name, last_name, email, password } = req.body;

        try {
            const [userExists] = await pool.query('SELECT * FROM doctors WHERE email = ?', [email]);
            if (userExists.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            const hash = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO doctors (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)', 
                [first_name, last_name, email, hash]);
            
            res.redirect('/doctors/login');
        } catch (err) {
            console.error('Error during registration:', err);
            res.status(500).json({ error: err.message });
        }
});

// Doctor login page
app.get('/doctors/login', (req, res) => {
    res.render('doctors/doctor_login'); // Create this view file
});

// Doctor login logic
app.post('/doctors/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await pool.query('SELECT * FROM doctors WHERE email = ?', [email]);
        if (user.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user[0].password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user[0].id, email: user[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        req.session.user = { id: user[0].id, email: user[0].email, first_name: user[0].first_name, last_name: user[0].last_name, role: user[0].role, token };
        
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
