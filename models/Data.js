// models/Data.js
const mongoose = require('mongoose');

// Define your schema here
const dataSchema = new mongoose.Schema({
  name: String,
  address: String,
  id: String,
  // Add other fields as needed
});

const DataModel = mongoose.model('Data', dataSchema);

module.exports = DataModel;
