// Yuvantara Production Configuration
// Official Domain: https://yuvantaraventure.in
(function(window) {
  'use strict';

  var COMPANY_IDENTITY = {
    // ── Master Company Details (Single Source of Truth) ──
    // Replace placeholder markers (TODO_REAL_VALUE) with your verified corporate documentation
    legalName: 'Yuvantara Solutions Private Limited', // TODO_REAL_VALUE: Official registered corporate entity name
    tradeName: 'Yuvantara',
    tagline: 'Cybersecurity, Enterprise Software & Industrial Internship Programs',
    cin: 'U72900BR2024PTC068942', // TODO_REAL_VALUE: Corporate Identification Number (MCA verified)
    gstin: '10AABCY1234F1Z5', // TODO_REAL_VALUE: 15-digit GST identification number
    isGstRegistered: false, // Set to true once verified with Chartered Accountant
    pan: 'AABCY1234F', // TODO_REAL_VALUE: Permanent Account Number
    sacCode: '9992', // Education, Vocational & Technical Training Support Services
    isoCertification: 'ISO 9001:2015 Certified Quality Management System (Cert # QMS-2024-YUV-8821)', // TODO_REAL_VALUE
    registeredOffice: '4A, Prantika Building, Kankarbagh Main Road, Patna, Bihar - 800006', // TODO_REAL_VALUE
    corporateOffice: '4A, Prantika Building, Kankarbagh Main Road, Patna, Bihar - 800006', // TODO_REAL_VALUE
    primaryPhone: '+91 98765 43210', // TODO_REAL_VALUE: Student / Helpline telephone
    supportEmail: 'xyv@yuvantara.com', // TODO_REAL_VALUE: Primary operational helpdesk email
    billingEmail: 'billing@yuvantara.com', // TODO_REAL_VALUE: Accounts & invoice enquiries
    careersEmail: 'internships@yuvantara.com', // TODO_REAL_VALUE: Student internship inquiries
    officialWebsite: 'https://yuvantaraventure.in',
    portalUrl: 'https://yuvantaraventure.in/portal/',
    verifyCertUrl: 'https://yuvantaraventure.in/verify-certificate/',
    signatoryName: 'Er. Abhishek Sharma', // TODO_REAL_VALUE: Authorized Signatory
    signatoryTitle: 'Head of Cyber Defense Operations & Industrial Training' // TODO_REAL_VALUE
  };

  var CONFIG = {
    domain: COMPANY_IDENTITY.officialWebsite,
    siteName: COMPANY_IDENTITY.tradeName,
    company: COMPANY_IDENTITY,
    tagline: COMPANY_IDENTITY.tagline,
    supportEmail: COMPANY_IDENTITY.supportEmail,
    supportPhone: COMPANY_IDENTITY.primaryPhone,
    address: COMPANY_IDENTITY.registeredOffice,
    gstin: COMPANY_IDENTITY.gstin,

    // ── Payment Gateway & Mode Settings ──
    // Options: 'disabled' (no fee displayed), 'manual' (offline UPI/bank transfer), 'razorpay' (active gateway)
    payment: {
      mode: 'disabled', // Default mode as per Section 7 (gateway will not work for now)
      amountInPaise: 23600, // ₹236.00 (₹200 Base Fee + 18% GST ₹36)
      currency: 'INR',
      razorpayKeyId: 'rzp_test_51H0yourKeyHere', // Set when razorpay mode is active
      upiId: 'yuvantara@upi', // TODO_REAL_VALUE: For manual UPI transfers
      bankDetails: {
        accountName: 'Yuvantara Solutions Private Limited',
        accountNumber: '918020000000000', // TODO_REAL_VALUE
        ifsc: 'UTIB0000000', // TODO_REAL_VALUE
        bankName: 'Axis Bank' // TODO_REAL_VALUE
      }
    },

    // ── Security & Authentication ──
    // Password reset & verification uses Date of Birth (DOB), registered email, and registered mobile number.
    // OTP requirement has been decommissioned.

    // ── Backend API ──
    api: {
      baseUrl: window.location.origin.includes('localhost')
        ? (window.location.port === '8080' ? '/api' : 'http://localhost:5000/api')
        : '/api',
      isServerRunning: false
    }
  };

  window.YUVANTARA_CONFIG = CONFIG;
  window.COMPANY_CONFIG = COMPANY_IDENTITY;
  window.getCompanyDetails = function() { return COMPANY_IDENTITY; };
})(window);
