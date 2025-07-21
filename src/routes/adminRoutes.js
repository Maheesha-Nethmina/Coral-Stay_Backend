const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin routes
router.get('/users', adminController.getAllUsers);
router.put('/user/:id', adminController.updateUserRole);
router.put('/updateUser/:id', adminController.updateUserDetails);
router.post('/send-email',adminController.sendEmailToUser);

module.exports = router;
