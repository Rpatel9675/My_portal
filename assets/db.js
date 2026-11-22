// Yuvantara Database & Authentication Service (LocalStorage Persistent Engine)
(function(window) {
  'use strict';

  var STORAGE_KEYS = {
    USERS: 'yuvantara_users_db',
    APPLICATIONS: 'yuvantara_apps_db',
    CURRENT_USER: 'yuvantara_session_user',
    CERTIFICATES: 'yuvantara_certs_db'
  };

  // Initial Seed Data
  var SEED_USERS = [
    {
      id: 'USR-101',
      name: 'Rohan Sen',
      email: 'student@yuvantara.com',
      password: 'student123',
      phone: '+91 98765 43210',
      track: 'Cybersecurity & SOC Operations',
      stream: 'B.Tech (Computer Science)',
      college: 'National Institute of Technology (NIT), Patna',
      role: 'student',
      registeredAt: '2026-01-15',
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
        fileUrl: '' // Base64 or URL if uploaded
      }
    },
    {
      id: 'USR-102',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'password123',
      phone: '+91 98765 11223',
      track: 'Artificial Intelligence & Machine Learning',
      stream: 'B.Tech (IT)',
      college: 'Indian Institute of Technology (IIT), Patna',
      role: 'student',
      registeredAt: '2026-02-01',
      progress: 50,
      modules: [
        { name: 'Module 1: Data Preprocessing & Python Math', status: 'completed' },
        { name: 'Module 2: Supervised Learning & Scikit-Learn', status: 'completed' },
        { name: 'Module 3: Neural Networks with PyTorch', status: 'in-progress' },
        { name: 'Module 4: Computer Vision with OpenCV', status: 'pending' },
        { name: 'Module 5: MLOps Model Deployment', status: 'pending' }
      ],
      certificate: null
    },
    {
      id: 'USR-ADMIN',
      name: 'Yuvantara Administrator',
      email: 'admin@yuvantara.com',
      password: 'admin777',
      role: 'admin',
      registeredAt: '2025-01-01'
    }
  ];

  var SEED_APPLICATIONS = [
    {
      id: 'APP-901',
      name: 'Amit Kumar',
      email: 'amit.patna@example.com',
      phone: '+91 98112 33445',
      track: 'Python Full-Stack & Automation',
      stream: 'BCA',
      college: 'Patna University, Patna',
      appliedAt: '2026-11-20',
      status: 'pending'
    },
    {
      id: 'APP-902',
      name: 'Sneha Kumari',
      email: 'sneha.k@example.com',
      phone: '+91 97722 55667',
      track: 'Robotics & IoT Embedded Systems',
      stream: 'B.Tech (ECE)',
      college: 'Birla Institute of Technology (BIT), Patna',
      appliedAt: '2026-11-21',
      status: 'approved'
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

  // Initialize data if not set
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorage(STORAGE_KEYS.USERS, SEED_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    setStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
  }

  var DB = {
    // Users
    getUsers: function() {
      return getStorage(STORAGE_KEYS.USERS, SEED_USERS);
    },

    getStudents: function() {
      return this.getUsers().filter(function(u) { return u.role === 'student'; });
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

    registerStudent: function(data) {
      if (!data.email || !data.password) {
        return { success: false, message: 'Email and password are required.' };
      }
      if (this.getUserByEmail(data.email)) {
        return { success: false, message: 'An account with this email already exists.' };
      }

      var users = this.getUsers();
      var newStudent = {
        id: 'USR-' + (Date.now().toString().slice(-4)),
        name: data.name || 'Student Candidate',
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone || '+91 98765 43210',
        track: data.track || 'Cybersecurity & SOC Operations',
        stream: data.stream || 'Engineering / Technology',
        college: data.college || 'NIT Patna',
        role: 'student',
        registeredAt: new Date().toISOString().split('T')[0],
        progress: 15,
        modules: [
          { name: 'Module 1: Orientation & Core Foundations', status: 'completed' },
          { name: 'Module 2: Lab Setup & Environment Diagnostics', status: 'in-progress' },
          { name: 'Module 3: Hands-on Case Studies & Practical Labs', status: 'pending' },
          { name: 'Module 4: Mid-Term Evaluation & Milestone Submission', status: 'pending' },
          { name: 'Module 5: Capstone Project & Certification', status: 'pending' }
        ],
        certificate: null
      };

      users.push(newStudent);
      setStorage(STORAGE_KEYS.USERS, users);
      return { success: true, user: newStudent };
    },

    login: function(email, password) {
      if (!email || !password) return { success: false, message: 'Please provide both email and password.' };
      var user = this.getUserByEmail(email);
      if (!user) return { success: false, message: 'No account found with this email address.' };
      if (user.password !== password) return { success: false, message: 'Incorrect password.' };

      this.setCurrentUser(user);
      return { success: true, user: user };
    },

    updateStudent: function(email, updates) {
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
          updatedUser = users[i];
          break;
        }
      }

      if (updatedUser) {
        setStorage(STORAGE_KEYS.USERS, users);
        var curr = this.getCurrentUser();
        if (curr && curr.email.toLowerCase() === email) {
          this.setCurrentUser(updatedUser);
        }
        return { success: true, user: updatedUser };
      }
      return { success: false, message: 'User not found.' };
    },

    changePassword: function(email, currentPassword, newPassword) {
      var user = this.getUserByEmail(email);
      if (!user) return { success: false, message: 'User not found.' };
      if (user.password !== currentPassword) {
        return { success: false, message: 'Current password does not match.' };
      }
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters.' };
      }

      return this.updateStudent(email, { password: newPassword });
    },

    deleteStudent: function(email) {
      var users = this.getUsers();
      email = (email || '').trim().toLowerCase();
      users = users.filter(function(u) { return u.email.toLowerCase() !== email; });
      setStorage(STORAGE_KEYS.USERS, users);
      return { success: true };
    },

    // Session Management
    getCurrentUser: function() {
      return getStorage(STORAGE_KEYS.CURRENT_USER, null);
    },

    setCurrentUser: function(user) {
      if (!user) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } else {
        // clone without password
        var safe = Object.assign({}, user);
        delete safe.password;
        setStorage(STORAGE_KEYS.CURRENT_USER, safe);
      }
    },

    logout: function() {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    // Applications
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
        track: data.track || 'Cybersecurity & SOC Operations',
        stream: data.stream || '',
        college: data.college || '',
        password: data.password || 'student123',   // saved for auto-activation on approval
        appliedAt: new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      apps.unshift(newApp);
      setStorage(STORAGE_KEYS.APPLICATIONS, apps);
      return { success: true, app: newApp };
    },

    updateApplicationStatus: function(id, status) {
      var apps = this.getApplications();
      for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === id) {
          apps[i].status = status;
          break;
        }
      }
      setStorage(STORAGE_KEYS.APPLICATIONS, apps);
      return { success: true };
    },

    // Certificate Operations
    assignCertificate: function(email, certData) {
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
        fileUrl: certData.fileUrl || ''
      };

      return this.updateStudent(email, {
        certificate: certificate,
        progress: 100
      });
    },

    resetToDemoData: function() {
      setStorage(STORAGE_KEYS.USERS, SEED_USERS);
      setStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
      this.logout();
      return { success: true };
    }
  };

  window.YuvantaraDB = DB;
})(window);
