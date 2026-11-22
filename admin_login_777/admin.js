// Yuvantara Admin Command Center Controller
(function() {
  'use strict';

  var currentAdmin = null;

  function initAdmin() {
    currentAdmin = window.YuvantaraDB ? YuvantaraDB.getCurrentUser() : null;

    var loginView = document.getElementById('admin-login-view');
    var dashView = document.getElementById('admin-dashboard-view');

    if (!currentAdmin || currentAdmin.role !== 'admin') {
      if (dashView) dashView.style.display = 'none';
      if (loginView) loginView.style.display = 'block';
      bindLoginEvents();
      return;
    }

    if (loginView) loginView.style.display = 'none';
    if (dashView) dashView.style.display = 'block';

    renderAdminDashboard();
    bindAdminEvents();
  }

  // ── Render All Sections ──
  function renderAdminDashboard() {
    var students = YuvantaraDB.getStudents();
    var apps = YuvantaraDB.getApplications();

    var pendingApps = apps.filter(function(a) { return a.status === 'pending'; });
    var issuedCerts = students.filter(function(s) { return s.certificate && s.certificate.id; });

    // Update KPIs
    setText('kpi-students', students.length);
    setText('kpi-apps', pendingApps.length);
    setText('kpi-certs', issuedCerts.length);
    setText('tab-cnt-students', students.length);
    setText('tab-cnt-apps', apps.length);
    setText('tab-cnt-certs', issuedCerts.length);

    // Render Tables
    renderStudentsTable(students);
    renderApplicationsTable(apps);
    renderCertificatesTable(issuedCerts);
    renderJsonViewer();
  }

  // ── Render Students Table ──
  function renderStudentsTable(students) {
    var tbody = document.getElementById('admin-students-tbody');
    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748B">No enrolled students found. Use "Enroll New Student" to add candidates.</td></tr>';
      return;
    }

    var html = '';
    students.forEach(function(s) {
      var pct = typeof s.progress === 'number' ? s.progress : 0;
      var hasCert = s.certificate && s.certificate.id;
      var certBadge = hasCert
        ? '<span class="module-status-badge badge-done" style="font-size:.75rem">Issued: ' + escapeHtml(s.certificate.id) + '</span>'
        : '<span class="module-status-badge badge-wait" style="font-size:.75rem">Not Issued</span>';

      html += '<tr>' +
        '<td><strong style="font-family:monospace;color:#1E293B">' + escapeHtml(s.id || 'USR') + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:700;color:#0F172A">' + escapeHtml(s.name) + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(s.email) + ' • ' + escapeHtml(s.phone || '') + '</div>' +
        '</td>' +
        '<td>' +
          '<div style="color:#0F172A;font-weight:600">' + escapeHtml(s.college || '—') + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(s.stream || '—') + '</div>' +
        '</td>' +
        '<td><span class="badge-track" style="font-size:.78rem">' + escapeHtml(s.track || 'General Track') + '</span></td>' +
        '<td style="min-width:140px">' +
          '<div style="display:flex;justify-content:space-between;font-size:.8rem;font-weight:700;margin-bottom:3px">' +
            '<span>' + pct + '%</span>' +
          '</div>' +
          '<div class="progress-bar-bg" style="height:6px"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</td>' +
        '<td>' + certBadge + '</td>' +
        '<td style="text-align:right">' +
          '<div class="action-btns" style="justify-content:flex-end">' +
            '<button class="btn-sm-action primary" data-act="prog" data-email="' + escapeHtml(s.email) + '" title="Edit Progress & Modules">⚡ Progress</button>' +
            '<button class="btn-sm-action" data-act="cert" data-email="' + escapeHtml(s.email) + '" title="Issue / Manage Certificate">🎓 Certificate</button>' +
            '<button class="btn-sm-action danger" data-act="del-stu" data-email="' + escapeHtml(s.email) + '" title="Delete Student Record">🗑️</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Applications Table ──
  function renderApplicationsTable(apps) {
    var tbody = document.getElementById('admin-apps-tbody');
    if (!tbody) return;

    if (!apps || apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#64748B">No submitted applications in queue.</td></tr>';
      return;
    }

    var html = '';
    apps.forEach(function(a) {
      var statusBadge = '';
      var rowStyle = '';

      if (a.status === 'approved') {
        statusBadge = '<span class="module-status-badge badge-done" style="font-size:.8rem">✅ Approved</span>';
        rowStyle = 'background:linear-gradient(90deg,#F0FDF4 0%,#fff 100%);border-left:4px solid #22C55E';
      } else if (a.status === 'rejected') {
        statusBadge = '<span class="module-status-badge" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-size:.8rem">❌ Rejected</span>';
        rowStyle = 'background:linear-gradient(90deg,#FFF5F5 0%,#fff 100%);border-left:4px solid #EF4444;opacity:.85';
      } else {
        statusBadge = '<span class="module-status-badge" style="background:#FEF3C7;color:#D97706;border:1px solid #FDE68A;font-size:.8rem">⏳ Pending</span>';
        rowStyle = '';
      }

      var actionHtml = '';
      if (a.status === 'approved') {
        actionHtml = '<span style="font-size:.82rem;color:#15803D;font-weight:600;padding:6px 12px;background:#DCFCE7;border-radius:6px;display:inline-block">✅ Enrolled</span>';
      } else if (a.status === 'rejected') {
        actionHtml = '<span style="font-size:.82rem;color:#DC2626;font-weight:600;padding:6px 12px;background:#FEE2E2;border-radius:6px;display:inline-block">❌ Rejected</span>';
      } else {
        actionHtml =
          '<button class="btn-sm-action primary" data-act="approve-app" data-appid="' + escapeHtml(a.id) + '" title="Approve and enroll this student">✅ Approve</button> ' +
          '<button class="btn-sm-action danger" data-act="reject-app" data-appid="' + escapeHtml(a.id) + '" title="Reject this application">❌ Reject</button>';
      }

      html += '<tr style="' + rowStyle + '">' +
        '<td><code style="color:#0F172A;font-weight:700">' + escapeHtml(a.id) + '</code></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(a.name) + '</strong></td>' +
        '<td><div>' + escapeHtml(a.email) + '</div><div style="font-size:.82rem;color:#64748B">' + escapeHtml(a.phone || '') + '</div></td>' +
        '<td><span class="badge-track" style="font-size:.78rem">' + escapeHtml(a.track || 'Track') + '</span></td>' +
        '<td><div>' + escapeHtml(a.college || '—') + '</div><small style="color:#64748B">' + escapeHtml(a.stream || '') + '</small></td>' +
        '<td><span style="font-size:.85rem;color:#64748B">' + escapeHtml(a.appliedAt || 'Recent') + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="text-align:right">' + actionHtml + '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Certificates Table ──
  function renderCertificatesTable(issuedCerts) {
    var tbody = document.getElementById('admin-certs-tbody');
    if (!tbody) return;

    if (!issuedCerts || issuedCerts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748B">No certificates issued yet. Open "Registered Students" and click "Certificate" on any candidate.</td></tr>';
      return;
    }

    var html = '';
    issuedCerts.forEach(function(s) {
      var cert = s.certificate;
      html += '<tr>' +
        '<td><strong style="font-family:monospace;color:#1D4ED8;font-size:1.05rem">' + escapeHtml(cert.id) + '</strong></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(s.name) + '</strong><br><small style="color:#64748B">' + escapeHtml(s.college || '') + '</small></td>' +
        '<td>' + escapeHtml(cert.title || s.track) + '</td>' +
        '<td>' + escapeHtml(cert.issueDate || '—') + '</td>' +
        '<td><span style="color:#047857;font-weight:700">' + escapeHtml(cert.grade || 'Passed') + '</span></td>' +
        '<td><span class="module-status-badge badge-done">' + escapeHtml(cert.status || 'Verified') + '</span></td>' +
        '<td style="text-align:right">' +
          '<div class="action-btns" style="justify-content:flex-end">' +
            '<a class="btn-sm-action primary" href="../verify-certificate/index.html?id=' + encodeURIComponent(cert.id) + '" target="_blank">🔍 Verify</a>' +
            '<button class="btn-sm-action danger" data-act="revoke-cert" data-email="' + escapeHtml(s.email) + '">Revoke</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  function renderJsonViewer() {
    var viewer = document.getElementById('raw-json-viewer');
    if (!viewer) return;
    var state = {
      system: 'Yuvantara Enterprise Management DB',
      exportedAt: new Date().toISOString(),
      students: YuvantaraDB.getStudents(),
      applications: YuvantaraDB.getApplications()
    };
    viewer.textContent = JSON.stringify(state, null, 2);
  }

  // ── Bind Admin Navigation & Actions ──
  function bindAdminEvents() {
    // Tabs switching
    var navTabs = document.querySelectorAll('.portal-tab-btn[data-admin-tab]');
    navTabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tabKey = btn.dataset.adminTab;
        navTabs.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        document.querySelectorAll('#admin-dashboard-view .portal-pane').forEach(function(pane) {
          pane.classList.remove('active');
        });
        var targetPane = document.getElementById('pane-' + tabKey);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Admin Logout
    var logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to log out of the Admin Command Center?')) {
          YuvantaraDB.logout();
          window.location.reload();
        }
      });
    }

    // Export Backup JSON
    var exportBtns = [
      document.getElementById('btn-export-backup'),
      document.getElementById('btn-download-json')
    ];
    exportBtns.forEach(function(btn) {
      if (btn) {
        btn.addEventListener('click', function() {
          var state = {
            system: 'Yuvantara Database Backup',
            exportedAt: new Date().toISOString(),
            users: YuvantaraDB.getUsers(),
            applications: YuvantaraDB.getApplications()
          };
          var jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
          var a = document.createElement('a');
          a.href = jsonStr;
          a.download = "yuvantara_backup_" + new Date().toISOString().slice(0,10) + ".json";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      }
    });

    // Restore Backup JSON
    var restoreBtn = document.getElementById('btn-restore-json');
    var restoreInput = document.getElementById('json-restore-input');
    if (restoreBtn && restoreInput) {
      restoreBtn.addEventListener('click', function() { restoreInput.click(); });
      restoreInput.addEventListener('change', function() {
        if (!restoreInput.files || restoreInput.files.length === 0) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var data = JSON.parse(e.target.result);
            if (data.users && data.applications) {
              localStorage.setItem('yuvantara_users_db', JSON.stringify(data.users));
              localStorage.setItem('yuvantara_apps_db', JSON.stringify(data.applications));
              alert('System database restored successfully!');
              renderAdminDashboard();
            } else {
              alert('Invalid backup file format.');
            }
          } catch (err) {
            alert('Error parsing JSON backup: ' + err.message);
          }
        };
        reader.readAsText(restoreInput.files[0]);
      });
    }

    // Reset Demo Data
    var resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('Reset all records to initial factory demo seed? Any newly created users will be cleared.')) {
          YuvantaraDB.resetToDemoData();
          // Keep admin logged in for convenience
          var adminUser = YuvantaraDB.getUserByEmail('admin@yuvantara.com');
          if (adminUser) YuvantaraDB.setCurrentUser(adminUser);
          alert('Database reset to default seed successfully!');
          renderAdminDashboard();
        }
      });
    }

    // Table delegated actions
    document.addEventListener('click', function(e) {
      var actBtn = e.target.closest('[data-act]');
      if (!actBtn) return;
      var act = actBtn.dataset.act;

      // 1. Edit Progress
      if (act === 'prog') {
        var email = actBtn.dataset.email;
        openProgressModal(email);
      }

      // 2. Manage / Issue Certificate
      if (act === 'cert') {
        var email = actBtn.dataset.email;
        openCertModal(email);
      }

      // 3. Delete Student
      if (act === 'del-stu') {
        var email = actBtn.dataset.email;
        if (confirm('Permanently delete student record for "' + email + '"?')) {
          YuvantaraDB.deleteStudent(email);
          renderAdminDashboard();
        }
      }

      // 4. Approve Application
      if (act === 'approve-app') {
        var appId = actBtn.dataset.appid;
        var app = YuvantaraDB.getApplications().find(function(a) { return a.id === appId; });
        if (app) {
          // Register as student
          var regRes = YuvantaraDB.registerStudent({
            name: app.name,
            email: app.email,
            phone: app.phone,
            password: 'student123',
            track: app.track,
            college: app.college,
            stream: app.stream
          });
          YuvantaraDB.updateApplicationStatus(appId, 'approved');
          alert('Application approved! Student account activated for ' + app.name + ' (Password: student123).');
          renderAdminDashboard();
        }
      }

      // 5. Reject Application
      if (act === 'reject-app') {
        var appId = actBtn.dataset.appid;
        if (confirm('Mark application ' + appId + ' as rejected?')) {
          YuvantaraDB.updateApplicationStatus(appId, 'rejected');
          renderAdminDashboard();
        }
      }

      // 6. Revoke Certificate
      if (act === 'revoke-cert') {
        var email = actBtn.dataset.email;
        if (confirm('Revoke official certificate for student "' + email + '"?')) {
          YuvantaraDB.updateStudent(email, { certificate: null });
          alert('Certificate revoked.');
          renderAdminDashboard();
        }
      }
    });

    // Close modals
    document.querySelectorAll('[data-close-modal]').forEach(function(b) {
      b.addEventListener('click', function() {
        closeAllModals();
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(function(o) {
      o.addEventListener('click', closeAllModals);
    });

    // Enroll New Student Modal
    var addStuBtn = document.getElementById('btn-add-student-modal');
    if (addStuBtn) {
      addStuBtn.addEventListener('click', function() {
        openModal('enroll');
      });
    }

    var enrollForm = document.getElementById('form-enroll-student');
    if (enrollForm) {
      enrollForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = {
          name: document.getElementById('new-stu-name').value.trim(),
          email: document.getElementById('new-stu-email').value.trim(),
          phone: document.getElementById('new-stu-phone').value.trim(),
          password: document.getElementById('new-stu-pass').value.trim(),
          track: document.getElementById('new-stu-track').value,
          college: document.getElementById('new-stu-college').value.trim(),
          stream: document.getElementById('new-stu-stream').value.trim()
        };

        var res = YuvantaraDB.registerStudent(data);
        if (res.success) {
          alert('Student ' + data.name + ' enrolled successfully!');
          enrollForm.reset();
          closeAllModals();
          renderAdminDashboard();
        } else {
          alert(res.message || 'Error enrolling student.');
        }
      });
    }

    // Save Progress Form
    var progForm = document.getElementById('form-edit-progress');
    var progRange = document.getElementById('prog-range-input');
    var progVal = document.getElementById('prog-range-val');
    if (progRange && progVal) {
      progRange.addEventListener('input', function() {
        progVal.textContent = progRange.value + '%';
      });
    }

    if (progForm) {
      progForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('prog-stu-email').value;
        var pct = parseInt(progRange.value);

        // Collect modules status
        var modCheckboxes = document.querySelectorAll('.prog-mod-check');
        var modules = [];
        modCheckboxes.forEach(function(cb) {
          var name = cb.dataset.modname;
          var status = cb.checked ? 'completed' : 'pending';
          modules.push({ name: name, status: status });
        });

        YuvantaraDB.updateStudent(email, {
          progress: pct,
          modules: modules
        });

        alert('Student progress updated to ' + pct + '%!');
        closeAllModals();
        renderAdminDashboard();
      });
    }

    // Save Certificate Form
    var certForm = document.getElementById('form-issue-cert');
    if (certForm) {
      certForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('cert-stu-email').value;
        var fileInput = document.getElementById('cert-custom-file');

        var certData = {
          id: document.getElementById('cert-input-id').value.trim(),
          title: document.getElementById('cert-input-title').value.trim(),
          duration: document.getElementById('cert-input-duration').value.trim(),
          grade: document.getElementById('cert-input-grade').value.trim(),
          issueDate: document.getElementById('cert-input-date').value.trim(),
          authority: document.getElementById('cert-input-authority').value.trim(),
          status: 'Valid & Verified'
        };

        function commitCert(fileDataUrl) {
          if (fileDataUrl) certData.fileUrl = fileDataUrl;
          var res = YuvantaraDB.assignCertificate(email, certData);
          if (res.success) {
            alert('Certificate ' + certData.id + ' successfully issued to student!');
            closeAllModals();
            renderAdminDashboard();
          } else {
            alert(res.message || 'Error issuing certificate.');
          }
        }

        if (fileInput && fileInput.files && fileInput.files[0]) {
          var reader = new FileReader();
          reader.onload = function(ev) {
            commitCert(ev.target.result);
          };
          reader.readAsDataURL(fileInput.files[0]);
        } else {
          commitCert('');
        }
      });
    }
  }

  // ── Modal Helpers ──
  function openProgressModal(email) {
    var student = YuvantaraDB.getUserByEmail(email);
    if (!student) return;

    setVal('prog-stu-email', student.email);
    setVal('prog-stu-name', student.name + ' (' + student.email + ')');
    var pct = typeof student.progress === 'number' ? student.progress : 75;
    setVal('prog-range-input', pct);
    setText('prog-range-val', pct + '%');

    var modules = student.modules || [
      { name: 'Module 1: Orientation & Core Foundations', status: 'completed' },
      { name: 'Module 2: Lab Setup & Environment Diagnostics', status: 'completed' },
      { name: 'Module 3: Hands-on Case Studies & Practical Labs', status: 'completed' },
      { name: 'Module 4: Incident Response & Threat Hunting', status: 'in-progress' },
      { name: 'Module 5: Capstone Enterprise Defense Project', status: 'pending' }
    ];

    var container = document.getElementById('prog-modules-container');
    if (container) {
      var html = '';
      modules.forEach(function(m, idx) {
        var isDone = m.status === 'completed';
        html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;font-size:.88rem;cursor:pointer">' +
          '<input type="checkbox" class="prog-mod-check" data-modname="' + escapeHtml(m.name) + '" ' + (isDone ? 'checked' : '') + ' style="width:18px;height:18px">' +
          '<span>' + escapeHtml(m.name) + '</span>' +
        '</label>';
      });
      container.innerHTML = html;
    }

    openModal('progress');
  }

  function openCertModal(email) {
    var student = YuvantaraDB.getUserByEmail(email);
    if (!student) return;

    setVal('cert-stu-email', student.email);
    setVal('cert-stu-name', student.name + ' — ' + (student.track || 'Track'));

    var cert = student.certificate || {};
    var defaultId = cert.id || ('YUV-2026-' + (student.track ? student.track.slice(0,2).toUpperCase() : 'IN') + Math.floor(100 + Math.random() * 900));
    var defaultTitle = cert.title || ((student.track || 'Industrial') + ' Internship');

    setVal('cert-input-id', defaultId);
    setVal('cert-input-title', defaultTitle);
    setVal('cert-input-duration', cert.duration || '6 Months (Jan 2026 – Jun 2026)');
    setVal('cert-input-grade', cert.grade || 'Grade A+ (Distinction)');
    setVal('cert-input-date', cert.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setVal('cert-input-authority', cert.authority || 'Yuvantara Cyber Defense Council');

    openModal('cert');
  }

  function openModal(name) {
    closeAllModals();
    var modal = document.getElementById('modal-' + name);
    var overlay = document.getElementById('modal-' + name + '-overlay');
    if (modal) modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-box').forEach(function(m) { m.classList.remove('open'); });
    document.querySelectorAll('.modal-overlay').forEach(function(o) { o.classList.remove('open'); });
  }

  // ── Bind Admin Login Events ──
  function bindLoginEvents() {
    var form = document.getElementById('admin-login-form');
    var alertBox = document.getElementById('admin-gate-alert');
    var fillDemo = document.getElementById('fill-admin-demo');

    if (fillDemo) {
      fillDemo.addEventListener('click', function(e) {
        e.preventDefault();
        setVal('adm-email', 'admin@yuvantara.com');
        setVal('adm-pass', 'admin777');
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('adm-email').value;
        var pass = document.getElementById('adm-pass').value;

        var res = YuvantaraDB.login(email, pass);
        if (res.success && res.user.role === 'admin') {
          initAdmin();
        } else {
          if (alertBox) {
            alertBox.className = 'alert-box error';
            alertBox.textContent = 'Invalid administrator credentials or unauthorized role.';
            alertBox.style.display = 'block';
          }
        }
      });
    }
  }

  // ── Helpers ──
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text !== undefined && text !== null ? text : '';
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();