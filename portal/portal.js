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

    // Always refresh from DB for latest state
    var fresh = YuvantaraDB.getUserByEmail(currentUser.email);
    if (fresh) currentUser = fresh;

    // Avatar initials
    var initials = (currentUser.name || 'Student')
      .split(' ').map(function(n) { return n[0]; })
      .slice(0, 2).join('').toUpperCase();

    var stuAvatar = document.getElementById('stu-avatar');
    if (stuAvatar) stuAvatar.textContent = initials || 'ST';

    // Header info
    setText('stu-name', currentUser.name);
    setText('stu-track', currentUser.track || 'Industrial Internship');
    setText('stu-track-pill', (currentUser.track || 'Active Track') + ' • Enrolled');
    setText('stu-college', currentUser.college || 'Engineering Institute');
    setText('stu-email', currentUser.email);
    setText('stu-id', currentUser.id || 'USR-101');

    // ── Account pending activation? ──
    var isPending = currentUser.accountStatus === 'pending';
    renderPendingBanner(isPending);

    // Progress — grayed out when pending
    var pct = typeof currentUser.progress === 'number' ? currentUser.progress : 0;
    setText('stu-pct-text', isPending ? 'Activating...' : pct + '%');
    var barFill = document.getElementById('stu-bar-fill');
    if (barFill) barFill.style.width = (isPending ? 0 : pct) + '%';

    renderModulesList(currentUser.modules || [], isPending);
    renderCertificateSection(currentUser, isPending);

    // Profile form prefill — track is now a readonly text input (locked)
    setVal('p-name', currentUser.name || '');
    setVal('p-email', currentUser.email || '');
    setVal('p-phone', currentUser.phone || '');
    setVal('p-stream', currentUser.stream || '');
    setVal('p-college', currentUser.college || '');
    setVal('p-track', currentUser.track || 'Cybersecurity & SOC Operations');

    // Show payment info if available
    renderPaymentInfo(currentUser);
  }

  // ── Pending Banner ──
  function renderPendingBanner(isPending) {
    var old = document.getElementById('pending-activation-banner');
    if (old) old.remove();
    if (!isPending) return;

    var banner = document.createElement('div');
    banner.id = 'pending-activation-banner';
    banner.style.cssText = 'background:linear-gradient(135deg,#FFFBEB,#FFF7ED);border:1.5px solid #FCD34D;border-radius:14px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:flex-start;gap:16px;box-shadow:0 4px 16px rgba(245,158,11,.1)';
    banner.innerHTML =
      '<div style="font-size:2.2rem;flex-shrink:0;line-height:1">⏳</div>' +
      '<div>' +
        '<h3 style="margin:0 0 6px;color:#92400E;font-size:1rem">Content Activation In Progress</h3>' +
        '<p style="margin:0 0 10px;color:#78350F;font-size:.9rem">Your enrollment is confirmed and payment received. ' +
        'Your internship content, curriculum, and study materials will be live within <strong>2–6 hours</strong>.</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">' +
          '<span style="font-size:.8rem;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:99px;padding:3px 10px;font-weight:600">📋 Enrollment Confirmed</span>' +
          '<span style="font-size:.8rem;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:99px;padding:3px 10px;font-weight:600">⚙️ Content Being Prepared</span>' +
          '<span style="font-size:.8rem;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:99px;padding:3px 10px;font-weight:600">📧 Confirmation Sent</span>' +
        '</div>' +
        '<p style="margin:0;font-size:.82rem;color:#92400E">Need help? <a href="mailto:xyv@yuvantara.com" style="color:#1D4ED8;font-weight:600">xyv@yuvantara.com</a> · <a href="tel:+919876543210" style="color:#1D4ED8;font-weight:600">+91 98765 43210</a></p>' +
      '</div>';

    var portalNav = document.querySelector('.portal-nav-bar');
    if (portalNav) portalNav.parentNode.insertBefore(banner, portalNav);
  }

  // ── Show payment reference if paid ──
  function renderPaymentInfo(user) {
    var old = document.getElementById('payment-ref-bar');
    if (old) old.remove();
    if (!user.paymentRef) return;

    var bar = document.createElement('div');
    bar.id = 'payment-ref-bar';
    bar.style.cssText = 'background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.82rem;color:#1E40AF;display:flex;flex-wrap:wrap;gap:12px;align-items:center';
    bar.innerHTML =
      '<span>💳 <strong>Payment Ref:</strong> ' + escapeHtml(user.paymentRef) + '</span>' +
      '<span>📅 <strong>Date:</strong> ' + escapeHtml(user.paidAt || '—') + '</span>' +
      '<span>💰 <strong>Amount:</strong> ₹' + (user.paymentAmount || 236) + '</span>' +
      (user.paymentMethod ? '<span>🏦 <strong>Method:</strong> ' + escapeHtml(user.paymentMethod) + '</span>' : '');

    var portalNav = document.querySelector('.portal-nav-bar');
    if (portalNav) portalNav.parentNode.insertBefore(bar, portalNav.nextSibling);
  }

  // ── Modules List ──
  function renderModulesList(modules, isPending) {
    var container = document.getElementById('stu-module-list');
    if (!container) return;

    if (isPending) {
      container.innerHTML =
        '<div style="text-align:center;padding:36px 20px;color:#92400E;background:#FFFBEB;border-radius:12px;border:1.5px dashed #FCD34D">' +
        '<div style="font-size:2rem;margin-bottom:10px">⏳</div>' +
        '<strong style="display:block;font-size:1rem;margin-bottom:6px">Your modules are being prepared</strong>' +
        '<span style="font-size:.88rem;color:#78350F">Content will be available within 2–6 hours of enrollment. You\'ll receive access automatically.</span>' +
        '</div>';
      return;
    }

    if (!modules || modules.length === 0) {
      modules = [
        { name: 'Module 1: Orientation & Core Foundations', status: 'pending' },
        { name: 'Module 2: Lab Setup & Environment Diagnostics', status: 'pending' },
        { name: 'Module 3: Hands-on Case Studies & Practical Labs', status: 'pending' },
        { name: 'Module 4: Mid-Term Evaluation & Milestone Submission', status: 'pending' },
        { name: 'Module 5: Capstone Project & Certification', status: 'pending' }
      ];
    }

    var html = '';
    modules.forEach(function(m, idx) {
      var badgeClass = 'badge-wait', badgeLabel = 'Pending', icon = '⏳';
      if (m.status === 'completed') { badgeClass = 'badge-done'; badgeLabel = 'Completed'; icon = '✅'; }
      else if (m.status === 'in-progress') { badgeClass = 'badge-active'; badgeLabel = 'In Progress'; icon = '⚡'; }

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

  // ── Certificate Section ──
  function renderCertificateSection(user, isPending) {
    var certWrap = document.getElementById('cert-official-wrap');
    var emptyWrap = document.getElementById('cert-empty-wrap');
    var uploadedPreview = document.getElementById('uploaded-cert-preview');

    var cert = user.certificate;

    if (isPending) {
      // Account not yet activated — no cert content yet
      if (certWrap) certWrap.style.display = 'none';
      if (emptyWrap) {
        emptyWrap.style.display = 'block';
        emptyWrap.innerHTML =
          '<div style="font-size:3rem;margin-bottom:12px">⏳</div>' +
          '<h3 style="color:#92400E;margin:0 0 10px">Awaiting Content Activation</h3>' +
          '<p style="color:#374151;max-width:460px;margin:0 auto">Your certificate section will be accessible once your account is activated (within 2–6 hours).</p>';
      }
      if (uploadedPreview) uploadedPreview.style.display = 'none';
      return;
    }

    if (cert && cert.id && cert.status !== 'revoked') {
      // Official cert issued
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
      if (verifyLink) verifyLink.href = '../verify-certificate/index.html?id=' + encodeURIComponent(cert.id);

    } else if (cert && cert.status === 'revoked') {
      // Revoked by admin
      if (certWrap) certWrap.style.display = 'none';
      if (emptyWrap) {
        emptyWrap.style.display = 'block';
        emptyWrap.innerHTML =
          '<div style="font-size:3.5rem;margin-bottom:12px">🚫</div>' +
          '<h3 style="color:#DC2626;margin:0 0 10px">Certificate Revoked</h3>' +
          '<p style="color:#374151;max-width:480px;margin:0 auto 16px">Your official Yuvantara Certificate has been revoked' +
          (cert.revokedAt ? ' on <strong>' + cert.revokedAt + '</strong>' : '') +
          '. Please contact your program coordinator for further details or to appeal.</p>' +
          '<div style="display:inline-flex;align-items:center;gap:8px;background:#FEE2E2;color:#DC2626;border:1.5px solid #FECACA;border-radius:10px;padding:10px 20px;font-weight:600;font-size:.95rem">' +
          '❌ Certificate No Longer Valid</div>' +
          '<div style="margin-top:16px"><a href="mailto:xyv@yuvantara.com" style="color:#1D4ED8;font-weight:600;text-decoration:underline">📧 xyv@yuvantara.com</a></div>';
      }

    } else if (typeof user.progress === 'number' && user.progress >= 100) {
      // 100% complete — awaiting admin issuance
      if (certWrap) certWrap.style.display = 'none';
      if (emptyWrap) {
        emptyWrap.style.display = 'block';
        emptyWrap.innerHTML =
          '<div style="font-size:3.5rem;margin-bottom:12px">🎓</div>' +
          '<h3 style="color:#15803D;margin:0 0 10px">Congratulations! Curriculum 100% Complete</h3>' +
          '<p style="color:#374151;max-width:480px;margin:0 auto 16px">You have completed all program milestones. Your certificate is being reviewed and will be issued by your coordinator shortly.</p>' +
          '<div style="display:inline-flex;align-items:center;gap:8px;background:#DCFCE7;color:#15803D;border:1.5px solid #86EFAC;border-radius:10px;padding:10px 20px;font-weight:600;font-size:.95rem">' +
          '⏳ Awaiting Admin Issuance</div>';
      }

    } else {
      // Not yet completed
      if (certWrap) certWrap.style.display = 'none';
      if (emptyWrap) emptyWrap.style.display = 'block';
    }

    // Uploaded certificate doc
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

  // ── Portal Tab Events ──
  function bindPortalEvents() {
    var tabs = document.querySelectorAll('.portal-tab-btn[data-tab]');
    tabs.forEach(function(tabBtn) {
      tabBtn.addEventListener('click', function() {
        var target = tabBtn.dataset.tab;
        tabs.forEach(function(b) { b.classList.remove('active'); });
        tabBtn.classList.add('active');
        document.querySelectorAll('.portal-pane').forEach(function(pane) { pane.classList.remove('active'); });
        var activePane = document.getElementById('pane-' + target);
        if (activePane) activePane.classList.add('active');
      });
    });

    // Logout
    ['btn-portal-logout', 'btn-quick-logout'].forEach(function(id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', function() {
        if (confirm('Are you sure you want to sign out of your Student Portal?')) {
          YuvantaraDB.logout();
          window.location.reload();
        }
      });
    });

    // Print certificate
    ['btn-print-certificate', 'btn-print-certificate-2'].forEach(function(id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', function() { window.print(); });
    });

    // Certificate file upload
    var fileInput = document.getElementById('cert-file-input');
    var browseBtn = document.getElementById('btn-browse-file');
    var selectedName = document.getElementById('selected-filename');
    var uploadAlert = document.getElementById('upload-alert');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        if (!fileInput.files || !fileInput.files.length) return;
        var file = fileInput.files[0];
        if (selectedName) selectedName.textContent = file.name;

        var reader = new FileReader();
        reader.onload = function(e) {
          var uploadedDoc = {
            name: file.name,
            uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dataUrl: e.target.result
          };
          YuvantaraDB.updateStudent(currentUser.email, { uploadedCertificate: uploadedDoc });
          if (uploadAlert) {
            uploadAlert.className = 'alert-box success';
            uploadAlert.textContent = 'Certificate "' + file.name + '" uploaded successfully!';
            uploadAlert.style.display = 'block';
          }
          renderStudentData();
        };
        reader.readAsDataURL(file);
      });
    }

    var removeUploadedBtn = document.getElementById('btn-remove-uploaded');
    if (removeUploadedBtn) {
      removeUploadedBtn.addEventListener('click', function() {
        if (confirm('Remove your uploaded certificate document?')) {
          YuvantaraDB.updateStudent(currentUser.email, { uploadedCertificate: null });
          if (uploadAlert) {
            uploadAlert.className = 'alert-box success';
            uploadAlert.textContent = 'Uploaded certificate removed.';
            uploadAlert.style.display = 'block';
          }
          if (selectedName) selectedName.textContent = '';
          renderStudentData();
        }
      });
    }

    // Edit Profile — track is locked, do NOT include it in updates
    var formProfile = document.getElementById('form-profile');
    var profileAlert = document.getElementById('profile-alert');
    if (formProfile) {
      formProfile.addEventListener('submit', function(e) {
        e.preventDefault();
        // track field is readonly — never send it as an update
        var updates = {
          name: document.getElementById('p-name').value.trim(),
          phone: document.getElementById('p-phone').value.trim(),
          stream: document.getElementById('p-stream').value.trim(),
          college: document.getElementById('p-college').value.trim()
          // track: intentionally excluded — locked at enrollment
        };

        var res = YuvantaraDB.updateStudent(currentUser.email, updates);
        if (res.success) {
          if (profileAlert) {
            profileAlert.className = 'alert-box success';
            profileAlert.textContent = 'Profile information saved successfully.';
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

    // Change Password
    var formPassword = document.getElementById('form-password');
    var passAlert = document.getElementById('pass-alert');
    if (formPassword) {
      formPassword.addEventListener('submit', function(e) {
        e.preventDefault();
        var cur = document.getElementById('pwd-current').value;
        var pnew = document.getElementById('pwd-new').value;
        var pconf = document.getElementById('pwd-confirm').value;

        if (pnew.length < 8) {
          if (passAlert) { passAlert.className = 'alert-box error'; passAlert.textContent = 'New password must be at least 8 characters.'; passAlert.style.display = 'block'; }
          return;
        }
        if (pnew !== pconf) {
          if (passAlert) { passAlert.className = 'alert-box error'; passAlert.textContent = 'New password and confirmation do not match.'; passAlert.style.display = 'block'; }
          return;
        }

        var res = YuvantaraDB.changePassword(currentUser.email, cur, pnew);
        if (res.success) {
          if (passAlert) { passAlert.className = 'alert-box success'; passAlert.textContent = 'Password updated successfully!'; passAlert.style.display = 'block'; }
          formPassword.reset();
        } else {
          if (passAlert) { passAlert.className = 'alert-box error'; passAlert.textContent = res.message || 'Error updating password.'; passAlert.style.display = 'block'; }
        }
      });
    }
  }

  // ── Gate Login Events ──
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
  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text || ''; }
  function setVal(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; }
  function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortal);
  } else {
    initPortal();
  }
})();
