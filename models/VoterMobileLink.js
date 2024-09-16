const mongoose = require('mongoose');

const VoterMobileLinkSchema = new mongoose.Schema({
  voter_number: {
    type: String,
    required: true,
    match: /^[A-Za-z]{3}[0-9]{7}$/  // Validation for voter number format
  },
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/  // Ensuring valid 10-digit mobile number
  },
  email: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  captcha: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('VoterMobileLink', VoterMobileLinkSchema);
