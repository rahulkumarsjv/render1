const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentAadharSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  number1: {
    type: String,
    required: true
  },
  utrNumber: {
    type: String,
    required: true,
    unique: true // Ensure UTR numbers are unique
  },
  email: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('PaymentAadhar', paymentAadharSchema);
