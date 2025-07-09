const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/roombookings', bookingController.createBooking);
router.get('/availability', bookingController.checkAvailability);

module.exports = router;
