// Yuvantara Portal Scripts

// 1. Mobile Menu Toggle & Dropdowns
const n = document.querySelector('.nav'), d = [...document.querySelectorAll('.dd')];
const burger = document.querySelector('.burger');
if (burger && n) {
  burger.onclick = () => n.classList.toggle('open');
}
d.forEach(x => x.addEventListener('toggle', () => {
  if (x.open) d.forEach(o => { if (o !== x) o.open = false; });
}));
document.addEventListener('click', e => {
  d.forEach(x => { if (!x.contains(e.target)) x.open = false; });
});

// 2. Base Path Resolution & Image Loader
(function() {
  // Compute site root (empty "" on index.html, "../" on 1-depth subpages, "../../" on 2-depth)
  var linkTag = document.querySelector('link[href*="style.css"]');
  var siteRoot = '';
  if (linkTag) {
    var href = linkTag.getAttribute('href') || '';
    var m = href.match(/^(\.\.\/)+/);
    if (m) {
      siteRoot = m[0]; // e.g. "../" or "../../"
    }
  }
  window.__yuvantaraBasePath = siteRoot;

  var assetsDir = siteRoot + 'assets/';

  // Ensure config.js, db.js, cloud-db.js, qr-generator.js, header.js, footer.js are loaded
  var requiredScripts = ['config.js', 'db.js', 'cloud-db.js', 'qr-generator.js', 'header.js', 'footer.js'];
  requiredScripts.forEach(function(s) {
    var hasScript = document.querySelector('script[src*="' + s + '"]');
    if (!hasScript) {
      var sc = document.createElement('script');
      sc.src = assetsDir + s;
      document.head.appendChild(sc);
    }
  });

  var baseImgDir = assetsDir + 'images/';

  var IM = {
    'technologies':    baseImgDir + 'innovation.jpg',
    'cybersecurity':   baseImgDir + 'cyber.jpg',
    'infrastructure':  baseImgDir + 'automation.jpg',
    'managed-services':baseImgDir + 'management.jpg',
    'machine-learning':baseImgDir + 'machine.jpg',
    'healthcare':      baseImgDir + 'medical.jpg',
    'logistics':       baseImgDir + 'robotics-lab.jpg',
    'education':       baseImgDir + 'python.jpg',
    'ai':              baseImgDir + 'ai.jpg',
    'robotics':        baseImgDir + 'robotics.jpg',
    'innovation':      baseImgDir + 'innovation.jpg',
    'agriculture':     baseImgDir + 'agriculture.jpg',
    'python':          baseImgDir + 'python.jpg',
    'management':      baseImgDir + 'management.jpg',
    'financial':       baseImgDir + 'financial.jpg',
    'bio-research':    baseImgDir + 'bio-research.jpg',
    'connect':         baseImgDir + 'connect.jpg'
  };

  function imgs(r) {
    (r || document).querySelectorAll('img[data-img]').forEach(function(i) {
      var b = i.dataset.img;
      if (IM[b]) {
        i.src = IM[b];
        i.onerror = function() {
          i.parentNode.classList.add('noimg');
          i.remove();
        };
        return;
      }
      var x = ['png', 'jpg', 'jpeg', 'webp'], k = 0;
      i.onerror = function() {
        if (++k < x.length) i.src = baseImgDir + b + '.' + x[k];
        else { i.parentNode.classList.add('noimg'); i.remove(); }
      };
      i.src = baseImgDir + b + '.' + x[0];
    });
  }
  imgs();
  window.imgs = imgs;
})();

// 3. Dynamic User State in Navigation
function updateNavUserState() {
  if (!window.YuvantaraDB) return;
  var user = YuvantaraDB.getCurrentUser();
  if (!user) return;

  var basePath = window.__yuvantaraBasePath || '';

  // Once logged in, hide option to apply for internship program
  document.querySelectorAll('[data-auth="signup"]').forEach(function(btn) {
    btn.style.display = 'none';
  });

  var loginBtns = document.querySelectorAll('[data-auth="login"]');
  loginBtns.forEach(function(btn) {
    btn.removeAttribute('data-auth');
    if (user.role === 'admin') {
      btn.textContent = 'Admin Console';
      btn.onclick = function(e) {
        e.preventDefault();
        window.location.href = basePath + 'admin_login_777/index.html';
      };
    } else {
      btn.textContent = 'My Portal (' + (user.name ? user.name.split(' ')[0] : 'Student') + ')';
      btn.onclick = function(e) {
        e.preventDefault();
        window.location.href = basePath + 'portal/index.html';
      };
    }
  });
}
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(updateNavUserState, 150);
});

// 4. Login / Sign-up Modal
(function() {
  var modal = document.getElementById('auth-modal');
  var overlay = document.getElementById('auth-overlay');
  if (!modal) return;

  function switchTab(t) {
    modal.querySelectorAll('.auth-tab-btn:not(.link)').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === t);
    });
    modal.querySelectorAll('.auth-pane').forEach(function(p) {
      p.classList.toggle('active', p.dataset.pane === t);
    });
  }

  function openModal(tab, preselectCourse) {
    switchTab(tab || 'login');
    if (preselectCourse) {
      var progSelect = document.getElementById('s-prog');
      if (progSelect) {
        for (var i = 0; i < progSelect.options.length; i++) {
          if (progSelect.options[i].text.toLowerCase().indexOf(preselectCourse.toLowerCase()) !== -1) {
            progSelect.selectedIndex = i;
            break;
          }
        }
      }
    }
    modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    var successView = document.getElementById('signup-success-view');
    var signupForm = document.getElementById('form-signup');
    if (successView) successView.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
  }

  // Delegated click handler for modal open triggers across the entire page (header, hero, cards, footer)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-auth]');
    if (btn) {
      e.preventDefault();
      var tab = btn.dataset.auth || 'login';
      var course = btn.dataset.course || '';
      openModal(tab, course);
      return;
    }

    var tabBtn = e.target.closest('.auth-tab-btn');
    if (tabBtn && modal && modal.contains(tabBtn) && !tabBtn.classList.contains('link')) {
      e.preventDefault();
      switchTab(tabBtn.dataset.tab);
      return;
    }
  });

  // Close triggers
  var closeBtn = modal.querySelector('.auth-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Simple Captchas
  function newCaptcha(id) {
    var a = Math.ceil(Math.random() * 9), b = Math.ceil(Math.random() * 9);
    var el = document.getElementById(id);
    if (el) { el.dataset.ans = a + b; el.textContent = a + ' + ' + b + ' = ?'; }
  }
  newCaptcha('cap-login-q');
  newCaptcha('cap-signup-q');

  // Login form handler with YuvantaraDB Authentication
  var loginForm = document.getElementById('form-login');
  if (loginForm) {
    // Ensure Forgot Password link is present in modal
    var passLabel = loginForm.querySelector('label[for="l-pass"]');
    if (passLabel && !loginForm.querySelector('a[href*="forgot-password"]')) {
      var basePath = window.__yuvantaraBasePath || '';
      var fpLink = document.createElement('a');
      fpLink.href = basePath + 'forgot-password/index.html';
      fpLink.textContent = 'Forgot password?';
      fpLink.style.cssText = 'font-size:.82rem;color:var(--ac);text-decoration:none;float:right;font-weight:normal';
      passLabel.appendChild(fpLink);
    }
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var inp = document.getElementById('cap-login-a');
      var q = document.getElementById('cap-login-q');
      if (inp && q && parseInt(inp.value) !== parseInt(q.dataset.ans)) {
        inp.setCustomValidity('Incorrect captcha solution. Please calculate again.');
        inp.reportValidity();
        newCaptcha('cap-login-q');
        inp.value = '';
        return;
      }
      if (inp) inp.setCustomValidity('');

      var email = document.getElementById('l-email').value.trim();
      var pass = document.getElementById('l-pass').value;

      if (window.YuvantaraDB && YuvantaraDB.validateEmail) {
        var emailCheck = YuvantaraDB.validateEmail(email);
        if (!emailCheck.valid) {
          alert(emailCheck.message);
          return;
        }
      }

      if (window.YuvantaraDB) {
        var res = YuvantaraDB.login(email, pass);
        if (res.success) {
          closeModal();
          var basePath = window.__yuvantaraBasePath || '';
          if (res.user.role === 'admin') {
            window.location.href = basePath + 'admin_login_777/index.html';
          } else {
            window.location.href = basePath + 'portal/index.html';
          }
          return;
        } else {
          alert('Login failed: ' + (res.message || 'Invalid email or password.'));
          newCaptcha('cap-login-q');
          return;
        }
      } else {
        alert('Welcome back, ' + email + '! Logging in...');
        closeModal();
      }
    });
  }

  // Signup / Internship Application form handler
  var signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var inp = document.getElementById('cap-signup-a');
      var q = document.getElementById('cap-signup-q');
      if (inp && q) {
        var userAns = parseInt(inp.value, 10);
        var expectedAns = parseInt(q.dataset.ans, 10);
        if (isNaN(userAns) || userAns !== expectedAns) {
          alert('Incorrect captcha solution. Please solve: ' + (q.textContent || 'the question'));
          newCaptcha('cap-signup-q');
          inp.value = '';
          inp.focus();
          return;
        }
      }

      var name = document.getElementById('s-name').value.trim();
      var email = document.getElementById('s-email').value.trim();
      var phone = document.getElementById('s-phone').value.trim();
      var dobEl = document.getElementById('s-dob');
      var dob = dobEl ? dobEl.value.trim() : '';
      var pass = document.getElementById('s-pass').value;
      var passConfirmEl = document.getElementById('s-pass-confirm');
      var passConfirm = passConfirmEl ? passConfirmEl.value : '';
      var declEl = document.getElementById('s-declaration');
      var prog = document.getElementById('s-prog') ? document.getElementById('s-prog').value : '';
      var stream = document.getElementById('s-stream') ? document.getElementById('s-stream').value : '';
      var college = document.getElementById('s-college') ? document.getElementById('s-college').value.trim() : '';

      if (!dob) {
        alert('Please select your Date of Birth.');
        if (dobEl) dobEl.focus();
        return;
      }

      if (passConfirmEl && pass !== passConfirm) {
        alert('Passwords do not match. Please ensure both passwords are identical.');
        passConfirmEl.focus();
        return;
      }

      if (declEl && !declEl.checked) {
        alert('Please check the Self-Declaration box to confirm that your details are accurate.');
        declEl.focus();
        return;
      }

      if (window.YuvantaraDB) {
        // Strict anti-fake email verification
        var ev = YuvantaraDB.validateEmail(email);
        if (!ev.valid) {
          alert(ev.message);
          var ee = document.getElementById('s-email'); if (ee) ee.focus();
          return;
        }
        email = ev.email;

        // Strict anti-fake phone verification
        var pv = YuvantaraDB.validatePhone(phone);
        if (!pv.valid) {
          alert(pv.message);
          var pe = document.getElementById('s-phone'); if (pe) pe.focus();
          return;
        }
        phone = pv.phone;

        // Password strength check
        if (!pass || pass.length < 8) {
          alert('Password must be at least 8 characters long.');
          return;
        }
        if (!/[0-9]/.test(pass)) {
          alert('Password must contain at least one number.');
          return;
        }

        // Check for duplicate email in users DB
        if (YuvantaraDB.getUserByEmail(email)) {
          alert('An account with this email already exists. Please log in instead.');
          return;
        }

        // Check if application already submitted (prevent duplicate submissions)
        var existingApps = YuvantaraDB.getApplications();
        var alreadyApplied = existingApps.some(function(a) {
          return a.email && a.email.toLowerCase() === email.toLowerCase() && a.status !== 'rejected';
        });
        if (alreadyApplied) {
          alert('You have already submitted an application with this email (' + email + '). Please log in or contact admissions at xyv@yuvantara.com.');
          return;
        }

        // 1. Submit application to database (sets status to 'pending')
        var appResult = YuvantaraDB.submitApplication({
          name: name,
          email: email,
          phone: phone,
          dob: dob,
          track: prog,
          stream: stream,
          college: college
        });

        if (!appResult || !appResult.success) {
          alert('Submission Error: ' + (appResult ? appResult.message : 'Could not submit application. Please try again.'));
          return;
        }

        // 2. Pre-register student account with 'pending' status
        YuvantaraDB.registerStudent({
          name: name,
          email: email,
          password: pass,
          phone: phone,
          dob: dob,
          track: prog,
          stream: stream,
          college: college,
          accountStatus: 'pending'
        });

        // 3. Post to backend server endpoint if online
        try {
          fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appResult.app)
          }).catch(function() {});
        } catch(e) {}

        // 4. Store pending registration data for payment checkout
        var pendingData = {
          appId: appResult.app.id,
          name: name, email: email, phone: phone, dob: dob,
          password: pass, track: prog, stream: stream, college: college,
          createdAt: Date.now()
        };
        try { localStorage.setItem('yuvantara_pending_app', JSON.stringify(pendingData)); } catch(e) {}

        // User requested flow: Immediately redirect new applicant to Payment Page!
        closeModal();
        var basePath = window.__yuvantaraBasePath || '';
        window.location.href = basePath + 'payment/index.html';
        return;

        // 5. Show applicant a clear success message inside the modal WITHOUT destroying the form
        var paneSignup = modal.querySelector('.auth-pane[data-pane="signup"]');
        if (paneSignup && signupForm) {
          signupForm.style.display = 'none';
          var successView = document.getElementById('signup-success-view');
          if (!successView) {
            successView = document.createElement('div');
            successView.id = 'signup-success-view';
            paneSignup.appendChild(successView);
          }
          successView.style.display = 'block';
          successView.innerHTML =
            '<div style="text-align:center;padding:24px 10px">' +
              '<div style="font-size:3rem;margin-bottom:12px">🎉</div>' +
              '<h2 style="color:#16A34A;font-size:1.4rem;margin:0 0 10px">Application Submitted Successfully!</h2>' +
              '<p style="color:#334155;font-size:.95rem;line-height:1.6;margin:0 0 16px">' +
                'Thank you, <strong>' + (name ? name.replace(/</g, '&lt;') : '') + '</strong>! Your enrollment application for <strong>' + (prog ? prog.replace(/</g, '&lt;') : '') + '</strong> has been received.' +
              '</p>' +
              '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;margin-bottom:20px;text-align:left;font-size:.88rem">' +
                '<div style="margin-bottom:6px"><strong>Application ID:</strong> <code>' + appResult.app.id + '</code></div>' +
                '<div style="margin-bottom:6px"><strong>Status:</strong> <span style="background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:4px;font-weight:600">⏳ Pending Admin Approval</span></div>' +
                '<div><strong>Registered Email:</strong> ' + (email ? email.replace(/</g, '&lt;') : '') + '</div>' +
              '</div>' +
              '<p style="color:#64748B;font-size:.85rem;margin-bottom:20px">' +
                'An administrator will review your application. Once approved, your student portal access will be unlocked.' +
              '</p>' +
              '<button type="button" class="btn p" id="btn-app-success-close" style="width:100%;padding:12px">Close &amp; Go to Login</button>' +
            '</div>';

          signupForm.reset();
          newCaptcha('cap-signup-q');

          var closeSuccessBtn = document.getElementById('btn-app-success-close');
          if (closeSuccessBtn) {
            closeSuccessBtn.onclick = function() {
              successView.style.display = 'none';
              signupForm.style.display = 'block';
              closeModal();
              openModal('login');
            };
          }
        } else {
          alert('✅ Application Submitted Successfully!\n\nApplication ID: ' + appResult.app.id + '\nProgram: ' + prog + '\n\nYour application is now pending review by our administration.');
          if (signupForm) signupForm.reset();
          newCaptcha('cap-signup-q');
          closeModal();
        }

      } else {
        alert('Congratulations ' + name + '! Your application for ' + prog + ' has been received.');
        signupForm.reset();
        newCaptcha('cap-signup-q');
        closeModal();
      }
    });
  }

  window.openAuthModal = openModal;
})();

// 5. Certificate Verification Engine
(function() {
  var verifyForm = document.getElementById('verify-cert-form');
  var resultBox = document.getElementById('cert-result-box');
  if (!verifyForm || !resultBox) return;

  var mockCertificates = {
    'YUV-2026-CS101': {
      name: 'Rohan Sen',
      course: 'Cybersecurity & SOC Operations Industrial Internship',
      duration: '6 Months (Jan 2026 – Jun 2026)',
      grade: 'Grade A+ (Distinction)',
      date: 'June 20, 2026',
      status: 'Valid & Authenticated',
      college: 'National Institute of Technology (NIT), Patna',
      council: 'Yuvantara Cyber Defense Council'
    },
    'YUV-2026-AI204': {
      name: 'Priya Sharma',
      course: 'Artificial Intelligence & Machine Learning Specialization',
      duration: '6 Months (Jan 2026 – Jun 2026)',
      grade: 'Grade A+ (Outstanding)',
      date: 'July 05, 2026',
      status: 'Valid & Authenticated',
      college: 'Indian Institute of Technology (IIT), Patna',
      council: 'Yuvantara AI Research Lab'
    },
    'YUV-2026-PY305': {
      name: 'Amit Kumar',
      course: 'Python Full-Stack & Cloud Computing Internship',
      duration: '3 Months (Feb 2026 – May 2026)',
      grade: 'Grade A (Excellent)',
      date: 'May 30, 2026',
      status: 'Valid & Authenticated',
      college: 'Birla Institute of Technology (BIT), Patna',
      council: 'Yuvantara Software Systems Council'
    },
    'YUV-2026-RB412': {
      name: 'Sneha Kumari',
      course: 'Robotics, IoT & Embedded Systems Internship',
      duration: '6 Months (Jan 2026 – Jun 2026)',
      grade: 'Grade A+ (Distinction)',
      date: 'August 12, 2026',
      status: 'Valid & Authenticated',
      college: 'Patna University, Patna, Bihar',
      council: 'Yuvantara Robotics & Automation Wing'
    }
  };

  function displayCertificate(id) {
    id = (id || '').trim().toUpperCase();
    if (!id) return;

    var cert = null;
    var errBox = document.getElementById('cert-error-box');
    var successBox = document.getElementById('cert-success-box');
    var errMsg = document.getElementById('cert-error-msg');

    // First check YuvantaraDB users for dynamically issued/revoked certificates
    if (window.YuvantaraDB) {
      var allRecords = typeof YuvantaraDB.getAllEmployees === 'function' ? YuvantaraDB.getAllEmployees() : YuvantaraDB.getStudents();
      for (var i = 0; i < allRecords.length; i++) {
        var s = allRecords[i];
        var sCertId = (s.certificate && s.certificate.id) ? s.certificate.id : s.certificateNumber;
        if (sCertId && sCertId.toUpperCase() === id) {
          cert = {
            name: s.name,
            dob: s.dob || (s.certificate && s.certificate.dob) || '2002-05-15',
            course: (s.certificate && s.certificate.title) || s.track || 'Industrial Internship Program',
            duration: (s.certificate && s.certificate.duration) || s.duration || '6 Months Industrial Internship',
            grade: (s.certificate && s.certificate.grade) || s.grade || 'Grade A+ (Distinction)',
            date: (s.certificate && (s.certificate.issueDate || s.certificate.date)) || s.issueDate || '2026',
            status: (s.certificate && s.certificate.status) || s.status || 'valid',
            revokedAt: s.certificate ? s.certificate.revokedAt : null,
            college: s.college || 'Affiliated University',
            council: (s.certificate && s.certificate.authority) || s.authority || 'Yuvantara Academic & Skill Council'
          };
          break;
        }
      }
    }

    if (!cert && mockCertificates[id]) {
      cert = mockCertificates[id];
    }

    if (!cert) {
      // Record not found in official registry
      if (errBox) {
        errBox.style.display = 'block';
        if (errMsg) errMsg.textContent = 'No certificate record found matching ID "' + id + '". Please verify the credential code or contact administrative registry.';
      }
      if (successBox) successBox.style.display = 'none';
      resultBox.classList.add('active');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Record found
    if (errBox) errBox.style.display = 'none';
    if (successBox) successBox.style.display = 'block';

    var isRevoked = (cert.status === 'revoked' || cert.status === 'Revoked');
    var badgeEl = document.getElementById('c-badge');
    var statusEl = document.getElementById('c-status');

    if (badgeEl) {
      if (isRevoked) {
        badgeEl.textContent = '⚠️ CERTIFICATE REVOKED';
        badgeEl.style.background = '#FEE2E2';
        badgeEl.style.color = '#DC2626';
        badgeEl.style.borderColor = '#FECACA';
      } else {
        badgeEl.textContent = 'Official Record Verified';
        badgeEl.style.background = '';
        badgeEl.style.color = '';
        badgeEl.style.borderColor = '';
      }
    }

    if (statusEl) {
      if (isRevoked) {
        statusEl.textContent = 'REVOKED & NULLIFIED' + (cert.revokedAt ? ' (' + cert.revokedAt + ')' : '');
        statusEl.style.color = '#DC2626';
      } else {
        statusEl.textContent = cert.status || 'Valid & Authenticated';
        statusEl.style.color = '#16A34A';
      }
    }

    var authorityEl = document.getElementById('c-authority');
    if (authorityEl) authorityEl.textContent = cert.council || 'Yuvantara Academic & Cyber Defense Council';

    document.getElementById('c-id').textContent = id;
    document.getElementById('c-name').textContent = cert.name;
    document.getElementById('c-course').textContent = cert.course;
    document.getElementById('c-duration').textContent = cert.duration;
    document.getElementById('c-grade').textContent = cert.grade;
    document.getElementById('c-date').textContent = cert.date;
    document.getElementById('c-college').textContent = cert.college;
    var accEl = document.getElementById('c-accreditation');
    if (accEl) accEl.textContent = 'ISO 9001:2015 Certified';

    resultBox.classList.add('active');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  verifyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var inp = document.getElementById('cert-id-input');
    displayCertificate(inp.value);
  });

  // Sample pill clicks
  document.querySelectorAll('.sample-pills span').forEach(function(pill) {
    pill.addEventListener('click', function() {
      var id = pill.textContent.trim();
      var inp = document.getElementById('cert-id-input');
      if (inp) inp.value = id;
      displayCertificate(id);
    });
  });

  // Print button
  var printBtn = document.getElementById('btn-print-cert');
  if (printBtn) {
    printBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.print();
    });
  }

  // Auto-verify if URL has ?id=... parameter
  var urlParams = new URLSearchParams(window.location.search);
  var qId = urlParams.get('id');
  if (qId) {
    var inp = document.getElementById('cert-id-input');
    if (inp) inp.value = qId;
    displayCertificate(qId);
  }
})();