const mongoose = require('mongoose');

const aadhartodetalisSchema = new mongoose.Schema({
  aadhar_number: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const AadharToDetails = mongoose.model('AadharToDetails', aadhartodetalisSchema);
module.exports = AadharToDetails;
