// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.addReview);
router.get('/', reviewController.getAllReviews);

module.exports = router;
