// Yuvantara Production Configuration
// Official Domain: https://yuvantaraventure.in
(function(window) {
  'use strict';

  var CONFIG = {
    // ── Official Site Identity ──
    domain: 'https://yuvantaraventure.in',
    siteName: 'Yuvantara',
    tagline: 'Cybersecurity, IT Solutions & Industrial Internship Training',
    supportEmail: 'xyv@yuvantara.com',
    supportPhone: '+91 98765 43210',
    address: '4A Prantika Building, Kankarbagh, Patna, Bihar - 800006',
    gstin: '10AABCY1234F1Z5',

    // ── Payment Gateway (Razorpay) ──
    // Replace with your Razorpay Key ID from https://dashboard.razorpay.com/app/keys
    // Works with Test Key: 'rzp_test_...' or Live Key: 'rzp_live_...'
    razorpay: {
      enabled: true,
      keyId: 'rzp_test_51H0yourKeyHere', // Set your key here when ready
      amountInPaise: 23600, // ₹236.00 (₹200 Base Fee + 18% GST ₹36)
      currency: 'INR',
      name: 'Yuvantara Industrial Training',
      description: 'Documentation Processing & Enrollment Fee (₹200 + 18% GST)',
      themeColor: '#1D4ED8'
    },

    // ── Cloud Database (Google Firebase Firestore & Auth) ──
    // Free Tier gives 50,000 document reads & 20,000 writes per day.
    // Create project at https://console.firebase.google.com and paste your web config here.
    firebase: {
      enabled: false, // Change to true once you paste your Firebase config below
      apiKey: '',
      authDomain: 'yuvantara-portal.firebaseapp.com',
      projectId: 'yuvantara-portal',
      storageBucket: 'yuvantara-portal.appspot.com',
      messagingSenderId: '',
      appId: ''
    },

    // ── Security & Authentication ──
    // Password reset & verification uses Date of Birth (DOB), registered email, and dynamic security captcha.
    // OTP requirement has been decommissioned.

    // ── Optional Dedicated Backend Server ──
    // If you run server/server.js on a VPS, cPanel Node.js, Render, or Railway
    api: {
      baseUrl: window.location.origin.includes('localhost')
        ? 'http://localhost:5000/api'
        : 'https://yuvantaraventure.in/api',
      isServerRunning: false // Automatically tested at runtime
    }
  };

  window.YUVANTARA_CONFIG = CONFIG;
})(window);
