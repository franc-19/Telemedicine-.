// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
require('dotenv').config(); // Load environment variables

// Render the login form
router.get('/login', (req, res) => {
    res.render('auth/login'); // Render the login view
});

// Handle login request
router.post('/login', authController.login); // Delegate login logic to authController

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.redirect('/'); // Redirect to home page after logout
    });
});

module.exports = router;
