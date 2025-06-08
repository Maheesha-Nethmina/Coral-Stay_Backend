const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const eventsSchema = new Schema({
    image: {
        type: String,
        required: true
    },
    
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
    
    
}); 
module.exports = mongoose.model(
    "eventsModel",//file name
    eventsSchema//function name
);