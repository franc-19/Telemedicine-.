// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure this middleware is used

// Route to show the admin dashboard
router.get('/dashboard', authMiddleware, adminController.showDashboard); // Protect this route with middleware

// Add other admin-related routes here as needed

module.exports = router;
