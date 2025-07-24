const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: { type: Number, required: true },
  roomTitle: { type: String, required: true },
  packageType: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  quantity: { type: Number, required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  nicNumber: { type: String, required: true },
  contactNumber: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);