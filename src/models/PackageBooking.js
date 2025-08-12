const mongoose = require('mongoose');

const packageBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  googleId: { type: String },
  user: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    nicNumber: { type: String, required: true },
  },

  packageType: { type: String, enum: ['hotel', 'boattour', 'both'], required: true },
  bookedDate: { type: Date, required: true },
  checkOutDate: { type: Date },
  totalAmount: { type: Number, required: true },

  packageDetails: {
    id: { type: String },
    name: { type: String },
    roomtype: { type: String },
    seatNumber: { type: Number },
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PackageBooking', packageBookingSchema);
