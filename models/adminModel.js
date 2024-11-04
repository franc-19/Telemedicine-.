// models/adminModel.js
const db = require('../config/db');

// Create a function to find admin by username
exports.findAdminByUsername = (username, callback) => {
    const query = 'SELECT * FROM admin WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results[0]);
    });
};

// Create a function to handle admin creation if needed
exports.createAdmin = (username, passwordHash, callback) => {
    const query = 'INSERT INTO admin (username, password_hash) VALUES (?, ?)';
    db.query(query, [username, passwordHash], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};
