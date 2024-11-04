// models/doctorModel.js
const db = require('../config/db'); // Import your database connection

const Doctor = {
    // Other methods...

    getAll: (callback) => {
        const query = 'SELECT * FROM doctors ORDER BY last_name'; // Adjust the query as needed
        db.query(query, callback);
    },
};

module.exports = Doctor;
