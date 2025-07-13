const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin routes
router.get('/users', adminController.getAllUsers);
router.put('/user/:id', adminController.updateUserRole);
router.put('/updateUser/:id', adminController.updateUserDetails);
router.post('/send-email',adminController.sendEmailToUser);
router.post('/requestCancellation', adminController.requestCancellation);
router.get('/getallcancellationRequests', adminController.getAllCancellationRequests);
router.put('/acceptCancellationRequest/:id', adminController.acceptCancellationRequest);

module.exports = router;
