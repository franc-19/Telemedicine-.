const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'telemedicine'
});

// Render the admin login page
router.get('/login', (req, res) => {
    res.render('admin/admin_login', { title: 'Admin Login' });
});

// Handle admin login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Fetch admin details from the database
    db.query('SELECT * FROM admin WHERE username = ?', [username], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const admin = results[0];

        // Compare the provided password with the stored hashed password
        bcrypt.compare(password, admin.password_hash, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: err });
            }

            if (!isMatch) {
                return res.status(401).send('Invalid username or password');
            }

            // Set admin session (you can customize this as needed)
            req.session.adminId = admin.id;
            req.session.username = admin.username;

            // Redirect to the dashboard after successful login
            res.redirect('/admin/dashboard');
        });
    });
});

// Render the admin dashboard (only for authenticated admins)
router.get('/dashboard', authMiddleware, (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// Render the add admin form (only for authenticated admins)
router.get('/add', authMiddleware, (req, res) => {
    res.render('admin/add', { title: 'Add Admin' });
});

// Handle adding a new admin (only for authenticated admins)
router.post('/add', authMiddleware, (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        const insertQuery = 'INSERT INTO admin (username, password_hash) VALUES (?, ?)';
        db.query(insertQuery, [username, hash], (error) => {
            if (error) {
                return res.status(500).json({ error: error.sqlMessage });
            }
            res.redirect('/admin/manage');
        });
    });
});

// Render the manage admins page (only for authenticated admins)
router.get('/manage', authMiddleware, (req, res) => {
    db.query('SELECT * FROM admin', (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.render('admin/manage', { admins: results, title: 'Manage Admins' });
    });
});

// Render the edit admin page (only for authenticated admins)
router.get('/edit/:id', authMiddleware, (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM admin WHERE id = ?', [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        if (results.length === 0) {
            return res.status(404).send('Admin not found');
        }
        res.render('admin/edit', { admin: results[0], title: 'Edit Admin' });
    });
});

// Handle editing an existing admin (only for authenticated admins)
router.post('/edit/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    let query;
    let values;

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        query = 'UPDATE admin SET username = ?, password_hash = ? WHERE id = ?';
        values = [username, hashedPassword, id];
    } else {
        query = 'UPDATE admin SET username = ? WHERE id = ?';
        values = [username, id];
    }

    db.query(query, values, (error) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.redirect('/admin/manage');
    });
});

// Handle deleting an admin (only for authenticated admins)
router.get('/delete/:id', authMiddleware, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM admin WHERE id = ?', [id], (error) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.redirect('/admin/manage');
    });
});

// Set up a default route for /admin (only for authenticated admins)
router.get('/', authMiddleware, (req, res) => {
    res.redirect('/admin/dashboard');
});

module.exports = router;
