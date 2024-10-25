const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, date_of_birth, gender, address } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    
    const query = `INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender, address) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.execute(query, [first_name, last_name, email, password_hash, phone, date_of_birth, gender, address]);
    
    res.status(201).send('Patient registered successfully');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.execute(`SELECT * FROM patients WHERE email = ?`, [email]);

    if (rows.length === 0) {
        return res.status(401).send('Email or password is incorrect');
    }

    const patient = rows[0];
    const match = await bcrypt.compare(password, patient.password_hash);
    
    if (match) {
        req.session.patientId = patient.id;
        return res.send('Logged in successfully');
    } else {
        return res.status(401).send('Email or password is incorrect');
    }
});

module.exports = router;
