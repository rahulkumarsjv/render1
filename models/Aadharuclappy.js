const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the Aadhar UCL application form
const aadharuclappySchema = new Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    shopName: {
        type: String,
        required: true,
        trim: true
    },
    aadharNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true, // assuming Aadhar number should be unique
        minlength: 12,
        maxlength: 12
    },
    panNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 10
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    pinCode: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        maxlength: 6
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: 10, // minimum length constraint
        maxlength: 15 // updated to accommodate longer numbers
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'is invalid']
    }
}, {
    timestamps: true // Automatically creates createdAt and updatedAt fields
});

// Create a Mongoose model for the Aadhar UCL application form
const Aadharuclappy = mongoose.model('Aadharuclappy', aadharuclappySchema);

module.exports = Aadharuclappy;
