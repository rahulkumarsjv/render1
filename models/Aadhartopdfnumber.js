const mongoose = require('mongoose');

// Define the AadharNumber schema
const Aadhar_NumberSchema = new mongoose.Schema({
    aadhar_number: { type: String, required: true },
    email: { type: String, required: true },  // Add the email field
    createdAt: { type: Date, default: Date.now }
});

// Create and export the AadharNumber model
const Aadhar_Number = mongoose.model('Aadhar_Number', Aadhar_NumberSchema);

module.exports = Aadhar_Number;
