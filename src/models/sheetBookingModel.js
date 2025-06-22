const mongoose = require('mongoose');

const seatBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  googleId: {
    type: String,
    required: false,
  },
  date: {
    type: String,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  seats: {
    type: [Number],
    required: true,
  },
  user: {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    nicNumber: {
      type: String,
      required: true,
    },
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SeatBooking = mongoose.model('SeatBooking', seatBookingSchema);

module.exports = SeatBooking;
