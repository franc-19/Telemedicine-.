const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '123456', // Replace with your MySQL password
    database: 'telemedicine', // Replace with your database name
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to MySQL database!');
    connection.release();
});

module.exports = pool;
