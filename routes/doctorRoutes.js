// doctorRoutes.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const Appointment = require('../models/appointmentModel'); // Import the Appointment model
const Doctor = require('../models/doctorModel'); // Import the Doctor model

// Middleware to check if the user is a doctor
function isDoctor(req, res, next) {
    if (req.session.user && req.session.user.role === 'doctor') {
        next();
    } else {
        res.redirect('/doctors/login'); // Redirect to doctor's login if not authenticated
    }
}

// Route for doctor's login
router.get('/login', (req, res) => {
    const error = req.query.error || null; // Get error from query params, if any
    res.render('doctors/doctor_login', { error }); // Pass the error to the EJS template
});

// Handle doctor's login
router.post('/login', doctorController.loginDoctor);

// Route for doctor's registration
router.get('/register', (req, res) => {
    res.render('doctors/doctor_register'); // Render the doctor's registration page
});

// Handle doctor's registration
router.post('/register', doctorController.registerDoctor);

// Route for doctor's dashboard (authenticated with middleware)
router.get('/dashboard', isDoctor, async (req, res) => {
    try {
        // Fetch appointments for the logged-in doctor
        const appointments = await Appointment.getAppointmentsForDoctor(req.session.user.id);

        // Render dashboard with user data and appointments
        res.render('doctors/dashboard', {
            user: req.session.user,
            appointments: appointments || [] // Pass appointments to the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route for viewing doctor's appointments (authenticated with middleware)
router.get('/appointments', isDoctor, async (req, res) => {
    try {
        // Fetch appointments for the logged-in doctor
        const appointments = await Appointment.getAppointmentsForDoctor(req.session.user.id);

        // Render appointments view with user data and appointments
        res.render('doctors/appointments', {
            user: req.session.user,
            appointments: appointments || [] // Pass appointments to the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route for GET /doctors (home page or list of doctors)
router.get('/', async (req, res) => {
    try {
        // Fetch all doctors from the database
        const doctors = await Doctor.getAll();

        // Render the doctors list view with the doctors data
        res.render('doctors/doctor_list', {
            doctors: doctors || [] // Pass the doctors data to the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Export the router
module.exports = router;
