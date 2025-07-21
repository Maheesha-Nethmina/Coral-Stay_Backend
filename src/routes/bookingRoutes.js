// routes/bookingRoutes.js

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/roombookings', bookingController.createBooking);
router.post('/availability', bookingController.checkAvailability);

module.exports = router;
