// controllers/appointmentController.js
const Appointment = require('../models/appointmentModel');
const db = require('../config/db'); // Ensure to import your database connection

// Show booking form
exports.showBookingForm = (req, res) => {
    const query = 'SELECT id, first_name, last_name FROM doctors'; // Query to get the list of doctors
    db.query(query, (err, doctors) => {
        if (err) {
            console.error('Error fetching doctors:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (!doctors.length) {
            return res.status(404).send('No doctors available');
        }
        res.render('book_appointment', { doctors }); // Pass doctors to the booking view
    });
};

// Schedule a new appointment
exports.scheduleAppointment = (req, res) => {
    if (!req.user || !req.user.email) {
        return res.status(400).send('User not authenticated');
    }

    const newAppointment = {
        patient_name: req.user.email, // Assuming you have user authentication set up
        doctor_id: req.body.doctor, // Capture doctor ID from the form submission
        appointment_date: req.body.date, // Capture date from the form submission
        appointment_time: req.body.time, // Capture time from the form submission
    };

    Appointment.create(newAppointment, (error, result) => {
        if (error) {
            console.error('Error scheduling appointment:', error);
            return res.status(500).send('Error scheduling appointment');
        }
        res.redirect('/appointments'); // Redirect to the appointments page after scheduling
    });
};

// Get all appointments for the user
exports.getAppointments = (req, res) => {
    if (!req.user || !req.user.email) {
        return res.status(400).send('User not authenticated');
    }

    const query = 'SELECT * FROM appointments WHERE patient_name = ?'; // Ensure you filter appointments by user
    db.query(query, [req.user.email], (error, appointments) => { // Assuming req.user.email contains the user's email
        if (error) {
            return res.status(500).send('Error fetching appointments');
        }
        res.render('appointments', { appointments }); // Render appointments view with fetched data
    });
};

// Cancel an appointment
exports.cancelAppointment = (req, res) => {
    const appointmentId = req.params.id;

    Appointment.cancel(appointmentId, (error, result) => {
        if (error) {
            return res.status(500).send('Error canceling appointment');
        }
        res.redirect('/appointments'); // Redirect to the appointments page after cancellation
    });
};
