const mongoose = require('mongoose');

const AadharporinaddSchema = new mongoose.Schema({
    point: { type: Number, required: true },
    rupess: { type: Number, required: true },
    mobile_number: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Aadharporinadd', AadharporinaddSchema);
