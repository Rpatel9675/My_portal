// Yuvantara Student Portal Controller
(function() {
  'use strict';

  var currentUser = null;

  function initPortal() {
    currentUser = window.YuvantaraDB ? YuvantaraDB.getCurrentUser() : null;

    var studentView = document.getElementById('student-view');
    var loginGate = document.getElementById('login-gate');

    if (!currentUser || currentUser.role !== 'student') {
      if (studentView) studentView.style.display = 'none';
      if (loginGate) loginGate.style.display = 'block';
      bindGateEvents();
      return;
    }

    if (loginGate) loginGate.style.display = 'none';
    if (studentView) studentView.style.display = 'block';

    renderStudentData();
    bindPortalEvents();
  }

  // ── Render Student Data ──
  function renderStudentData() {
    if (!currentUser) return;

    // Refresh user from DB to catch any recent updates
    var fresh = YuvantaraDB.getUserByEmail(currentUser.email);
    if (fresh) currentUser = fresh;

    // Avatar initials
    var initials = (currentUser.name || 'Student')
      .split(' ')
      .map(function(n) { return n[0]; })
      .slice(0, 2)
      .join('')
      .toUpperCase();

    var stuAvatar = document.getElementById('stu-avatar');
    if (stuAvatar) stuAvatar.textContent = initials || 'ST';

    // Header info
    setText('stu-name', currentUser.name);
    setText('stu-track', currentUser.track || 'Industrial Internship');
    setText('stu-track-pill', (currentUser.track || 'Active Track') + ' • Enrolled');
    setText('stu-college', currentUser.college || 'Engineering Institute');
    setText('stu-email', currentUser.email);
    setText('stu-id', currentUser.id || 'USR-101');

    // Progress
    var pct = typeof currentUser.progress === 'number' ? currentUser.progress : 75;
    setText('stu-pct-text', pct + '%');
    var barFill = document.getElementById('stu-bar-fill');
    if (barFill) barFill.style.width = pct + '%';

    // Modules list
    renderModulesList(currentUser.modules || []);

    // Certificate
    renderCertificateSection(currentUser);

    // Profile form prefill
    setVal('p-name', currentUser.name || '');
    setVal('p-email', currentUser.email || '');
    setVal('p-phone', currentUser.phone || '');
    setVal('p-stream', currentUser.stream || '');
    setVal('p-college', currentUser.college || '');
    setVal('p-track', currentUser.track || 'Cybersecurity & SOC Operations');
  }

  function renderModulesList(modules) {
    var container = document.getElementById('stu-module-list');
    if (!container) return;

    if (!modules || modules.length === 0) {
      modules = [
        { name: 'Module 1: Orientation & Core Foundations', status: 'completed' },
        { name: 'Module 2: Lab Setup & Environment Diagnostics', status: 'completed' },
        { name: 'Module 3: Hands-on Case Studies & Practical Labs', status: 'in-progress' },
        { name: 'Module 4: Mid-Term Evaluation & Milestone Submission', status: 'pending' },
        { name: 'Module 5: Capstone Project & Certification', status: 'pending' }
      ];
    }

    var html = '';
    modules.forEach(function(m, idx) {
      var badgeClass = 'badge-wait';
      var badgeLabel = 'Pending';
      var icon = '⏳';

      if (m.status === 'completed') {
        badgeClass = 'badge-done';
        badgeLabel = 'Completed';
        icon = '✅';
      } else if (m.status === 'in-progress') {
        badgeClass = 'badge-active';
        badgeLabel = 'In Progress';
        icon = '⚡';
      }

      html += '<div class="module-item ' + (m.status || 'pending') + '">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<span style="font-size:1.1rem">' + icon + '</span>' +
          '<div>' +
            '<strong style="color:#0F172A;font-size:.95rem">' + escapeHtml(m.name) + '</strong>' +
            '<small style="display:block;color:#64748B">Milestone #' + (idx + 1) + ' of ' + modules.length + '</small>' +
          '</div>' +
        '</div>' +
        '<span class="module-status-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  function renderCertificateSection(user) {
    var certWrap = document.getElementById('cert-official-wrap');
    var emptyWrap = document.getElementById('cert-empty-wrap');
    var uploadedPreview = document.getElementById('uploaded-cert-preview');

    var cert = user.certificate;
    if (cert && cert.id) {
      if (certWrap) certWrap.style.display = 'block';
      if (emptyWrap) emptyWrap.style.display = 'none';

      setText('cert-c-name', user.name);
      setText('cert-c-college', user.college || 'National Institute of Technology (NIT), Patna');
      setText('cert-c-track', cert.title || user.track || 'Industrial Internship');
      setText('cert-c-duration', cert.duration || '6 Months (Jan 2026 – Jun 2026)');
      setText('cert-c-grade', cert.grade || 'Grade A+ (Distinction)');
      setText('cert-c-id', cert.id);
      setText('cert-c-date', cert.issueDate || 'June 20, 2026');
      setText('cert-c-authority', cert.authority || 'Yuvantara Cyber Defense Council');
      setText('cert-c-status', cert.status || 'Valid & Verified');

      var verifyLink = document.getElementById('btn-verify-cert-link');
      if (verifyLink) {
        verifyLink.href = '../verify-certificate/index.html?id=' + encodeURIComponent(cert.id);
      }
    } else {
      if (certWrap) certWrap.style.display = 'none';
      if (emptyWrap) emptyWrap.style.display = 'block';
    }

    // Check if custom uploaded file exists
    if (user.uploadedCertificate) {
      if (uploadedPreview) {
        uploadedPreview.style.display = 'flex';
        setText('uploaded-doc-title', user.uploadedCertificate.name || 'Uploaded_Certificate');
        setText('uploaded-doc-date', 'Uploaded on ' + (user.uploadedCertificate.uploadedAt || 'recently'));
        var viewBtn = document.getElementById('btn-view-uploaded');
        if (viewBtn) {
          viewBtn.href = user.uploadedCertificate.dataUrl || '#';
          viewBtn.setAttribute('download', user.uploadedCertificate.name || 'Yuvantara_Certificate');
        }
      }
    } else {
      if (uploadedPreview) uploadedPreview.style.display = 'none';
    }
  }

  // ── Small Navigation Bar Tabs ──
  function bindPortalEvents() {
    var tabs = document.querySelectorAll('.portal-tab-btn[data-tab]');
    tabs.forEach(function(tabBtn) {
      tabBtn.addEventListener('click', function() {
        var target = tabBtn.dataset.tab;
        tabs.forEach(function(b) { b.classList.remove('active'); });
        tabBtn.classList.add('active');

        document.querySelectorAll('.portal-pane').forEach(function(pane) {
          pane.classList.remove('active');
        });
        var activePane = document.getElementById('pane-' + target);
        if (activePane) activePane.classList.add('active');
      });
    });

    // Logout buttons
    var logoutBtns = [
      document.getElementById('btn-portal-logout'),
      document.getElementById('btn-quick-logout')
    ];
    logoutBtns.forEach(function(btn) {
      if (btn) {
        btn.addEventListener('click', function() {
          if (confirm('Are you sure you want to sign out of your Student Portal?')) {
            YuvantaraDB.logout();
            window.location.reload();
          }
        });
      }
    });

    // Print / Download Certificate
    var printBtns = [
      document.getElementById('btn-print-certificate'),
      document.getElementById('btn-print-certificate-2')
    ];
    printBtns.forEach(function(btn) {
      if (btn) {
        btn.addEventListener('click', function() {
          window.print();
        });
      }
    });

    // File Upload handling
    var fileInput = document.getElementById('cert-file-input');
    var browseBtn = document.getElementById('btn-browse-file');
    var selectedName = document.getElementById('selected-filename');
    var uploadAlert = document.getElementById('upload-alert');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', function() {
        fileInput.click();
      });

      fileInput.addEventListener('change', function() {
        if (!fileInput.files || fileInput.files.length === 0) return;
        var file = fileInput.files[0];
        if (selectedName) selectedName.textContent = file.name;

        // Read file as Base64 data URL
        var reader = new FileReader();
        reader.onload = function(e) {
          var base64Data = e.target.result;
          var uploadedDoc = {
            name: file.name,
            uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dataUrl: base64Data
          };

          YuvantaraDB.updateStudent(currentUser.email, {
            uploadedCertificate: uploadedDoc
          });

          // Show alert
          if (uploadAlert) {
            uploadAlert.className = 'alert-box success';
            uploadAlert.textContent = 'Certificate file "' + file.name + '" uploaded successfully and linked to your profile!';
            uploadAlert.style.display = 'block';
          }

          renderStudentData();
        };

        reader.readAsDataURL(file);
      });
    }

    // Remove uploaded certificate
    var removeUploadedBtn = document.getElementById('btn-remove-uploaded');
    if (removeUploadedBtn) {
      removeUploadedBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to remove your uploaded certificate document?')) {
          YuvantaraDB.updateStudent(currentUser.email, {
            uploadedCertificate: null
          });
          if (uploadAlert) {
            uploadAlert.className = 'alert-box success';
            uploadAlert.textContent = 'Uploaded certificate document removed.';
            uploadAlert.style.display = 'block';
          }
          if (selectedName) selectedName.textContent = '';
          renderStudentData();
        }
      });
    }

    // Edit Profile Form
    var formProfile = document.getElementById('form-profile');
    var profileAlert = document.getElementById('profile-alert');
    if (formProfile) {
      formProfile.addEventListener('submit', function(e) {
        e.preventDefault();
        var updates = {
          name: document.getElementById('p-name').value.trim(),
          phone: document.getElementById('p-phone').value.trim(),
          stream: document.getElementById('p-stream').value.trim(),
          college: document.getElementById('p-college').value.trim(),
          track: document.getElementById('p-track').value
        };

        var res = YuvantaraDB.updateStudent(currentUser.email, updates);
        if (res.success) {
          if (profileAlert) {
            profileAlert.className = 'alert-box success';
            profileAlert.textContent = 'Your profile information has been saved successfully.';
            profileAlert.style.display = 'block';
          }
          renderStudentData();
        } else {
          if (profileAlert) {
            profileAlert.className = 'alert-box error';
            profileAlert.textContent = res.message || 'Error updating profile.';
            profileAlert.style.display = 'block';
          }
        }
      });
    }

    // Change Password Form
    var formPassword = document.getElementById('form-password');
    var passAlert = document.getElementById('pass-alert');
    if (formPassword) {
      formPassword.addEventListener('submit', function(e) {
        e.preventDefault();
        var cur = document.getElementById('pwd-current').value;
        var pnew = document.getElementById('pwd-new').value;
        var pconf = document.getElementById('pwd-confirm').value;

        if (pnew !== pconf) {
          if (passAlert) {
            passAlert.className = 'alert-box error';
            passAlert.textContent = 'New password and confirmation do not match.';
            passAlert.style.display = 'block';
          }
          return;
        }

        var res = YuvantaraDB.changePassword(currentUser.email, cur, pnew);
        if (res.success) {
          if (passAlert) {
            passAlert.className = 'alert-box success';
            passAlert.textContent = 'Password updated successfully!';
            passAlert.style.display = 'block';
          }
          formPassword.reset();
        } else {
          if (passAlert) {
            passAlert.className = 'alert-box error';
            passAlert.textContent = res.message || 'Error updating password.';
            passAlert.style.display = 'block';
          }
        }
      });
    }
  }

  // ── Bind Gate (Not-Logged-In) Events ──
  function bindGateEvents() {
    var form = document.getElementById('gate-login-form');
    var alertBox = document.getElementById('gate-alert');
    var demoBtn = document.getElementById('fill-demo-btn');

    if (demoBtn) {
      demoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        setVal('gate-email', 'student@yuvantara.com');
        setVal('gate-pass', 'student123');
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('gate-email').value;
        var pass = document.getElementById('gate-pass').value;

        var res = YuvantaraDB.login(email, pass);
        if (res.success) {
          if (res.user.role === 'admin') {
            window.location.href = '../admin_login_777/index.html';
          } else {
            initPortal();
          }
        } else {
          if (alertBox) {
            alertBox.className = 'alert-box error';
            alertBox.textContent = res.message || 'Invalid email or password.';
            alertBox.style.display = 'block';
          }
        }
      });
    }
  }

  // ── Helpers ──
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortal);
  } else {
    initPortal();
  }
})();