const mongoose = require('mongoose');

const altruistSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    panCardNo: { type: String, required: true },
    aadharCardNo: { type: String, required: true },
    panCardUpload: { type: String, required: true },
    aadharCardUpload: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Altruist', altruistSchema);
