// Yuvantara Cloud Backend API Server
// Production server for https://yuvantaraventure.in
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (e) {}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Razorpay SDK Setup
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('💳 Razorpay SDK initialized successfully.');
  } catch (err) {
    console.warn('Razorpay package not installed or configuration error:', err.message);
  }
}

// Nodemailer SMTP Setup for Email OTP
let mailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    const nodemailer = require('nodemailer');
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('📧 SMTP Email Transporter configured.');
  } catch (err) {
    console.warn('Nodemailer setup warning:', err.message);
  }
}

// In-Memory & File-backed Store for Cloud Data
const DATA_FILE = path.join(__dirname, 'cloud_db.json');
let cloudData = {
  users: [],
  applications: [],
  payments: [],
  otps: {}
};

// Load existing data
try {
  if (fs.existsSync(DATA_FILE)) {
    cloudData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read existing data file, initializing fresh.');
}

function persistData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cloudData, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing to data file:', e);
  }
}

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Yuvantara Enterprise Cloud Backend',
    domain: 'https://yuvantaraventure.in',
    razorpayConfigured: !!razorpay,
    emailConfigured: !!mailTransporter,
    timestamp: new Date().toISOString()
  });
});

// ── 1. Razorpay Order Creation ──
app.post('/api/payment/create-order', async (req, res) => {
  const { amount = 23600, currency = 'INR', receipt, studentEmail } = req.body;

  if (!razorpay) {
    // Return simulated order ID if test keys not yet provided
    const mockOrderId = 'order_' + crypto.randomBytes(8).toString('hex');
    return res.json({
      success: true,
      orderId: mockOrderId,
      amount: amount,
      currency: currency,
      simulated: true
    });
  }

  try {
    const options = {
      amount: parseInt(amount, 10), // in paise (e.g. 23600 for ₹236)
      currency: currency,
      receipt: receipt || 'rcpt_' + Date.now().toString().slice(-6),
      notes: { studentEmail: studentEmail || '' }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── 2. Razorpay Signature Verification ──
app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    // If running in development test mode
    return res.json({ success: true, verified: true, paymentId: razorpay_payment_id });
  }

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = (expectedSignature === razorpay_signature);
    if (isAuthentic) {
      cloudData.payments.push({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        verifiedAt: new Date().toISOString()
      });
      persistData();
      return res.json({ success: true, verified: true, paymentId: razorpay_payment_id });
    } else {
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. Send Email OTP ──
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, name = 'Student Candidate', purpose = 'verification' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email is required.' });
  }

  // Generate 6-digit OTP
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

  cloudData.otps[email.toLowerCase()] = {
    code,
    expiresAt,
    purpose,
    attemptsRemaining: 5
  };
  persistData();

  const subject = purpose === 'forgot_password'
    ? 'Yuvantara — Password Reset OTP'
    : 'Yuvantara — Verify Your Email Address';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1D4ED8; margin: 0;">Yuvantara</h2>
        <p style="color: #64748B; font-size: 14px; margin: 4px 0 0;">Industrial Internship & Technology Council</p>
      </div>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">
        Your one-time 6-digit verification code is:
      </p>
      <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1D4ED8;">${code}</span>
      </div>
      <p style="color: #64748B; font-size: 13px;">
        This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
        Yuvantara Solutions · 4A Prantika Building, Kankarbagh, Patna, Bihar - 800006<br>
        Need help? Contact: xyv@yuvantara.com
      </p>
    </div>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Yuvantara'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: html
      });
      return res.json({ success: true, email: email, dispatched: true });
    } catch (mailErr) {
      console.warn('SMTP Send error:', mailErr.message);
      return res.status(500).json({ success: false, error: 'Failed to deliver OTP via SMTP. Please check mail server configuration.' });
    }
  }

  // If SMTP not yet configured in .env, log to backend server console for the server administrator (NEVER send code in JSON response!)
  console.info(`[SERVER CONSOLE ONLY - DEBUG OTP] Email: ${email} | Code: ${code} | (Configure SMTP_USER & SMTP_PASS in server/.env for live inbox delivery)`);
  res.json({ success: true, email: email, dispatched: false, message: 'OTP generated. Configure SMTP credentials in server/.env for live inbox delivery.' });
});

// ── 4. Verify Email OTP ──
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, code, purpose } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
  }

  const record = cloudData.otps[email.toLowerCase()];
  if (!record) {
    return res.status(400).json({ success: false, error: 'No OTP requested for this email or session expired.' });
  }

  if (Date.now() > record.expiresAt) {
    delete cloudData.otps[email.toLowerCase()];
    persistData();
    return res.status(400).json({ success: false, error: 'The OTP code has expired. Please request a new code.' });
  }

  if (record.code !== code.toString().trim()) {
    record.attemptsRemaining -= 1;
    if (record.attemptsRemaining <= 0) {
      delete cloudData.otps[email.toLowerCase()];
    }
    persistData();
    return res.status(400).json({
      success: false,
      error: `Incorrect code. ${Math.max(0, record.attemptsRemaining)} attempts remaining.`
    });
  }

  // Success
  delete cloudData.otps[email.toLowerCase()];
  persistData();
  res.json({ success: true, verified: true, email: email });
});

// ── 5. Cloud Data Endpoints (Users, Applications) ──
app.get('/api/users', (req, res) => {
  res.json(cloudData.users);
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  const existingIdx = cloudData.users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingIdx >= 0) {
    cloudData.users[existingIdx] = { ...cloudData.users[existingIdx], ...user };
  } else {
    cloudData.users.push(user);
  }
  persistData();
  res.json({ success: true, user });
});

app.get('/api/applications', (req, res) => {
  res.json(cloudData.applications);
});

app.post('/api/applications', (req, res) => {
  const appItem = req.body;
  cloudData.applications.unshift(appItem);
  persistData();
  res.json({ success: true, application: appItem });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Yuvantara Cloud Server running on port ${PORT}`);
  console.log(`🌐 Ready for https://yuvantaraventure.in`);
});
