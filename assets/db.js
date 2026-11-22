// Yuvantara Database & Authentication Service (LocalStorage + Cloud Synchronization)
// Production Engine: Role-Based Access Control, SHA-256 Hashing, Audit Logging & Action Ownership Locking
(function(window) {
  'use strict';

  var STORAGE_KEYS = {
    USERS: 'yuvantara_users_db',
    APPLICATIONS: 'yuvantara_apps_db',
    CURRENT_USER: 'yuvantara_session_user',
    CERTIFICATES: 'yuvantara_certs_db',
    LOCKOUTS: 'yuvantara_lockouts',
    AUDIT_LOGS: 'yuvantara_audit_logs'
  };

  // Pure JavaScript SHA-256 Implementation for Production Grade Password Hashing
  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = [];
    var k = [];
    var primeCounter = 0;
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, (j += 16));
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        var temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
        var temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
          var b = (hash[i] >> (j * 8)) & 255;
          result += ((b < 16) ? 0 : '') + b.toString(16);
        }
      }
    }
    return result;
  }

  var SALT = 'YUVANTARA_DEFENSE_PROD_SALT_@2026_PATNA#';
  function hashPassword(password) {
    if (!password) return '';
    return 'SHA256$' + sha256(SALT + password + SALT);
  }

  // ── SEED DATA DEFINITIONS ──
  var SEED_USERS = [
    // 👑 1 Super Administrator
    {
      id: 'SUPER-001',
      name: 'Super Administrator',
      email: 'a4dr_00@supper',
      passwordHash: hashPassword('!!a4dr@00'),
      role: 'superadmin',
      status: 'active',
      registeredAt: '2025-01-01',
      phone: '+91 98765 00000'
    },
    // 🛡️ 6 Administrators
    {
      id: 'ADM-01',
      name: 'Admin ADK-01',
      email: 'adk_01@admin',
      passwordHash: hashPassword('!adk_01@'),
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
      phone: '+91 98765 00001'
    },
    {
      id: 'ADM-02',
      name: 'Admin ALK-01',
      email: 'alk_01@admin',
      passwordHash: hashPassword('!alk_01@'),
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
      phone: '+91 98765 00002'
    },
    {
      id: 'ADM-03',
      name: 'Admin DHB-03',
      email: 'dhb_03@admin',
      passwordHash: hashPassword('!dhb_03@'),
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
      phone: '+91 98765 00003'
    },
    {
      id: 'ADM-04',
      name: 'Admin ABK-04',
      email: 'abk_04@admin',
      passwordHash: hashPassword('!abk_04@'),
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
      phone: '+91 98765 00004'
    },
    {
      id: 'ADM-05',
      name: 'Admin ANP-05',
      email: 'anp_05@admin',
      passwordHash: hashPassword('!anp_05@'),
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
      phone: '+91 98765 00005'
    },
    {
      id: 'ADM-06',
      name: 'Admin ROP-06',
      email: 'rop_06@admin',
      passwordHash: hashPassword('!rop_06@'),
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
      phone: '+91 98765 00006'
    },
    // Seed Students
    {
      id: 'USR-101',
      name: 'Rohan Sen',
      email: 'student@yuvantara.com',
      passwordHash: hashPassword('student123'),
      phone: '+91 98765 43210',
      dob: '2002-05-15',
      track: 'Cybersecurity & SOC Operations',
      stream: 'B.Tech (Computer Science)',
      college: 'National Institute of Technology (NIT), Patna',
      role: 'student',
      status: 'active',
      accountStatus: 'active',
      registeredAt: '2026-01-15',
      enrolledByAdmin: 'adk_01@admin',
      progress: 75,
      modules: [
        { name: 'Module 1: Network Packet Analysis & Wireshark', status: 'completed' },
        { name: 'Module 2: Port Scanning & Vulnerability Assessment', status: 'completed' },
        { name: 'Module 3: SIEM Log Correlation & Splunk Labs', status: 'completed' },
        { name: 'Module 4: Incident Response & Threat Hunting', status: 'in-progress' },
        { name: 'Module 5: Capstone Enterprise Defense Project', status: 'pending' }
      ],
      certificate: {
        id: 'YUV-2026-CS101',
        title: 'Cybersecurity & SOC Operations Industrial Internship',
        duration: '6 Months (Jan 2026 – Jun 2026)',
        grade: 'Grade A+ (Distinction)',
        issueDate: 'June 20, 2026',
        authority: 'Yuvantara Cyber Defense Council',
        status: 'Issued & Verified',
        issuedByAdmin: 'dhb_03@admin',
        fileUrl: ''
      }
    },
    {
      id: 'USR-102',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      passwordHash: hashPassword('password123'),
      phone: '+91 98765 11223',
      dob: '2003-08-20',
      track: 'Artificial Intelligence & Machine Learning',
      stream: 'B.Tech (IT)',
      college: 'Indian Institute of Technology (IIT), Patna',
      role: 'student',
      status: 'active',
      accountStatus: 'active',
      registeredAt: '2026-02-01',
      enrolledByAdmin: 'alk_01@admin',
      progress: 50,
      modules: [
        { name: 'Module 1: Data Preprocessing & Python Math', status: 'completed' },
        { name: 'Module 2: Supervised Learning & Scikit-Learn', status: 'completed' },
        { name: 'Module 3: Neural Networks with PyTorch', status: 'in-progress' },
        { name: 'Module 4: Computer Vision with OpenCV', status: 'pending' },
        { name: 'Module 5: MLOps Model Deployment', status: 'pending' }
      ],
      certificate: null
    }
  ];

  var SEED_APPLICATIONS = [
    {
      id: 'APP-901',
      name: 'Amit Kumar',
      email: 'amit.patna@example.com',
      phone: '+91 98112 33445',
      dob: '2001-11-10',
      track: 'Python Full-Stack & Automation',
      stream: 'BCA',
      college: 'Patna University, Patna',
      appliedAt: '2026-11-20',
      status: 'pending',
      lockedApprovedBy: null
    },
    {
      id: 'APP-902',
      name: 'Sneha Kumari',
      email: 'sneha.k@example.com',
      phone: '+91 97722 55667',
      dob: '2002-09-05',
      track: 'Robotics & IoT Embedded Systems',
      stream: 'B.Tech (ECE)',
      college: 'Birla Institute of Technology (BIT), Patna',
      appliedAt: '2026-11-21',
      status: 'approved',
      lockedApprovedBy: 'adk_01@admin',
      approvedAt: '2026-11-21'
    }
  ];

  var SEED_AUDIT_LOGS = [
    {
      id: 'LOG-1001',
      timestamp: '2026-01-15 10:30:00',
      adminEmail: 'adk_01@admin',
      actionType: 'ENROLL_STUDENT',
      targetId: 'student@yuvantara.com',
      details: 'Enrolled Rohan Sen into Cybersecurity & SOC Operations'
    },
    {
      id: 'LOG-1002',
      timestamp: '2026-06-20 16:45:00',
      adminEmail: 'dhb_03@admin',
      actionType: 'ISSUE_CERTIFICATE',
      targetId: 'YUV-2026-CS101',
      details: 'Issued official verified certificate YUV-2026-CS101 to Rohan Sen'
    },
    {
      id: 'LOG-1003',
      timestamp: '2026-11-21 14:15:00',
      adminEmail: 'adk_01@admin',
      actionType: 'APPROVE_APPLICATION',
      targetId: 'APP-902',
      details: 'Approved application APP-902 for Sneha Kumari'
    }
  ];

  function getStorage(key, defaultVal) {
    try {
      var item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage quota exceeded or error:', e);
    }
  }

  // Self-Healing Initialization: Ensure all 7 admin accounts exist
  (function ensureAdminAccounts() {
    var users = getStorage(STORAGE_KEYS.USERS, null);
    if (!users) {
      setStorage(STORAGE_KEYS.USERS, SEED_USERS);
      return;
    }

    // Check if superadmin exists, if not inject all 7 admins
    var hasSuper = users.some(function(u) { return u.email === 'a4dr_00@supper'; });
    if (!hasSuper) {
      // Remove deprecated admin accounts
      users = users.filter(function(u) { return u.email !== 'admin@yuvantara.com'; });
      // Add superadmin & 6 admins from seed
      var adminsFromSeed = SEED_USERS.filter(function(u) { return u.role === 'admin' || u.role === 'superadmin'; });
      adminsFromSeed.forEach(function(adm) {
        if (!users.some(function(x) { return x.email === adm.email; })) {
          users.push(adm);
        }
      });
      setStorage(STORAGE_KEYS.USERS, users);
    }

    // Ensure seed students have DOB populated
    var modified = false;
    users.forEach(function(u) {
      if (u.email === 'student@yuvantara.com' && !u.dob) { u.dob = '2002-05-15'; modified = true; }
      if (u.email === 'priya@example.com' && !u.dob) { u.dob = '2003-08-20'; modified = true; }
    });
    if (modified) {
      setStorage(STORAGE_KEYS.USERS, users);
    }
  })();

  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    setStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    setStorage(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  var DB = {
    hashPassword: hashPassword,

    _getLockouts: function() { return getStorage(STORAGE_KEYS.LOCKOUTS, {}); },
    _setLockouts: function(d) { setStorage(STORAGE_KEYS.LOCKOUTS, d); },

    _isLocked: function(email) {
      var lockouts = this._getLockouts();
      var rec = lockouts[(email || '').toLowerCase()];
      if (!rec || !rec.lockedUntil) return false;
      if (Date.now() < rec.lockedUntil) return { locked: true, remainingMs: rec.lockedUntil - Date.now() };
      delete lockouts[(email || '').toLowerCase()];
      this._setLockouts(lockouts);
      return false;
    },

    _recordFail: function(email) {
      var lockouts = this._getLockouts();
      var key = (email || '').toLowerCase();
      if (!lockouts[key]) lockouts[key] = { count: 0, lockedUntil: null };
      lockouts[key].count = (lockouts[key].count || 0) + 1;
      var remaining = 5 - lockouts[key].count;
      if (lockouts[key].count >= 5) {
        lockouts[key].lockedUntil = Date.now() + 15 * 60 * 1000;
        lockouts[key].count = 0;
        remaining = 0;
      }
      this._setLockouts(lockouts);
      return remaining;
    },

    _clearFails: function(email) {
      var lockouts = this._getLockouts();
      delete lockouts[(email || '').toLowerCase()];
      this._setLockouts(lockouts);
    },

    // ── Audit Logging & Action Ownership Locking ──
    logAuditAction: function(adminEmail, actionType, targetId, details) {
      var logs = getStorage(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      var entry = {
        id: 'LOG-' + Date.now().toString().slice(-6),
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }),
        adminEmail: adminEmail || 'System',
        actionType: actionType || 'GENERAL_ACTION',
        targetId: targetId || '—',
        details: details || ''
      };
      logs.unshift(entry);
      setStorage(STORAGE_KEYS.AUDIT_LOGS, logs);

      // Cloud audit logging
      if (window.YuvantaraCloudDB) {
        window.YuvantaraCloudDB.saveDocument('audit_logs', entry.id, entry);
      }
      return entry;
    },

    getAuditLogs: function() {
      return getStorage(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    },

    // ── User Management ──
    getUsers: function() {
      return getStorage(STORAGE_KEYS.USERS, SEED_USERS);
    },

    getStudents: function() {
      return this.getUsers().filter(function(u) { return u.role === 'student'; });
    },

    getAdmins: function() {
      return this.getUsers().filter(function(u) { return u.role === 'admin'; });
    },

    isSuperAdmin: function(email) {
      var u = this.getUserByEmail(email);
      return !!(u && (u.role === 'superadmin' || u.email === 'a4dr_00@supper'));
    },

    getUserByEmail: function(email) {
      if (!email) return null;
      var users = this.getUsers();
      email = email.trim().toLowerCase();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email) return users[i];
      }
      return null;
    },

    registerStudent: function(data, registeringAdminEmail) {
      if (!data.email || !data.password) {
        return { success: false, message: 'Email and password are required.' };
      }
      if (this.getUserByEmail(data.email)) {
        return { success: false, message: 'An account with this email already exists.' };
      }

      var users = this.getUsers();
      var newStudent = {
        id: 'USR-' + (Date.now().toString().slice(-5)),
        name: data.name || 'Student Candidate',
        email: data.email.trim().toLowerCase(),
        passwordHash: hashPassword(data.password),
        phone: data.phone || '',
        dob: data.dob || '',
        track: data.track || 'Cybersecurity & SOC Operations',
        stream: data.stream || 'Engineering / Technology',
        college: data.college || 'NIT Patna',
        role: 'student',
        status: 'active',
        registeredAt: new Date().toISOString().split('T')[0],
        accountStatus: data.accountStatus || 'pending',
        enrolledByAdmin: registeringAdminEmail || 'Self-Registration',
        paymentRef: data.paymentRef || null,
        paymentMethod: data.paymentMethod || null,
        paidAt: data.paidAt || null,
        progress: 0,
        modules: [
          { name: 'Module 1: Orientation & Core Foundations', status: 'pending' },
          { name: 'Module 2: Lab Setup & Environment Diagnostics', status: 'pending' },
          { name: 'Module 3: Hands-on Case Studies & Practical Labs', status: 'pending' },
          { name: 'Module 4: Mid-Term Evaluation & Milestone Submission', status: 'pending' },
          { name: 'Module 5: Capstone Project & Certification', status: 'pending' }
        ],
        certificate: null
      };

      users.push(newStudent);
      setStorage(STORAGE_KEYS.USERS, users);

      this.logAuditAction(
        registeringAdminEmail || 'System',
        'REGISTER_STUDENT',
        newStudent.email,
        'Registered student account for ' + newStudent.name + ' (' + newStudent.track + ')'
      );

      if (window.YuvantaraCloudDB) {
        var docId = newStudent.email.replace(/[@.]/g, '_');
        window.YuvantaraCloudDB.saveDocument('users', docId, newStudent);
      }
      return { success: true, user: newStudent };
    },

    login: function(email, password) {
      if (!email || !password) return { success: false, message: 'Please provide both email and password.' };
      email = email.trim().toLowerCase();

      var lockCheck = this._isLocked(email);
      if (lockCheck && lockCheck.locked) {
        var mins = Math.ceil(lockCheck.remainingMs / 60000);
        return { success: false, message: '🔒 Account temporarily locked due to too many failed attempts. Try again in ' + mins + ' minute(s).' };
      }

      var user = this.getUserByEmail(email);
      if (!user) {
        this._recordFail(email);
        return { success: false, message: 'No account found with this email address.' };
      }

      // Check if admin is suspended
      if (user.status === 'suspended') {
        return { success: false, message: '⛔ Account Suspended: Your administrative privileges have been revoked by the Super Administrator.' };
      }

      var passwordOk = false;
      var inputHash = hashPassword(password);

      if (user.passwordHash) {
        passwordOk = (user.passwordHash === inputHash);
      } else if (user.password) {
        // Upgrade legacy plaintext to SHA-256 hash
        passwordOk = (user.password === password);
        if (passwordOk) {
          user.passwordHash = inputHash;
          delete user.password;
          this.updateStudent(user.email, { passwordHash: inputHash });
        }
      }

      if (!passwordOk) {
        var rem = this._recordFail(email);
        var msg = 'Incorrect password.';
        if (rem > 0) msg += ' ' + rem + ' attempt(s) remaining before 15-min lockout.';
        else msg += ' Account locked for 15 minutes.';
        return { success: false, message: msg };
      }

      this._clearFails(email);

      // Session with 8-hour expiry
      var sess = Object.assign({}, user);
      delete sess.password;
      delete sess.passwordHash;
      sess._sessionExpiry = Date.now() + (8 * 60 * 60 * 1000);
      this.setCurrentUser(sess);

      return { success: true, user: sess };
    },

    updateStudent: function(email, updates, modifyingAdminEmail) {
      var users = this.getUsers();
      email = (email || '').trim().toLowerCase();
      var updatedUser = null;

      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email) {
          for (var key in updates) {
            if (updates.hasOwnProperty(key) && key !== 'id' && key !== 'role' && key !== 'email') {
              users[i][key] = updates[key];
            }
          }
          if (modifyingAdminEmail) {
            users[i].lastModifiedByAdmin = modifyingAdminEmail;
            users[i].lastModifiedAt = new Date().toISOString();
          }
          updatedUser = users[i];
          break;
        }
      }

      if (updatedUser) {
        setStorage(STORAGE_KEYS.USERS, users);
        if (modifyingAdminEmail) {
          this.logAuditAction(
            modifyingAdminEmail,
            'UPDATE_STUDENT',
            email,
            'Modified student record for ' + updatedUser.name
          );
        }
        if (window.YuvantaraCloudDB) {
          var docId = updatedUser.email.replace(/[@.]/g, '_');
          window.YuvantaraCloudDB.saveDocument('users', docId, updatedUser);
        }
        var curr = this.getCurrentUser();
        if (curr && curr.email.toLowerCase() === email) {
          this.setCurrentUser(updatedUser);
        }
        return { success: true, user: updatedUser };
      }
      return { success: false, message: 'User not found.' };
    },

    // ── Super Admin Exclusive Operations ──
    changeAdminPasswordBySuper: function(superEmail, targetAdminEmail, newPassword) {
      if (!this.isSuperAdmin(superEmail)) {
        return { success: false, message: 'Permission Denied: Only Super Admin can change admin passwords.' };
      }

      var target = this.getUserByEmail(targetAdminEmail);
      if (!target || target.role !== 'admin') {
        return { success: false, message: 'Target admin account not found.' };
      }

      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }

      var users = this.getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === targetAdminEmail.toLowerCase()) {
          users[i].passwordHash = hashPassword(newPassword);
          delete users[i].password;
          break;
        }
      }
      setStorage(STORAGE_KEYS.USERS, users);

      this.logAuditAction(
        superEmail,
        'SUPER_CHANGE_ADMIN_PASSWORD',
        targetAdminEmail,
        'Super Admin reset credentials for administrator ' + targetAdminEmail
      );

      return { success: true, message: 'Password successfully updated for ' + targetAdminEmail };
    },

    toggleAdminAccess: function(superEmail, targetAdminEmail, isSuspended) {
      if (!this.isSuperAdmin(superEmail)) {
        return { success: false, message: 'Permission Denied: Only Super Admin can modify admin access.' };
      }

      var target = this.getUserByEmail(targetAdminEmail);
      if (!target || target.role !== 'admin') {
        return { success: false, message: 'Target admin account not found.' };
      }

      var users = this.getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === targetAdminEmail.toLowerCase()) {
          users[i].status = isSuspended ? 'suspended' : 'active';
          break;
        }
      }
      setStorage(STORAGE_KEYS.USERS, users);

      this.logAuditAction(
        superEmail,
        isSuspended ? 'SUSPEND_ADMIN_ACCESS' : 'RESTORE_ADMIN_ACCESS',
        targetAdminEmail,
        'Super Admin ' + (isSuspended ? 'SUSPENDED' : 'RESTORED') + ' access for ' + targetAdminEmail
      );

      return { success: true, status: isSuspended ? 'suspended' : 'active' };
    },

    removeAdminBySuper: function(superEmail, targetAdminEmail) {
      if (!this.isSuperAdmin(superEmail)) {
        return { success: false, message: 'Permission Denied: Only Super Admin can remove administrators.' };
      }

      var users = this.getUsers();
      users = users.filter(function(u) { return u.email.toLowerCase() !== targetAdminEmail.toLowerCase(); });
      setStorage(STORAGE_KEYS.USERS, users);

      this.logAuditAction(
        superEmail,
        'REMOVE_ADMIN',
        targetAdminEmail,
        'Super Admin permanently deleted admin account ' + targetAdminEmail
      );

      return { success: true };
    },

    // ── Certificate Operations with Locked Admin Attribution ──
    assignCertificate: function(email, certData, issuingAdminEmail) {
      var student = this.getUserByEmail(email);
      if (!student) return { success: false, message: 'Student not found.' };

      var certificate = {
        id: certData.id || ('YUV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)),
        title: certData.title || (student.track + ' Industrial Internship'),
        duration: certData.duration || '6 Months Industrial Training',
        grade: certData.grade || 'Grade A+ (Distinction)',
        issueDate: certData.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        authority: certData.authority || 'Yuvantara Academic & Skill Council',
        status: 'Valid & Verified',
        issuedByAdmin: issuingAdminEmail || 'System',
        issuedAt: new Date().toISOString(),
        fileUrl: certData.fileUrl || ''
      };

      this.logAuditAction(
        issuingAdminEmail || 'System',
        'ISSUE_CERTIFICATE',
        certificate.id,
        'Issued certificate ' + certificate.id + ' to ' + student.name + ' (' + student.email + ')'
      );

      return this.updateStudent(email, {
        certificate: certificate,
        progress: 100
      }, issuingAdminEmail);
    },

    revokeCertificate: function(email, revokingAdminEmail) {
      var student = this.getUserByEmail(email);
      if (!student) return { success: false, message: 'Student not found.' };

      var dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      var cert = student.certificate || {};
      cert.status = 'revoked';
      cert.revokedAt = dateStr;
      cert.revokedByAdmin = revokingAdminEmail || 'System';

      this.logAuditAction(
        revokingAdminEmail || 'System',
        'REVOKE_CERTIFICATE',
        student.email,
        'Revoked certificate for ' + student.name + ' (' + student.email + ')'
      );

      return this.updateStudent(email, { certificate: cert }, revokingAdminEmail);
    },

    // Session Management
    getCurrentUser: function() {
      var user = getStorage(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return null;
      if (user._sessionExpiry && Date.now() > user._sessionExpiry) {
        this.logout();
        return null;
      }
      return user;
    },

    setCurrentUser: function(user) {
      if (!user) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } else {
        var safe = Object.assign({}, user);
        delete safe.password;
        delete safe.passwordHash;
        setStorage(STORAGE_KEYS.CURRENT_USER, safe);
      }
    },

    logout: function() {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    // Applications with Locked Admin Attribution
    getApplications: function() {
      return getStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
    },

    submitApplication: function(data) {
      var apps = this.getApplications();
      var newApp = {
        id: 'APP-' + (Date.now().toString().slice(-4)),
        name: data.name || 'Applicant',
        email: (data.email || '').trim().toLowerCase(),
        phone: data.phone || '',
        dob: data.dob || '',
        track: data.track || 'Cybersecurity & SOC Operations',
        stream: data.stream || '',
        college: data.college || '',
        password: data.password || 'student123',
        appliedAt: new Date().toISOString().split('T')[0],
        status: 'pending',
        lockedApprovedBy: null
      };
      apps.unshift(newApp);
      setStorage(STORAGE_KEYS.APPLICATIONS, apps);
      if (window.YuvantaraCloudDB) {
        window.YuvantaraCloudDB.saveDocument('applications', newApp.id, newApp);
      }
      return { success: true, app: newApp };
    },

    saveApplication: function(data) {
      return this.submitApplication(data);
    },

    // ── DOB & Captcha Based Identity Verification for Password Reset ──
    verifyUserForReset: function(email, dob) {
      if (!email || !dob) {
        return { success: false, message: 'Please provide both your registered email address and Date of Birth.' };
      }
      email = email.trim().toLowerCase();
      dob = dob.trim();
      var user = this.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'No registered student account found with email: ' + email };
      }
      // If user has DOB recorded, verify match
      if (user.dob && user.dob !== dob) {
        return { success: false, message: 'Date of Birth does not match the registered record for this account.' };
      }
      return { success: true, user: user };
    },

    resetPassword: function(email, newPassword) {
      if (!email || !newPassword || newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }
      email = email.trim().toLowerCase();
      var users = this.getUsers();
      var found = false;
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email) {
          users[i].passwordHash = hashPassword(newPassword);
          delete users[i].password;
          found = true;
          break;
        }
      }
      if (!found) {
        return { success: false, message: 'Account not found.' };
      }
      setStorage(STORAGE_KEYS.USERS, users);
      this.logAuditAction('System', 'RESET_PASSWORD', email, 'Password reset verified via DOB & Captcha');
      if (window.YuvantaraCloudDB) {
        var docId = email.replace(/[@.]/g, '_');
        var u = this.getUserByEmail(email);
        if (u) window.YuvantaraCloudDB.saveDocument('users', docId, u);
      }
      return { success: true };
    },

    updateApplicationStatus: function(id, status, approvingAdminEmail) {
      var apps = this.getApplications();
      var appItem = null;
      for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === id) {
          apps[i].status = status;
          if (approvingAdminEmail) {
            apps[i].lockedApprovedBy = approvingAdminEmail;
            apps[i].approvedAt = new Date().toISOString().split('T')[0];
          }
          appItem = apps[i];
          break;
        }
      }
      setStorage(STORAGE_KEYS.APPLICATIONS, apps);

      if (appItem && approvingAdminEmail) {
        this.logAuditAction(
          approvingAdminEmail,
          status === 'approved' ? 'APPROVE_APPLICATION' : 'REJECT_APPLICATION',
          id,
          'Marked application ' + id + ' as ' + status.toUpperCase() + ' for ' + appItem.name
        );
      }

      return { success: true };
    },

    resetToDemoData: function() {
      setStorage(STORAGE_KEYS.USERS, SEED_USERS);
      setStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
      setStorage(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      this.logout();
      return { success: true };
    }
  };

  window.YuvantaraDB = DB;
})(window);
