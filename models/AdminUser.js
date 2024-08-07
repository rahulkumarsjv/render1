// models/AdminUser.js
const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);
module.exports = AdminUser;
