// LostAadhar schema example
const mongoose = require('mongoose');

const LostAadharSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment_id: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  aadharHolderName: {
    type: String,
    required: true
  },
  apply_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'Pending'
  }
});

module.exports = mongoose.model('LostAadhar', LostAadharSchema);
