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
  utrNumber: { // Update this field name if it differs in your schema
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  amount: { // Update this field name if it differs in your schema
    type: Number,
    required: true
  },
  filePath: { // Ensure this field is correctly defined and used
    type: String,
    required: true
  }
});

module.exports = mongoose.model('PaymentAadhar', paymentAadharSchema);
