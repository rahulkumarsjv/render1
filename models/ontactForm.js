const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactFormSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContactForm', contactFormSchema);
