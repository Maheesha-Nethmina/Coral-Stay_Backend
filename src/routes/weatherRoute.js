const express = require('express');
const router = express.Router();
const { getWeatherAlerts } = require('../controllers/weatherController');

// GET /api/weather/alerts
router.get('/alerts', getWeatherAlerts);

module.exports = router;
