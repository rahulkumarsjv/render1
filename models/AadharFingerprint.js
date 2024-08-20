const mongoose = require('mongoose');

const FingerprintSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    stateName: { type: String, required: true },
    shopName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fingerprint', FingerprintSchema);
