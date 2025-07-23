// File: routes/weatherAlertRoutes.js

const express = require('express');
const router = express.Router();

const getUnsafeDayBookings = require('../controllers/getUnsafeDayBookings');
const { sendUnsafeWeatherEmail } = require('../controllers/sendUnsafeWeatherEmail');

// GET all bookings affected by unsafe weather between 9AM–12PM
router.get('/unsafe-bookings', getUnsafeDayBookings);

// POST to send email to specific booking
router.post('/send-alert-email/:bookingId', sendUnsafeWeatherEmail);

module.exports = router;
