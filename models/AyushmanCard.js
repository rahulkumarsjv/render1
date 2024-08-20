const mongoose = require('mongoose');

const AyushmanCardSchema = new mongoose.Schema({
    status: { type: String, required: true },
    selectproof: { type: String, required: true },
    parameter: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AyushmanCard', AyushmanCardSchema);
