// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.addReview);
router.get('/', reviewController.getAllReviews);



const Review = require('../models/reviewModel'); // Mongoose model

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
