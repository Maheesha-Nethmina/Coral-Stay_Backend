const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const eventsSchema = new Schema({
    
    title: {
        type: String,
        required: true
    },
    description: {
    type: String,
    required: true,
    
    },
    date: {
        type: Date,
        required: true
    },
    mapUrl: {
     type: String
     },
    imageUrl: { 
        type: String, default: ''
     }
    
}); 
module.exports = mongoose.model(
    "eventsModel",//file name
    eventsSchema//function name
);