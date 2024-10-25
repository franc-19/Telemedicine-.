// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware'); // Import the authentication middleware

// Route to show the booking form
router.get('/book', authMiddleware, appointmentController.showBookingForm); // Protect this route

// Route to schedule a new appointment
router.post('/schedule', authMiddleware, appointmentController.scheduleAppointment); // Protect scheduling as well

// Route to get all appointments
router.get('/', authMiddleware, appointmentController.getAppointments); // Protect this route

// Route to cancel an appointment
router.get('/cancel/:id', authMiddleware, appointmentController.cancelAppointment); // Protect this route

module.exports = router;
