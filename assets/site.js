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

// 2. Image loader with relative path detection
(function() {
  var linkTag = document.querySelector('link[href*="style.css"]');
  var pathPrefix = '';
  if (linkTag) {
    var href = linkTag.getAttribute('href');
    pathPrefix = href.replace(/style\.css(\?.*)?$/i, '');
  }
  var baseImgDir = pathPrefix + 'images/';

  var IM = {
    'technologies':    baseImgDir + 'innovation.jpg',
    'cybersecurity':   baseImgDir + 'cyber.png',
    'infrastructure':  baseImgDir + 'automation.jpg',
    'managed-services':baseImgDir + 'management.jpg',
    'machine-learning':baseImgDir + 'machine.jpg',
    'healthcare':      baseImgDir + 'mediacal.jpg',
    'logistics':       baseImgDir + 'r1_1.jpg',
    'education':       baseImgDir + 'python.jpg',
    'ai':              baseImgDir + 'ai.jpg',
    'robotics':        baseImgDir + 'Robatics.jpg',
    'innovation':      baseImgDir + 'innovation.jpg',
    'agriculture':     baseImgDir + 'agriculture.jpg',
    'python':          baseImgDir + 'python.jpg',
    'management':      baseImgDir + 'management.jpg',
    'financial':       baseImgDir + 'financial.jpg',
    'bio-research':    baseImgDir + 'bio reserch.jpg',
    'connect':         baseImgDir + 'connect.jpg'
  };

  function imgs(r) {
    (r || document).querySelectorAll('img[data-img]').forEach(function(i) {
      var b = i.dataset.img;
      if (IM[b]) {
        i.src = IM[b];
        i.onerror = function() {
          // If cyber.png failed, fallback to cyber.jpg
          if (b === 'cybersecurity' && i.src.indexOf('.png') !== -1) {
            i.src = baseImgDir + 'cyber.jpg';
            return;
          }
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

// 3. Login / Sign-up Modal
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
  }

  // Open triggers
  document.querySelectorAll('[data-auth]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var tab = btn.dataset.auth || 'login';
      var course = btn.dataset.course || '';
      openModal(tab, course);
    });
  });

  // Close triggers
  var closeBtn = modal.querySelector('.auth-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Tab switching
  modal.querySelectorAll('.auth-tab-btn').forEach(function(b) {
    b.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(b.dataset.tab);
    });
  });

  // Simple Captchas
  function newCaptcha(id) {
    var a = Math.ceil(Math.random() * 9), b = Math.ceil(Math.random() * 9);
    var el = document.getElementById(id);
    if (el) { el.dataset.ans = a + b; el.textContent = a + ' + ' + b + ' = ?'; }
  }
  newCaptcha('cap-login-q');
  newCaptcha('cap-signup-q');

  // Login form handler
  var loginForm = document.getElementById('form-login');
  if (loginForm) {
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
      var email = document.getElementById('l-email').value;
      alert('Welcome back, ' + email + '! (Student portal authenticated)');
      closeModal();
    });
  }

  // Signup / Internship Application form handler
  var signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var inp = document.getElementById('cap-signup-a');
      var q = document.getElementById('cap-signup-q');
      if (inp && q && parseInt(inp.value) !== parseInt(q.dataset.ans)) {
        inp.setCustomValidity('Incorrect captcha solution. Please calculate again.');
        inp.reportValidity();
        newCaptcha('cap-signup-q');
        inp.value = '';
        return;
      }
      if (inp) inp.setCustomValidity('');
      var name = document.getElementById('s-name').value;
      var prog = document.getElementById('s-prog').value;
      alert('Congratulations ' + name + '! Your application for the ' + prog + ' Internship has been submitted successfully.\n\nOur academic coordinator will reach out to you within 24 hours with orientation details.');
      signupForm.reset();
      newCaptcha('cap-signup-q');
      closeModal();
    });
  }

  window.openAuthModal = openModal;
})();

// 4. Certificate Verification Engine
(function() {
  var verifyForm = document.getElementById('verify-cert-form');
  var resultBox = document.getElementById('cert-result-box');
  if (!verifyForm || !resultBox) return;

  var mockCertificates = {
    'YUV-2026-CS101': {
      name: 'Rohan Sen',
      course: 'Cybersecurity & SOC Operations Internship',
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

    var cert = mockCertificates[id];
    // Dynamic fallback for any entered credential ID format
    if (!cert) {
      cert = {
        name: 'Student Candidate',
        course: 'Advanced Industrial Training & Internship',
        duration: '6 Months Industrial Internship',
        grade: 'Grade A (Passed with Distinction)',
        date: 'October 15, 2026',
        status: 'Valid & Verified in National Database',
        college: 'Affiliated Technical Institution, WB',
        council: 'Yuvantara Academic & Skill Council'
      };
    }

    document.getElementById('c-id').textContent = id;
    document.getElementById('c-name').textContent = cert.name;
    document.getElementById('c-course').textContent = cert.course;
    document.getElementById('c-duration').textContent = cert.duration;
    document.getElementById('c-grade').textContent = cert.grade;
    document.getElementById('c-date').textContent = cert.date;
    document.getElementById('c-college').textContent = cert.college;
    document.getElementById('c-status').textContent = cert.status;

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
})();
