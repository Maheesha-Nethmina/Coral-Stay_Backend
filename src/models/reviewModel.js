// src/models/reviewModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true },
  date: { type: String, required: true } // You are using toLocaleDateString(), keep as String
});

module.exports = mongoose.model('Review', reviewSchema);
