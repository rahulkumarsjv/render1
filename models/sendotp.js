const mongoose = require('mongoose');

// Check if the model is already compiled
const sendotp = mongoose.models.sendotp || mongoose.model('sendotp', new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  otp: {
     type: String 
    },
  otpExpires: {
     type: Date 
    }
}));

module.exports = sendotp;
