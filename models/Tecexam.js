// models/TecExam.js
const mongoose = require('mongoose');

const TecExamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true }
});

module.exports = mongoose.model('TecExam', TecExamSchema);

// module.exports = TecExam;
