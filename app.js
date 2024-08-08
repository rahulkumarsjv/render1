const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
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
const MobileToLostAadhar = require('./models/mobiletolostshowaadhar');
const Pana49form = require('./models/Pana49form');
const CorrectionPan = require('./models/correctionpan');
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

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Folder where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // File name with timestamp
  }
});

const upload = multer({ storage: storage });
// const upload = multer({ dest: 'uploads/' });

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

// In-memory store for OTPs (replace with a database in production)
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
        from: 'pancard4886@gmail.com',
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
    from: 'pancard4886@gmail.com',
    to: 'pancard4886@gmail.com',
    subject: 'New Contact Form Submission',
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
// Login route
// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (user && await bcrypt.compare(password, user.password)) {
//       req.session.userId = user._id;
//       res.redirect('/profile.html');
//     } else {
//       res.status(401).send('Invalid email or password');
//     }
//   } catch (error) {
//     console.error('Error logging in:', error);
//     res.status(500).send('Error logging in');
//   }
// });

// // Route to handle password reset
// app.post('/reset-password', async (req, res) => {
//   const { newPassword } = req.body;
//   const email = req.session.email; // Retrieve the email stored in session after OTP verification

//   if (!newPassword || !email) {
//     return res.status(400).json({ message: 'New password and email are required' });
//   }

//   try {
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await User.findOneAndUpdate({ email }, { password: hashedPassword });

//     res.json({ message: 'Password updated successfully' });
//   } catch (error) {
//     console.error('Error updating password:', error);
//     res.status(500).json({ message: 'Error updating password' });
//   }
// });

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

// Mobile to Aadhaar form route
app.post('/mobiletoaadhar', checkAuth, async (req, res) => {
  const { name, number } = req.body;

  if (!number || number.length !== 10) {
    return res.status(400).json({ message: 'Invalid mobile number' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 200;
    if (user.walletBalance < requiredBalance) {
      console.error('Insufficient wallet balance');
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance -= requiredBalance;
    await user.save();

    const mobileToAadhar = new MobileToLostAadhar({
      userId: user._id,
      name: name,
      mobileNumber: number,
      status: 'Pending'
    });

    await mobileToAadhar.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'Mobile to Aadhar form submission fee',
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ message: 'Record saved successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Error submitting form' });
  }
});

// Route to get MobileToLostAadhar records
app.get('/getMobileToAadharRecords', async (req, res) => {
  try {
    const records = await MobileToLostAadhar.find({});
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Error fetching records' });
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

    const requiredBalance = 100;
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

// PAN Card Application route
// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });

app.post('/submit-newpan-application', checkAuth, upload.fields([
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
      category,
      date,
      city,
      area_code,
      aotype,
      range_code,
      ao_no,
      title,
      last_name,
      first_name,
      middle_name,
      name_on_card,
      gender,
      dob,
      single_parent,
      mother_last_name,
      mother_first_name,
      mother_middle_name,
      father_last_name,
      father_first_name,
      father_middle_name,
      name_on_card_parent,
      address_type,
      flat,
      building,
      street,
      locality,
      town,
      state,
      pincode,
      country,
      isd_code,
      mobile,
      email,
      aadhaar,
      income_source,
      identity_proof,
      address_proof,
      dob_proof,
      declaration,
      verifier_name,
      verification_place,
      verification_date,
      pan_option
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
      category,
      date,
      city,
      area_code,
      aotype,
      range_code,
      ao_no,
      title,
      last_name,
      first_name,
      middle_name,
      name_on_card,
      gender,
      dob,
      single_parent,
      mother_last_name,
      mother_first_name,
      mother_middle_name,
      father_last_name,
      father_first_name,
      father_middle_name,
      name_on_card_parent,
      address_type,
      flat,
      building,
      street,
      locality,
      town,
      state,
      pincode,
      country,
      isd_code,
      mobile,
      email,
      aadhaar,
      income_source,
      identity_proof,
      address_proof,
      dob_proof,
      declaration,
      filePath: file,  // Save the file path
      signaturePath: signature,  // Save the signature path
      documentsPath: documents,  // Save the documents path
      verifier_name,
      verification_place,
      verification_date,
      pan_option,
      uniqueNumber // Save the unique number
    });

    await pana49form.save();

    user.walletBalance -= requiredBalance;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'New PAN Card application submission fee',
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ message: 'PAN application submitted successfully', uniqueNumber });
  } catch (error) {
    console.error('Error submitting PAN application:', error);
    res.status(500).json({ message: 'Error submitting PAN application' });
  }
});

// Route to fetch PAN application by unique number
app.get('/get-all-pan-applications', async (req, res) => {
  try {
    const pana49forms = await Pana49form.find();
    res.status(200).json(pana49forms);
  } catch (error) {
    console.error('Error fetching PAN applications:', error);
    res.status(500).json({ message: 'Error fetching PAN applications' });
  }
});


app.post('/submit-correctionpan-appy-application', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]), async (req, res) => {
  try {
    const getArray = (field) => Array.isArray(field) ? field : field ? field.split(',') : [];

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requiredBalance = 110;
    if (user.walletBalance < requiredBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance -= requiredBalance;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: requiredBalance,
      type: 'debit',
      description: 'correctionpan New PAN Card application submission fee',
      date: new Date()
    });
    await transaction.save();

    const application = new CorrectionPan({
      pannumber: req.body.pannumber,
      category: req.body.category,
      date: req.body.date,
      city: req.body.city,
      area_code: req.body.area_code,
      aotype: req.body.aotype,
      range_code: req.body.range_code,
      ao_no: req.body.ao_no,
      title: req.body.title,
      last_name: req.body.last_name,
      first_name: req.body.first_name,
      middle_name: req.body.middle_name,
      name_on_card: req.body.name_on_card,
      gender: req.body.gender,
      dob: req.body.dob,
      single_parent: req.body.single_parent,
      mother_last_name: req.body.mother_last_name,
      mother_first_name: req.body.mother_first_name,
      mother_middle_name: req.body.mother_middle_name,
      father_last_name: req.body.father_last_name,
      father_first_name: req.body.father_first_name,
      father_middle_name: req.body.father_middle_name,
      name_on_card_parent: req.body.name_on_card_parent,
      address_type: req.body.address_type,
      flat: req.body.flat,
      building: req.body.building,
      street: req.body.street,
      locality: req.body.locality,
      town: req.body.town,
      state: req.body.state,
      pincode: req.body.pincode,
      country: req.body.country,
      isd_code: req.body.isd_code,
      mobile: req.body.mobile,
      email: req.body.email,
      aadhaar: req.body.aadhaar,
      income_source: req.body.income_source,
      identity_proof: getArray(req.body.identity_proof),
      address_proof: getArray(req.body.address_proof),
      dob_proof: getArray(req.body.dob_proof),
      declaration: req.body.declaration,
      verifier_name: req.body.verifier_name,
      verification_place: req.body.verification_place,
      verification_date: req.body.verification_date,
      image: req.files['image'] ? req.files['image'][0].path : undefined,
      file: req.files['file'] ? req.files['file'][0].path : undefined,
      signature: req.files['signature'] ? req.files['signature'][0].path : undefined,
      documents: req.files['documents'] ? req.files['documents'][0].path : undefined,
      pan_option: req.body.pan_option
    });

    await application.save();
    res.status(200).send('Form submitted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error submitting form.');
  }
});

//get-corrected-pan-status
app.get('/get-all-pan-applications', async (req, res) => {
  try {
    const pana49forms = await Pana49form.find();
    res.status(200).json(pana49forms);
  } catch (error) {
    console.error('Error fetching PAN applications:', error);
    res.status(500).json({ message: 'Error fetching PAN applications' });
  }
});


// API to get lost Aadhaar records
app.get('/get-corrected-pan-applications', async (req, res) => {
  try {
    const correctedpan = await CorrectionPan.find();
    res.status(200).json(correctedpan);
    // console.log(correctedpan);

  } catch (error) {
    console.error('Error fetching Correction PAN records:', error);
    res.status(500).json({ message: 'Error fetching records' });
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



// app.get('/api/transactions', checkAuth, async (req, res) => {
//   try {
//     const transactions = await Transaction.find({ userId: req.session.userId }).sort({ date: -1 });

//     const formattedTransactions = transactions.map(transaction => ({
//       date: transaction.date.toISOString().split('T')[0], // Format the date
//       credit: transaction.type === 'addition' ? transaction.amount : 0,
//       debit: transaction.type === 'deduction' ? transaction.amount : 0,
//       description: transaction.description
//     }));

//     res.json(formattedTransactions);
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

app.get('/api/transactions', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 });
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Middleware to check if user is logged in
// const isAuthenticated = (req, res, next) => {
//   if (req.session.userId) {
//       next();
//   } else {
//       res.redirect('/admin_login.html');
//   }
// };

// Registration route
app.post('/adminregister', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new AdminUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Error registering admin' });
  }
});


// Login route
app.post('/admin_login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await AdminUser.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      res.redirect('/displayData.html');
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});
// Route to serve the HTML file
app.get('/displayData', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'displayData.html'));
});

// Route to fetch data from collections
app.get('/data/:collection', async (req, res) => {
  const collectionName = req.params.collection;

  try {
    if (collectionName === 'adminusers') {
      return res.status(403).json({ message: 'Access to adminusers is forbidden' });
    }

    const collection = mongoose.connection.collection(collectionName);
    const data = await collection.find({}).toArray();

    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// Logout route
app.get('/admin_logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/admin_login.html');
  });
});

// Routes to serve pages
app.get('/admin_login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin_login.html'));
});

app.get('/adminRegistration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adminRegistration.html'));
});

// Example model for generic data collection
const GenericModel = mongoose.model('Generic', new mongoose.Schema({}, { strict: false }));

// Fetch data
app.get('/data/:collection', async (req, res) => {
    const { collection } = req.params;
    const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }));

    try {
        const data = await Model.find();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
});

// Delete data
app.delete('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }));

    try {
        await Model.findByIdAndDelete(id);
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ message: 'Error deleting data' });
    }
});

// Update data
app.put('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    const newValue = req.body.value; // Adjust this for specific fields
    const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }));

    try {
        await Model.findByIdAndUpdate(id, { value: newValue }); // Adjust this for specific fields
        res.json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Error updating data' });
    }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
