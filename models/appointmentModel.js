// models/appointmentModel.js
const db = require('../config/db'); // Import your database connection

const Appointment = {
    create: (data, callback) => {
        const query = 'INSERT INTO appointments (patient_name, appointment_date, appointment_time) VALUES (?, ?, ?)';
        db.query(query, [data.patient_name, data.appointment_date, data.appointment_time], callback);
    },

    getAll: (callback) => {
        const query = 'SELECT * FROM appointments ORDER BY appointment_date, appointment_time';
        db.query(query, callback);
    },

    cancel: (id, callback) => {
        const query = 'DELETE FROM appointments WHERE id = ?';
        db.query(query, [id], callback);
    },

    // New function to get appointments for a specific doctor
    getAppointmentsForDoctor: (doctorId, callback) => {
        const query = 'SELECT * FROM appointments WHERE doctor_id = ? ORDER BY appointment_date, appointment_time'; // Assuming you have a doctor_id column in your appointments table
        db.query(query, [doctorId], callback);
    },
};

module.exports = Appointment;
