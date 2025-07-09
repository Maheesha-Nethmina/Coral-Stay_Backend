// models/priceSettingModel.js

const mongoose = require('mongoose');

const priceSettingSchema = new mongoose.Schema({
  pricePerSeat: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const PriceSetting = mongoose.model('PriceSetting', priceSettingSchema);

module.exports = PriceSetting;
