const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: { type: Number, required: true },
  roomTitle: { type: String, required: true },
  packageType: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
