// src/controllers/reviewController.js
const Review = require('../models/reviewModel');

// Create Review
const addReview = async (req, res) => {
  try {
    const { name, location, rating, content, date } = req.body;

    if (!name || !location || !rating || !content || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const review = new Review({ name, location, rating, content, date });
    await review.save();

    return res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({ message: "Server error while adding review" });
  }
};

// Get All Reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error while fetching reviews" });
  }
};

module.exports = {
  addReview,
  getAllReviews
};
