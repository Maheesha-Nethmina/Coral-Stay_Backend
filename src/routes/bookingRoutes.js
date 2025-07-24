const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Book a room
router.post('/roombookings', bookingController.createBooking);

//Fix method: should be POST for availability check
router.post('/availability', bookingController.checkAvailability);

module.exports = router;