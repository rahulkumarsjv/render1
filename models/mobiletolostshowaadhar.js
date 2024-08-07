const mongoose = require('mongoose');

const mobiletolostshowaadhar = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  status: { type: String, required: true },
  // Add any other fields you need
});

module.exports = mongoose.model('mobiletolostshowaadhar', mobiletolostshowaadhar);
