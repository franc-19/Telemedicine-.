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
        res.render('appointments/book_appointment', { doctors }); // Ensure correct path to your view
    });
};

// Schedule a new appointment
exports.scheduleAppointment = (req, res) => {
    // Check if the user is authenticated
    if (!req.session.user || !req.session.user.email) {
        return res.status(401).send('User not authenticated');
    }

    const newAppointment = {
        patient_name: `${req.session.user.first_name} ${req.session.user.last_name}`, // Use session user data
        doctor_id: req.body.doctor, // Capture doctor ID from the form submission
        appointment_date: req.body.date, // Capture date from the form submission
        appointment_time: req.body.time, // Capture time from the form submission
    };

    // Insert the appointment into the database
    db.query('INSERT INTO appointments SET ?', newAppointment, (error, result) => {
        if (error) {
            console.error('Error scheduling appointment:', error);
            return res.status(500).send('Error scheduling appointment');
        }
        
        // After successfully scheduling, render the confirmation page
        res.render('appointments/appointment_confirmation', {
            doctorName: req.body.doctor, // You may want to query for the doctor's name separately
            appointmentDate: req.body.date,
            appointmentTime: req.body.time,
            location: 'Online Consultation',
            patientName: newAppointment.patient_name,
            session: req.session.user // Pass the session data to the confirmation page
        });
    });
};

// Get all appointments for the user
exports.getAppointments = (req, res) => {
    // Check if the user is authenticated
    if (!req.session.user || !req.session.user.email) {
        return res.status(401).send('User not authenticated');
    }

    const query = 'SELECT * FROM appointments WHERE patient_name = ?'; // Ensure you filter appointments by user
    db.query(query, [req.session.user.first_name + ' ' + req.session.user.last_name], (error, appointments) => { // Use the full name for filtering
        if (error) {
            console.error('Error fetching appointments:', error);
            return res.status(500).send('Error fetching appointments');
        }
        res.render('appointments', { appointments }); // Render appointments view with fetched data
    });
};

// Cancel an appointment
exports.cancelAppointment = (req, res) => {
    const appointmentId = req.params.id;

    db.query('DELETE FROM appointments WHERE id = ?', [appointmentId], (error, result) => {
        if (error) {
            console.error('Error canceling appointment:', error);
            return res.status(500).send('Error canceling appointment');
        }
        res.redirect('/appointments'); // Redirect to the appointments page after cancellation
    });
};
