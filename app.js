const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const nodemailer = require('nodemailer');
const User = require('./models/User');
const AdminUser = require('./models/AdminUser'); // Path to your AdminUser model
const LostPAN = require('./models/LostPAN');
const record = require('./models/Record');
const Transaction = require('./models/Transaction');
const PaymentAadhar = require('./models/PaymentAadharIndex');
const LostAadhar = require('./models/lost-submit-form');
const Pana49form = require('./models/Pana49form');
const CorrectionPan = require('./models/correctionpan');
const AyushmanCard = require('./models/AyushmanCard');
const Fingerprint = require('./models/AadharFingerprint');
const Aadharporinadd = require('./models/Aadharporinadd');
const Tecexam = require('./models/Tecexam');
const Shop = require('./models/utipsa');
const Altruist = require('./models/panaltruist');
const Aadharuclappy = require('./models/Aadharuclappy'); // Ensure the correct path is used
const DataModel = require('./models/Data'); // Import your schema
const Jiopaymankbank = require('./models/jiopaymankbankauto');
const Kotak = require('./models/Kotak'); // Adjust the path based on the actual location of your model
const Aadhar_Number = require('./models/aadhartopdfnumber');
// const E_Shram_Card = require('./models/E_shram_card'); // Correct path
const AadharToDetails = require('./models/adhart Details')
const crypto = require('crypto');
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());
const port = process.env.PORT || 3000;

// // Connect to MongoDB
// mongoose.connect('mongodb+srv://rahul199202012:gexBdbMGUqtwE3Nq@cluster0.k7xol6w.mongodb.net/rndigitalindia', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
//   .then(() => console.log('MongoDB connected successfully'))
//   .catch(error => {
//     console.error('MongoDB connection failed:', error.message);
//     process.exit(1);
//   });

mongoose.connect('mongodb+srv://rahul199202012:gexBdbMGUqtwE3Nq@cluster0.k7xol6w.mongodb.net/rndigitalindia', {
  // No need to use `useNewUrlParser` and `useUnifiedTopology`
})
.then(() => console.log('MongoDB connected successfully'))
.catch(error => {
  console.error('MongoDB connection failed:', error.message);
  process.exit(1);
});


// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session management
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to log session details
app.use((req, res, next) => {
  console.log('Session details:', req.session);
  next();
});

// Middleware to check authentication
function checkAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  next();
}


// Initialize your email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pancard4886@gmail.com', // Use environment variables for security
    pass: 'ifbk zmta bxqj mkyp' // Use environment variables for security
  }
});

/// In-memory store for OTPs (replace with a database in production)
const otpStore = {};

// Function to generate a numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric OTP
};

// Route to send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if the user exists in the database
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Generate and store OTP with timestamp
      const otp = generateOTP();
      const otpExpiry = Date.now() + 3 * 60 * 1000; // OTP expires in 3 minutes
      otpStore[email] = { otp, otpExpiry };

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Registration OTP',
        text: `Your OTP for registration is ${otp}`
      };

      await transporter.sendMail(mailOptions);
      console.log('OTP sent successfully');
      res.json({ message: 'OTP sent successfully' });
    } else {
      res.status(404).json({ message: 'Email not registered' });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const storedOtpData = otpStore[email];
  if (storedOtpData) {
    const { otp: storedOtp, otpExpiry } = storedOtpData;
    if (Date.now() > otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    if (storedOtp === otp) {
      delete otpStore[email]; // Remove OTP after successful verification
      req.session.email = email; // Store email in session
      console.log('OTP verified successfully, email stored in session:', email);
      return res.json({ message: 'OTP verified successfully', success: true });
    }
  }
  return res.status(400).json({ message: 'Invalid OTP', success: false });
});

// Route to handle password reset
app.post('/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  const email = req.session.email; // Retrieve the email stored in session after OTP verification

  if (!newPassword || !email) {
    console.log('Missing new password or email:', { newPassword, email });
    return res.status(400).json({ message: 'New password and email are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});
// Route to handle form submission
app.post('/submit-contact', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const mailOptions = {
    from: email,
    to: 'pancard4886@gmail.com',
    subject: 'RA DIGITAL INDIA Cyber Cafe',
    replyTo: email,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending email' });
    }
    console.log('Email sent:', info.response);
    res.json({ message: 'Form submitted successfully' });
  });
});

app.post('/register', async (req, res) => {
  const { name, PhoneNumber, email, password, confirmpassword } = req.body;

  if (!name || !PhoneNumber || !email || !password || !confirmpassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      PhoneNumber,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      res.redirect('/profile.html');
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/login.html');
  });
});

// Profile API
app.get('/api/profile', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json({
      name: user.name,
      email: user.email,
      PhoneNumber: user.PhoneNumber,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send('Error fetching profile');
  }
});

// Route to serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route to serve home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
// Route to serve home page
app.get('/sign_up', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sign_up.html'));
});
// Route to serve home page
app.get('/opin_mone', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'opin_mone.html'));
});
app.get('/ayushmancarddownload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ayushmancarddownload.html'));
});
app.get('/fingerprintaadharidregistration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fingerprintaadharidregistration.html'));
});
app.get('/addpoint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fingerprintaadharidregistration.html'));
});
app.get('/aadhar_card_banna', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aadhar_card_banna.html'));
});
app.get('/jiopaymankbank', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'jiopaymankbank.html'));
});
app.get('/jiopaymankbankauto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'jiopaymankbankauto.html'));
});
app.get('/Aadhar-no-to-pdf', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Aadhar-no-to-pdf.html'));
});
app.get('/E_Shram_card-download', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'E_Shram_card-download.html'));
});
app.get('/aadhar_no_to_photo_details', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aadhar_no_to_photo_details.html'));
});

// Lost Aadhaar form route
app.post('/submit-form', checkAuth, async (req, res) => {
  const { enrollment_id, date, time, aadharHolderName } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 525;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance -= requiredBalance;
    await user.save();

    const lostAadhar = new LostAadhar({
      userId: user._id,
      enrollment_id: enrollment_id,
      date: date,
      time: time,
      aadharHolderName: aadharHolderName,
    });

    await lostAadhar.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Lost Aadhar form submission fee',
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ message: 'Record saved successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Error submitting form' });
  }
});

// Route to fetch Lost Aadhar records
app.get('/lostaadhars', checkAuth, async (req, res) => {
  try {
    const records = await LostAadhar.find({ userId: req.session.userId }).sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Error fetching records' });
  }
});
// Route to fetch wallet balance
app.get('/api/wallet-balance', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ walletBalance: user.walletBalance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Error fetching wallet balance' });
  }
});

app.get('/submit-shop', checkAuth, async (req, res) => {
  try {
    // Fetch the shop details for the logged-in user
    const shops = await Shop.find({ userId: req.session.userId }).sort({ date: -1 });
    
    // Send the fetched data as a JSON response
    res.status(200).json(shops);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Error fetching records' });
  }
});


app.post('/submit-shop-details', checkAuth, async (req, res) => {
  const { fullname, shopName, aadharNumber, panNumber, address, pinCode, mobileNumber, email } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 400;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    user.walletBalance -= requiredBalance;
    await user.save();

    const newShop = new Shop({
      userId: user._id,
      fullname: fullname,
      shopName: shopName,
      aadharNumber: aadharNumber,
      panNumber: panNumber,
      address: address,
      pinCode: pinCode,
      mobileNumber: mobileNumber,
      email: email
    });
    await newShop.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'UTI PSA create retailer ID',
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ 
      message: 'UTI PSA ID created successfully. Please wait 7 days for email confirmation.',
      shopDetails: newShop // Return the shop details
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
});

app.post('/userpayment', checkAuth, async (req, res) => {
  const { name, number1, numberutrno, email, amount } = req.body;

  // Validate inputs
  if (!numberutrno || numberutrno.length !== 12) {
    return res.status(400).send('Invalid UTR number');
  }

  const amountToAdd = parseFloat(amount);
  if (isNaN(amountToAdd) || amountToAdd <= 0) {
    return res.status(400).send('Invalid amount');
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check for existing UTR number
    const existingPayment = await PaymentAadhar.findOne({ utrNumber: numberutrno });
    if (existingPayment) {
      return res.status(400).send('UTR number is already linked');
    }

    // Update wallet balance
    user.walletBalance += amountToAdd;
    await user.save();

    // Create a new PaymentAadhar document
    const paymentAadhar = new PaymentAadhar({
      userId: user._id,
      name: name,
      number1: number1,
      utrNumber: numberutrno,
      email: email,
      amount: amountToAdd
    });

    await paymentAadhar.save();

    // Log the transaction
    const transaction = new Transaction({
      userId: user._id,
      amount: amountToAdd,
      type: 'credit',
      description: 'Wallet recharge',
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ message: 'Wallet recharged successfully' });
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Error submitting payment' });
  }
});


app.post('/submit-lost-pan', checkAuth, async (req, res) => {
  // console.log('Request body:', req.body); // Debugging line

  const { aadhaarNumber } = req.body;

  if (!aadhaarNumber || aadhaarNumber.length !== 12) {
    return res.status(400).json({ message: 'Invalid Aadhaar number' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 50;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check if Aadhaar number already exists in the LostPAN collection
    const existingRecord = await LostPAN.findOne({ aadhaarNumber });
    if (existingRecord) {
      return res.status(400).json({ message: 'Aadhaar number is already linked' });
    }

    user.walletBalance -= requiredBalance;
    await user.save();

    // Assuming you have a LostPAN model to save the record
    const lostPan = new LostPAN({
      userId: user._id,
      aadhaarNumber,
      applyDate: new Date(),
      status: 'Submitted'
    });

    await lostPan.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Lost PAN Number submission fee',
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ message: 'Record saved successfully', success: true });
  } catch (error) {
    console.error('Error saving record:', error);
    res.status(500).json({ message: 'Error saving record' });
  }
});


app.post('/ayushmancarddata', async (req, res) => {
  try {
    const { status, selectproof, parameter } = req.body;

    // Retrieve the user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 30;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct ₹30 from the user's wallet balance
    user.walletBalance -= requiredBalance;
    await user.save();

    // Create a new AyushmanCard document
    const newCard = new AyushmanCard({
      status,
      selectproof,
      parameter,
      createdAt: new Date()
    });

    // Save the AyushmanCard document
    await newCard.save();

    // Optionally, log the transaction (if you have a Transaction model)
    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Ayushman Card retailer ID create',
      date: new Date()
    });

    await transaction.save();

    res.status(200).send('AyushmanCard data saved successfully and ₹30 deducted from balance');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Handle GET request to fetch data
app.get('/ayushmancarddata', async (req, res) => {
  try {
      const results = await AyushmanCard.find(); // Fetch all documents
      res.json(results);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.post('/AadharFingerprint', async (req, res) => {
  try {
    const { fullname, mobileNumber, emailId, stateName, shopName } = req.body;

    // Retrieve the user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 700;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct ₹30 from the user's wallet balance
    user.walletBalance -= requiredBalance;
    await user.save();

    // Create a new AyushmanCard document
    const newCard = new Fingerprint({
      fullname,
      mobileNumber,
      emailId,
      stateName,
      shopName,
      createdAt: new Date()
    });

    // Save the AyushmanCard document
    await newCard.save();

    // Optionally, log the transaction (if you have a Transaction model)
    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Aadhar fingerprint retailer ID create ',
      date: new Date()
    });

    await transaction.save();

    res.status(200).send('Aadhar fingerprint 24 se 72 ghante please wait activate verify account retailer ID aur Password please check email  ');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Serve static files from /uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set storage engine for Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

// Function to check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images and PDFs Only!');
    }
}

// Route to handle file uploads and form data
app.post('/pan-altruist', upload.fields([
    { name: 'panCardUpload', maxCount: 1 },
    { name: 'aadharCardUpload', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Files:', req.files); // Debugging statement to check the contents of req.files
        console.log('Body:', req.body); // Debugging statement to check the contents of req.body

        const panCardUpload = req.files['panCardUpload'] ? req.files['panCardUpload'][0].filename : null;
        const aadharCardUpload = req.files['aadharCardUpload'] ? req.files['aadharCardUpload'][0].filename : null;

        const { shopName, name, email, mobileNumber, panCardNo, aadharCardNo, pan_option } = req.body;

        // Create a new Altruist document
        const panaltruist = new Altruist({
            shopName,
            name,
            email,
            mobileNumber,
            panCardNo,
            aadharCardNo,
            panCardUpload,
            aadharCardUpload,
            pan_option,
        });

        // Save the new document to the database
        await panaltruist.save();

        // Return success response
        res.json({ message: 'New PAN Card PAN Altruist retailer ID created successfully. Please wait 2 days for email confirmation' });
    } catch (error) {
        // Log the error and return a 500 status with a generic message
        console.error('Error submitting PAN Card application:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/pan-altruist', async (req, res) => {
  try {
      const results = await Altruist.find(); // Fetch all documents
      res.json(results);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/AadharFingerprint', async (req, res) => {
  try {
      const results = await Fingerprint.find(); // Fetch all documents
      res.json(results);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to handle the Jio Payment Bank passbook request
app.post('/jiopaymanban', checkAuth, async (req, res) => {
  const { accountNo, ifscCode, name, fatherName, date_of_birth, address, mobileNumber, emailId, branch, branchAddress, accountOpenDate } = req.body;

  try {
      const user = await User.findById(req.session.userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const requiredBalance = 300;
      if (user.walletBalance < requiredBalance) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      // Deduct the balance from the user's wallet
      user.walletBalance -= requiredBalance;
      await user.save();

      // Generate a unique 14-digit number
      const uniqueNumber = generateUniqueNumber();

      // Create a new entry for Jio Payment Bank
      const jiopaymankbankEntry = new Jiopaymankbank({
          userId: user._id,
          accountNo,
          ifscCode,
          name,
          fatherName,
          date_of_birth,
          address,
          mobileNumber,
          emailId,
          branch,
          branchAddress,
          accountOpenDate,
          uniqueNumber
      });

      await jiopaymankbankEntry.save();

      // Log the transaction
      const transaction = new Transaction({
          userId: user._id,
          amount: requiredBalance,
          type: 'debit',
          description: 'Jio Payment Bank copy passbook order',
          date: new Date(),
          uniqueNumber
      });

      await transaction.save();

      // Redirect or respond with success
      res.redirect('jio_payment_bank_passbook_order.html');
      // or res.json({ message: 'Order placed successfully', uniqueNumber });

  } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).json({ message: 'Error saving data', error: error.message });
  }
});

// Function to generate a 14-digit unique number
function generateUniqueNumber() {
    const max = 99999999999999; // Max value for 14 digits
    const min = 10000000000000; // Min value for 14 digits to ensure it's always 14 digits
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Define the route to fetch account details
// Server-side route example in Express.js

app.get('/api/account-details', async (req, res) => {
  try {
      // Assuming you have a middleware that sets req.user after verifying JWT
      const userEmail = req.user.email; // Logged-in user's email

      // Fetch data from MongoDB for the logged-in user
      const accountDetails = await AccountModel.find({ emailId: userEmail });

      if (accountDetails.length > 0) {
          res.json(accountDetails);
      } else {
          res.status(404).json({ message: 'No account details found for this user.' });
      }
  } catch (error) {
      console.error('Error fetching account details:', error);
      res.status(500).json({ message: 'Error fetching account details.' });
  }
});



app.post('/addpoint', async (req, res) => {
  try {
    const { point, rupess, mobile_number, email } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({ message: 'User not logged in or session expired' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 400;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance -= requiredBalance;
    await user.save();

    const newCard = new Aadharporinadd({
      point,
      rupess,
      mobile_number,
      email,
      createdAt: new Date(),
    });

    await newCard.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Aadharporinadd',
      date: new Date(),
    });

    await transaction.save();

    res.status(200).send('Aadhar fingerprint 12 ghante please wait activate verify account money aad');
  } catch (error) {
    console.error('Error saving data:', error); // Log the specific error
    res.status(500).send('Internal Server Error');
  }
});

app.post('/tecexam', async (req, res) => {
  const { name, mobile_number, email, address } = req.body;

  try {
    const newTecExam = new Tecexam({ name, mobile_number, email, address });
    await newTecExam.save();
    res.send('Data successful  tec exam 24 Ghanta ke andar call back aaega');
  } catch (err) {
    console.error('Error saving data to MongoDB:', err); // Log the error
    res.status(500).send(`An error occurred while saving data: ${err.message}`); // Send the error message
  }
});

// Middleware for session management
app.use(session({
  secret: 'your-secret-key', // Replace with your own secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Route to handle PAN Card application submission (new)
app.post('/submit-newpan-application', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]), async (req, res) => {
  try {
      console.log('Files:', req.files); // Debugging statement to check the contents of req.files
      console.log('Body:', req.body); // Debugging statement to check the contents of req.body

      const file = req.files['file'] ? req.files['file'][0].filename : null;
      const signature = req.files['signature'] ? req.files['signature'][0].filename : null;
      const documents = req.files['documents'] ? req.files['documents'][0].filename : null;

      // Extract other form fields from req.body
      const {
          category, date, city, area_code, aotype, range_code, ao_no,
          title, last_name, first_name, middle_name, name_on_card,
          gender, dob, single_parent, mother_last_name, mother_first_name,
          mother_middle_name, father_last_name, father_first_name,
          father_middle_name, name_on_card_parent, address_type, flat,
          building, street, locality, town, state, pincode, country,
          isd_code, mobile, email, aadhaar, income_source, identity_proof,
          address_proof, dob_proof, declaration, verifier_name,
          verification_place, verification_date, pan_option
      } = req.body;

      const user = await User.findById(req.session.userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const requiredBalance = 110;
      if (user.walletBalance < requiredBalance) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      // Generate a 14-digit unique number
      const uniqueNumber = crypto.randomBytes(7).toString('hex');

      const pana49form = new Pana49form({
          category, date, city, area_code, aotype, range_code, ao_no,
          title, last_name, first_name, middle_name, name_on_card,
          gender, dob, single_parent, mother_last_name, mother_first_name,
          mother_middle_name, father_last_name, father_first_name,
          father_middle_name, name_on_card_parent, address_type, flat,
          building, street, locality, town, state, pincode, country,
          isd_code, mobile, email, aadhaar, income_source, identity_proof,
          address_proof, dob_proof, declaration, filePath: file, 
          signaturePath: signature, documentsPath: documents,
          verifier_name, verification_place, verification_date,
          pan_option, uniqueNumber
      });

      await pana49form.save();

      user.walletBalance -= requiredBalance;
      await user.save();

      const transaction = new Transaction({
          userId: req.session.userId,
          amount: requiredBalance,
          type: 'debit',
          description: 'New PAN Card Application Fee',
          date: new Date(),
      });

      await transaction.save();

      // res.json({ message: 'New PAN Card application submitted successfully!' });
      res.redirect('applicaacknow.html')
  } catch (error) {
      console.error('Error submitting PAN Card application:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Setting up the static directory for serving uploaded files
app.use('/uploads', express.static('uploads'));

// Route for submitting PAN Card Correction Application
app.post('/submit-correctpan-application', upload.fields([
  { name: 'Pan_Caed_Copy', maxCount: 10 }, // Allow up to 10 files for Pan_Caed_Copy
  { name: 'file', maxCount: 10 }, // Allow up to 10 files for file
  { name: 'signature', maxCount: 10 }, // Allow up to 10 files for signature
  { name: 'documents', maxCount: 10 } // Allow up to 10 files for documents
]), async (req, res) => {
  try {
      console.log('Files:', req.files);
      console.log('Body:', req.body);

      // Extract file paths for each file type as an array
      const Pan_Caed_CopyPaths = req.files['Pan_Caed_Copy'] ? req.files['Pan_Caed_Copy'].map(file => file.filename) : [];
      const filePaths = req.files['file'] ? req.files['file'].map(file => file.filename) : [];
      const signaturePaths = req.files['signature'] ? req.files['signature'].map(file => file.filename) : [];
      const documentsPaths = req.files['documents'] ? req.files['documents'].map(file => file.filename) : [];

      // Extract other form fields from req.body
      const {
          pannumber, category, date, city, area_code, aotype, range_code, ao_no,
          title, last_name, first_name, middle_name, name_on_card,
          gender, dob, single_parent, mother_last_name, mother_first_name,
          mother_middle_name, father_last_name, father_first_name,
          father_middle_name, name_on_card_parent, address_type, flat,
          building, street, locality, town, state, pincode, country,
          isd_code, mobile, email, aadhaar, income_source, pancard_proof, identity_proof,
          address_proof, dob_proof, declaration, verifier_name,
          verification_place, verification_date, pan_option
      } = req.body;

      const user = await User.findById(req.session.userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const requiredBalance = 110;
      if (user.walletBalance < requiredBalance) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      // Generate a 14-digit unique number
      const uniqueNumber = (Math.floor(Math.random() * 90000000000000) + 10000000000000).toString();

      // Create and save the CorrectionPan document
      const correctionPan = new CorrectionPan({
          pannumber, category, date, city, area_code, aotype, range_code, ao_no,
          title, last_name, first_name, middle_name, name_on_card,
          gender, dob, single_parent, mother_last_name, mother_first_name,
          mother_middle_name, father_last_name, father_first_name,
          father_middle_name, name_on_card_parent, address_type, flat,
          building, street, locality, town, state, pincode, country,
          isd_code, mobile, email, aadhaar, income_source, pancard_proof, identity_proof,
          address_proof, dob_proof, declaration, Pan_Caed_CopyPaths,
          filePaths, signaturePaths, documentsPaths,
          verifier_name, verification_place, verification_date,
          pan_option, uniqueNumber
      });

      await correctionPan.save();

      // Update user wallet balance
      user.walletBalance -= requiredBalance;
      await user.save();

      // Create and save a transaction record
      const transaction = new Transaction({
          userId: req.session.userId,
          amount: requiredBalance,
          type: 'debit',
          description: 'correctpan PAN Card Application Fee',
          date: new Date(),
      });

      await transaction.save();

      // res.json({ message: 'Correct PAN Card application submitted successfully!' });
      res.redirect('applicacknowpanc.html')
  } catch (error) {
      console.error('Error submitting PAN Card application:', error);
      res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
});



app.post('/submit-aadharuclappy', async (req, res) => {
  const { fullname, shopName, aadharNumber, panNumber, address, pinCode, mobileNumber, email } = req.body;
  
  // Check if all fields are provided
  if (!fullname || !shopName || !aadharNumber || !panNumber || !address || !pinCode || !mobileNumber || !email) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate mobile number length
  if (mobileNumber.length < 10 || mobileNumber.length > 15) {
      return res.status(400).json({ message: 'Mobile number must be between 10 and 15 digits' });
  }

  try {
      const newCard = new Aadharuclappy({
          fullname,
          shopName,
          aadharNumber,
          panNumber,
          address,
          pinCode,
          mobileNumber,
          email
      });

      await newCard.save();
      res.status(201).json({ message: 'Please submit the Aadhar application. You will receive a callback within 24 hours' });
  } catch (error) {
      res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
});

app.post('/kotat', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'bankPassbook', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'fingerprintDeviceBackPhoto', maxCount: 1 },
]), (req, res) => {
  const { fullName, shopName, mobileNumber, email, deviceSerialNo, bankName, accountNo, ifscCode } = req.body;
  const files = req.files;

  // Create a new document using the Kotak model
  const newKotakRecord = new Kotak({
      fullName,
      shopName,
      mobileNumber,
      email,
      deviceSerialNo,
      bankName,  // Save the bank name to MongoDB
      accountNo,
      ifscCode,
      photo: files['photo'][0].path,
      aadhar: files['aadhar'][0].path,
      bankPassbook: files['bankPassbook'][0].path,
      panCard: files['panCard'][0].path,
      fingerprintDeviceBackPhoto: files['fingerprintDeviceBackPhoto'][0].path,
  });

  // Save the document to the database
  newKotakRecord.save()
      .then(() => res.send('aapka form successful submit ho gaya hai aap kripya 24 ghante ka vate Karen 24 ghante ke andar aapko call back aaega company ke taraf se'))
      .catch(err => res.status(400).send('Error saving record: ' + err.message));
});

// Handle POST request to submit Aadhar number
app.post('/aadhar_number', async (req, res) => {
  try {
    const { aadhar_number } = req.body;

    // Retrieve the user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance =300;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct ₹300 from the user's wallet balance
    user.walletBalance -= requiredBalance;
    await user.save();

    // Create a new AadharNumber document
    const aadharEntry = new Aadhar_Number({
      aadhar_number,
      createdAt: new Date()
    });

    // Save the AadharNumber document
    await aadharEntry.save();

    // Log the transaction
    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Aadhar number to PDF',
      date: new Date()
    });

    await transaction.save();

    res.status(200).send('Aadhar to PDF data 24 ghante ke andar aapke SEND EMAIL ID successfully per pahunch jaega ');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Internal Server Error');
  }
});

const eShramCardSchema = new mongoose.Schema({
  aadhar_number: { type: String, required: true },
  email: { type: String, required: true }, // Make sure email is required
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const E_Shram_Card = mongoose.model('E_Shram_Card', eShramCardSchema);

// In your route
app.post('/E_Shram_card', async (req, res) => {
  try {
    const { aadhar_number } = req.body;

    // Retrieve the user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 50;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct ₹50 from the user's wallet balance
    user.walletBalance -= requiredBalance;
    await user.save();

    // Create a new E-Shram card document
    const eshramEntry = new E_Shram_Card({
      aadhar_number,
      email: user.email, // Include email from the user object
      createdAt: new Date(),
      status: 'pending'
    });

    // Save the E-Shram card document
    await eshramEntry.save();

    // Log the transaction
    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'E-Shram card submission',
      date: new Date()
    });

    await transaction.save();

    res.status(200).send('E-Shram card application successfully submitted. You will receive the PDF within 24 hours.');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Internal Server Error');
  }
});


// GET route to fetch E-Shram Card submissions for the logged-in user
app.get('/E_Shram_card_data', async (req, res) => {
  try {
    // Retrieve the logged-in user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch only the E-Shram cards related to the logged-in user's email
    const eshramCards = await E_Shram_Card.find({ email: user.email });

    res.status(200).json(eshramCards);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// const aadhartodetalisSchema = new mongoose.Schema({
//   aadhar_number: { type: String, required: true },
//   email: { type: String, required: true }, // Make sure email is required
//   status: { type: String, default: 'pending' },
//   createdAt: { type: Date, default: Date.now }
// });

// const aadhartodetalis = mongoose.model('aadhartodetalis', aadhartodetalisSchema);

// In your route
app.post('/aadartodetails', async (req, res) => {
  try {
    const { aadhar_number } = req.body;

    // Retrieve the user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 150;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct ₹150 from the user's wallet balance
    user.walletBalance -= requiredBalance;
    await user.save();

    // Create a new Aadhar to Details document
    const aadharToDetailsEntry = new AadharToDetails({
      aadhar_number,
      email: user.email, // Include email from the user object
      createdAt: new Date(),
      status: 'pending'
    });

    // Save the Aadhar to Details document
    await aadharToDetailsEntry.save();

    // Log the transaction
    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Aadhar to details submission',
      date: new Date()
    });

    await transaction.save();

    res.status(200).send('Aadhar to details application successfully submitted. You will receive the photo and details within 24 hours.');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/aadar_to_details', async (req, res) => {
  try {
    // Retrieve the logged-in user from session
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch only the Aadhar to Details related to the logged-in user's email
    const aadharToDetailsEntries = await AadharToDetails.find({ email: user.email });

    res.status(200).json(aadharToDetailsEntries);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/api/pan-applications', async (req, res) => {
  try {
      const panApplications = await CorrectionPan.find();
      res.json(panApplications);
  } catch (err) {
      console.error('Error fetching PAN applications:', err);
      res.status(500).json({ message: 'Server Error' });
  }
});

// API to get records
app.get('/records', checkAuth, async (req, res) => {
  try {
    const records = await Record.find({ userId: req.session.userId });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Error fetching records' });
  }
});

app.get('/LostPAN', checkAuth, async (req, res) => {
  try {
    const records = await LostPAN.find({ userId: req.session.userId });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Error fetching records' });
  }
});

app.get('/api/transactions', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Fetch transactions and populate the user's email based on the userId reference
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .populate('userId', 'email'); // This populates the email field of the user

    // Map the transactions to include the user's email and other necessary details
    const transactionsWithDetails = transactions.map((transaction) => ({
      _id: transaction._id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      userEmail: transaction.userId.email, // This will contain the email of the user
    }));

    res.json({ transactions: transactionsWithDetails });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});


app.post('/adminregister', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    console.log('Attempting to register user:', { firstName, lastName, email });

    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new AdminUser({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    await newUser.save();
    console.log('User successfully registered:', newUser);

    res.redirect('/success'); // Adjust as necessary
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/adminRegistration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adminRegistration.html'));
});

app.get('/displayData', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'displayData.html'));
});
app.get('/admincorrection_pancard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admincorrection_pancard.html'));
});

app.get('/applicaacknow', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'applicaacknow.html'));
});

app.get('/applicacknowpanc', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'applicacknowpanc.html'));
});

app.get('/UTIPSAtrackPANstatus', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'UTIPSAtrackPANstatus.html'));
});

app.get('/utipsaapplicationstatus', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'utipsaapplicationstatus.html'));
});

app.post('/admin_login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await AdminUser.findOne({ email });

    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    req.session.user = user;
    res.redirect('/displayData');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/data/:collectionName', async (req, res) => {
  const { collectionName } = req.params;
  try {
      const collection = mongoose.connection.db.collection(collectionName);
      const data = await collection.find().toArray();
      res.json(data);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Error fetching data' });
  }
});

app.get('/displayData', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/admin_login');
  }
  res.sendFile(path.join(__dirname, 'displayData.html'));
});

// Serve static files
app.use(express.static('public'));

// Fetch Data
app.get('/api/data/:collectionName', async (req, res) => {
  const { collectionName } = req.params;
  try {
      const collection = db.collection(collectionName);
      const data = await collection.find().toArray();
      res.json(data);
  } catch (error) {
      console.error(`Error fetching data from ${collectionName}:`, error);
      res.status(500).json({ error: `Error fetching data from ${collectionName}` });
  }
});



// Update Data
app.put('/api/data/update/:id', async (req, res) => {
  try {
      const collection = db.collection('rndigitalindia');
      const result = await collection.updateOne(
          { _id: new ObjectId(req.params.id) },  // Ensure the ID is converted to an ObjectId
          { $set: req.body }
      );
      res.json({ success: result.modifiedCount > 0 });
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Data
// Ensure your route is correct
app.delete('/api/data/delete/:id', async (req, res) => {
  try {
      const { id } = req.params;

      const result = await User.findByIdAndDelete(id);
      
      if (result) {
          res.status(200).json({ success: true });
      } else {
          res.status(404).json({ success: false, message: 'User not found' });
      }
  } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
