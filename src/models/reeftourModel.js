const mongoose = require('mongoose');

const ReefTourSchema = new mongoose.Schema({
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  blockedSeats: { type: [Number], required: true }
});

ReefTourSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('ReefTour', ReefTourSchema);