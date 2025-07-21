const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const packageSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  includes:{
    type: String,
    required:  true  
  },
  price: {
    type: Number,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  offers: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['hotel', 'boatTour', 'Both'],
    required: true 
  },
  roomtype:{
    type: String,
    enum: ['Deluxe', 'Premier','Royal','PremierOcean','Presidential'],
    required: function() {
    return this.type === 'hotel' || this.type === 'Both';
  }

  },
  seatNumber: {
    type: Number,
    
  },
   imageUrl: { 
        type: String, default: ''
     }
});

module.exports = mongoose.model(
  'packageModel',
  packageSchema
);
