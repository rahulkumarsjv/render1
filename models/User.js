// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   PhoneNumber: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   walletBalance: { type: Number, default: 0 },
// });

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  PhoneNumber: {
     type: String, required: true 
    },
  email: {
    type: String,
    required: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('User', userSchema);

