const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  PhoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  password: {
    type: String,
    required: true
  },
  uniqueNumber: {
    type: String,
    required: true,
    unique: true
  },
  registerDate: {
    type: Date,
    default: Date.now // Automatically set the current date
  }
});

module.exports = mongoose.model('User', userSchema);
