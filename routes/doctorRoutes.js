const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

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
    res.render('doctors/login'); // Render the doctor's login page
});

router.post('/login', doctorController.loginDoctor);

// Route for doctor's registration
router.get('/register', (req, res) => {
    res.render('doctors/register'); // Render the doctor's registration page
});

router.post('/register', doctorController.registerDoctor);

// Route for doctor's dashboard (authenticated with middleware)
router.get('/dashboard', isDoctor, (req, res) => {
    res.render('doctors/dashboard', { user: req.session.user });
});

// Route for viewing doctor's appointments
router.get('/appointments', isDoctor, doctorController.viewAppointments);

// Route for GET /doctors (e.g., home or list of doctors)
router.get('/', (req, res) => {
    res.send('Doctors Home Page or List of Doctors');
});

module.exports = router;
