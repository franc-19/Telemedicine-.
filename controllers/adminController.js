// controllers/adminController.js
const bcrypt = require('bcrypt');
const Admin = require('../models/adminModel');

// Admin login logic
exports.login = (req, res) => {
    const { username, password } = req.body;
    
    Admin.findAdminByUsername(username, (err, admin) => {
        if (err) {
            return res.status(500).send('Server error');
        }
        if (!admin) {
            return res.status(401).send('Invalid username or password');
        }

        // Compare hashed password
        bcrypt.compare(password, admin.password_hash, (err, match) => {
            if (err) {
                return res.status(500).send('Server error');
            }
            if (match) {
                req.session.admin = { id: admin.id, username: admin.username };
                return res.redirect('/admin/dashboard'); // Redirect to admin dashboard
            } else {
                return res.status(401).send('Invalid username or password');
            }
        });
    });
};

// Admin logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/admin/login');
    });
};

// Add a new admin
exports.addAdmin = (req, res) => {
    const { username, password } = req.body;

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // Insert the new admin into the database
        const newAdmin = new Admin({ username, password_hash: hash });
        newAdmin.save((error) => {
            if (error) {
                return res.status(500).json({ error: error.sqlMessage });
            }
            res.redirect('/admin/manage'); // Redirect to manage admins after successful addition
        });
    });
};

// Get all admins
exports.getAllAdmins = (req, res) => {
    Admin.findAll((error, results) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.render('admin/manage', { admins: results }); // Pass the list of admins to the view
    });
};

// Edit an admin
exports.editAdmin = (req, res) => {
    const { id } = req.params;

    Admin.findById(id, (error, admin) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.render('admin/edit', { admin }); // Pass the admin details to the view
    });
};

// Update an admin
exports.updateAdmin = (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    const updateData = { username };
    
    if (password) {
        updateData.password_hash = bcrypt.hashSync(password, 10);
    }

    Admin.update(id, updateData, (error) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.redirect('/admin/manage'); // Redirect to manage admins after successful edit
    });
};

// Delete an admin
exports.deleteAdmin = (req, res) => {
    const { id } = req.params;

    Admin.delete(id, (error) => {
        if (error) {
            return res.status(500).json({ error: error.sqlMessage });
        }
        res.redirect('/admin/manage'); // Redirect to manage admins after successful deletion
    });
};
