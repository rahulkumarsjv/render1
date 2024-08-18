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
const Pana49form = require('./models/Pana49form');
const CorrectionPan = require('./models/correctionpan');
const Shop = require('./models/utipsa');
const crypto = require('crypto');
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());
const port = process.env.PORT || 10000;

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

// // File upload setup
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/'); // Folder where files will be stored
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname)); // File name with timestamp
//   }
// });

// const upload = multer({ storage: storage });
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



// // Mobile to Aadhaar form route
// app.post('/mobiletoaadhar', checkAuth, async (req, res) => {
//   const { name, number } = req.body;

//   if (!number || number.length !== 10) {
//     return res.status(400).json({ message: 'Invalid mobile number' });
//   }

//   try {
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       console.error('User not found');
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const requiredBalance = 200;
//     if (user.walletBalance < requiredBalance) {
//       console.error('Insufficient wallet balance');
//       return res.status(400).json({ message: 'Insufficient wallet balance' });
//     }

//     user.walletBalance -= requiredBalance;
//     await user.save();

//     const mobileToAadhar = new MobileToLostAadhar({
//       userId: user._id,
//       name: name,
//       mobileNumber: number,
//       status: 'Pending'
//     });

//     await mobileToAadhar.save();

//     const transaction = new Transaction({
//       userId: user._id,
//       amount: requiredBalance,
//       type: 'debit',
//       description: 'Mobile to Aadhar form submission fee',
//       date: new Date()
//     });

//     await transaction.save();

//     res.status(201).json({ message: 'Record saved successfully' });
//   } catch (error) {
//     console.error('Error submitting form:', error);
//     res.status(500).json({ message: 'Error submitting form' });
//   }
// });

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

// // Define the User model
// const User = mongoose.model('User', new mongoose.Schema({
//   email: String,
//   walletBalance: Number,
// }));

// Define the Pana49form model
// const Pana49form = mongoose.model('Pana49form', new mongoose.Schema({
//   // Add all necessary fields here
//   filePath: String,
//   signaturePath: String,
//   documentsPath: String,
//   uniqueNumber: String,
// }));

// // Define the CorrectionPan model
// const CorrectionPan = mongoose.model('CorrectionPan', new mongoose.Schema({
//   // Add all necessary fields here
//   pancard_proof: String,
//   image: String,
//   signature: String,
//   documents: String,
//   uniqueNumber: String,
// }));

// // Define the Transaction model
// const Transaction = mongoose.model('Transaction', new mongoose.Schema({
//   userId: mongoose.Schema.Types.ObjectId,
//   amount: Number,
//   type: String,
//   description: String,
//   date: Date,
// }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
      const savedFilename = Date.now() + path.extname(file.originalname);
      cb(null, savedFilename);
  }
});


const upload = multer({ storage: storage });
app.use(express.static('public'));
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

      res.json({ message: 'New PAN Card application submitted successfully!' });
  } catch (error) {
      console.error('Error submitting PAN Card application:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.use('/uploads', express.static('uploads'));

app.post('/submit-correctpan-application', upload.fields([
  { name: 'Pan_Caed_Copy', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]), async (req, res) => {
  try {
      console.log('Files:', req.files);
      console.log('Body:', req.body);

      // Extract file paths
      const Pan_Caed_CopyPath = req.files['Pan_Caed_Copy'] ? req.files['Pan_Caed_Copy'][0].filename : null;
      const filePath = req.files['file'] ? req.files['file'][0].filename : null;
      const signaturePath = req.files['signature'] ? req.files['signature'][0].filename : null;
      const documentsPath = req.files['documents'] ? req.files['documents'][0].filename : null;

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

      // Initialize the correctionPan instance
      const CoorrectionPan = new CorrectionPan({
          pannumber, category, date, city, area_code, aotype, range_code, ao_no,
          title, last_name, first_name, middle_name, name_on_card,
          gender, dob, single_parent, mother_last_name, mother_first_name,
          mother_middle_name, father_last_name, father_first_name,
          father_middle_name, name_on_card_parent, address_type, flat,
          building, street, locality, town, state, pincode, country,
          isd_code, mobile, email, aadhaar, income_source, pancard_proof, identity_proof,
          address_proof, dob_proof, declaration, filePath, 
          signaturePath, documentsPath, Pan_Caed_CopyPath,
          verifier_name, verification_place, verification_date,
          pan_option, uniqueNumber
      });

      // Save the correctionPan document
      await CoorrectionPan.save();

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

      res.json({ message: 'correctpan PAN Card application submitted successfully!' });
  } catch (error) {
      console.error('Error submitting PAN Card application:', error);
      if (error.name === 'ValidationError') {
          res.status(400).json({ message: 'Validation Error', details: error.errors });
      } else if (error.name === 'MongoError') {
          res.status(500).json({ message: 'Database Error', details: error.message });
      } else {
          res.status(500).json({ message: 'Internal Server Error', details: error.message });
      }
  }
});


// Example in Express.js
app.get('/get-all-pan-applications', async (req, res) => {
  try {
      const applications = await Pana49form.find(); // Adjust query as needed
      res.json(applications); // Ensure this is an array
  } catch (error) {
      console.error('Error fetching PAN applications:', error);
      res.status(500).json({ error: 'Internal Server Error' });
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

app.get('/displayData', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/admin_login');
  }
  res.sendFile(path.join(__dirname, 'displayData.html'));
});


app.get('/api/data/users', async (req, res) => {
  try {
      const users = await mongoose.model('User').find();
      res.json(users);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/data/pana49forms', async (req, res) => {
  try {
    const data = await Pana49form.find(); // Fetch all records from the collection

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No records found' }); // Handle case where no data is found
    }

    res.json(data); // Send the retrieved data as a JSON response
  } catch (error) {
    console.error('Error fetching data:', error); // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch data' }); // Send an error response
  }
});

app.get('/fetch-admin-data', async (req, res) => {
  try {
      const adminUsers = await AdminUser.find();
      res.json(adminUsers);
  } catch (error) {
      console.error('Error fetching admin user data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.get('/api/data/correctionpans', async (req, res) => {
  try {
      const correctionPans = await CorrectionPan.find();
      res.json(correctionPans);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch correction PAN data' });
  }
});

app.get('/api/data/lostaadhars', async (req, res) => {
  try {
      const lostAadhars = await LostAadhar.find();
      res.json(lostAadhars);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lost Aadhar data' });
  }
});


// Route to fetch lost PANs
app.get('/api/data/lostpans', async (req, res) => {
  try {
      const lostPans = await LostPAN.find();
      if (!lostPans || lostPans.length === 0) {
          return res.status(404).json({ message: 'No records found' });
      }
      res.json(lostPans);
  } catch (error) {
      console.error('Error fetching lost PAN data:', error);
      res.status(500).json({ error: 'Failed to fetch lost PAN data' });
  }
});

// Define the route to fetch data for 'paymentaadhars'
app.get('/api/data/paymentaadhars', async (req, res) => {
  try {
    const data = await PaymentAadhar.find(); // Fetch all records from the collection

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No records found' }); // Handle case where no data is found
    }

    res.json(data); // Send the retrieved data as a JSON response
  } catch (error) {
    console.error('Error fetching data:', error); // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch data' }); // Send an error response
  }
});

app.get('/api/data/shop', async (req, res) => {
  try {
    const data = await Shop.find(); // Fetch all records from the collection

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No records found' }); // Handle case where no data is found
    }

    res.json(data); // Send the retrieved data as a JSON response
  } catch (error) {
    console.error('Error fetching data:', error.message); // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch data', details: error.message }); // Send an error response
  }
});

app.get('/api/data/transactions', async (req, res) => {
  try {
    const data = await Transaction.find(); // Fetch all records from the 'transactions' collection

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No records found' }); // Handle case where no data is found
    }

    res.json(data); // Send the retrieved data as a JSON response
  } catch (error) {
    console.error('Error fetching data:', error); // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch data', details: error.message }); // Send an error response
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
