const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LostPANSchemas = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  aadhaarNumber: { type: String, required: true },
  applyDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Submitted' }
});

module.exports = mongoose.model('LostPAN', LostPANSchemas);
