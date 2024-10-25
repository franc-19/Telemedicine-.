// controllers/patientController.js
const Patient = require('../models/patientModel');

const PatientController = {
    registerPatient: (req, res) => {
        const patientData = req.body;
        Patient.create(patientData)
            .then(patientId => {
                res.status(201).json({ message: 'Patient registered successfully!', patientId });
            })
            .catch(err => {
                res.status(500).json({ message: 'Error registering patient', error: err });
            });
    },
    // Add more methods for handling patient-related requests...
};

module.exports = PatientController;
