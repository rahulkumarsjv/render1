const mongoose = require('mongoose');

const kotakSchema = new mongoose.Schema({
    fullName: String,
    shopName: String,
    mobileNumber: String,
    email: String,
    deviceSerialNo: String,
    bankName: String,
    accountNo: String,
    ifscCode: String,
    photo: String,
    aadhar: String,
    bankPassbook: String,
    panCard: String,
    fingerprintDeviceBackPhoto: String,
});

const Kotak = mongoose.model('Kotak', kotakSchema);

module.exports = Kotak;
