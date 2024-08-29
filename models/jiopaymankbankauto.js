// models/Jiopaymankbank.js
const mongoose = require('mongoose');

const JiopaymankbankSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountNo: { type: String, required: true },
    ifscCode: { type: String, required: true },
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    date_of_birth: { type: String, required: true },
    address: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    branch: { type: String, required: true },
    branchAddress: { type: String, required: true },
    accountOpenDate: { type: String, required: true },
    uniqueNumber: { type: String, required: true, unique: true }
    
});

const Jiopaymankbank = mongoose.model('Jiopaymankbank', JiopaymankbankSchema);

module.exports = Jiopaymankbank;
