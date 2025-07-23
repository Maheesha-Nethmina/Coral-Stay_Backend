const mongoose = require('mongoose');

const cancellationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    enum: ['reefTour', 'hotelRoom', 'specialPackage'], 
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  timeSlot: {
    type: String, 
    default: '',
  },
  reason: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  refundAmount: {
    type: Number,
    required: true,
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CancellationRequest', cancellationRequestSchema);
