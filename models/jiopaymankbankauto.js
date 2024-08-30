const mongoose = require('mongoose');

const jiopaymankbankSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountNo: { type: String, required: true },
    ifscCode: { type: String, required: true },
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    date_of_birth: { type: Date, required: true },
    address: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    branch: { type: String, required: true },
    branchAddress: { type: String, required: true },
    accountOpenDate: { type: Date, required: true },
    uniqueNumber: { type: String, required: true } // Ensure this is defined
});

module.exports = mongoose.model('Jiopaymankbank', jiopaymankbankSchema);
