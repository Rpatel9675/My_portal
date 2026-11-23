// Yuvantara Admin Command Center Controller
// Production Role-Based Access: Super Admin (a4dr_00@supper) & 6 Administrators
// Implements Immutable Action Ownership Locking & System Audit Logging
(function() {
  'use strict';

  var currentAdmin = null;

  var studentFilterState = {
    timeframe: 'all',
    from: '',
    to: '',
    track: 'all',
    status: 'all',
    search: ''
  };

  var auditFilterState = {
    admin: 'all',
    action: 'all',
    search: ''
  };

  function applyStudentFilters(students) {
    if (!students) return [];
    var now = new Date();
    var todayStr = now.toISOString().substring(0, 10);

    return students.filter(function(s) {
      // 1. Timeframe
      if (studentFilterState.timeframe !== 'all') {
        var stuDateStr = s.registeredAt || s.paidAt || (s.certificate && s.certificate.date) || '';
        var stuDate = stuDateStr ? new Date(stuDateStr) : null;

        if (studentFilterState.timeframe === 'today') {
          if (!stuDateStr || stuDateStr.substring(0, 10) !== todayStr) return false;
        } else if (studentFilterState.timeframe === '7days') {
          if (!stuDate) return false;
          var diff7 = (now - stuDate) / (1000 * 60 * 60 * 24);
          if (diff7 < 0 || diff7 > 7) return false;
        } else if (studentFilterState.timeframe === '30days') {
          if (!stuDate) return false;
          var diff30 = (now - stuDate) / (1000 * 60 * 60 * 24);
          if (diff30 < 0 || diff30 > 30) return false;
        } else if (studentFilterState.timeframe === 'this_month') {
          if (!stuDate) return false;
          if (stuDate.getMonth() !== now.getMonth() || stuDate.getFullYear() !== now.getFullYear()) return false;
        } else if (studentFilterState.timeframe === 'custom') {
          if (studentFilterState.from) {
            var fDate = new Date(studentFilterState.from);
            if (!stuDate || stuDate < fDate) return false;
          }
          if (studentFilterState.to) {
            var tDate = new Date(studentFilterState.to + 'T23:59:59');
            if (!stuDate || stuDate > tDate) return false;
          }
        }
      }

      // 2. Track
      if (studentFilterState.track !== 'all') {
        if ((s.track || '') !== studentFilterState.track) return false;
      }

      // 3. Status
      if (studentFilterState.status !== 'all') {
        if (studentFilterState.status === 'active' && s.accountStatus === 'pending') return false;
        if (studentFilterState.status === 'pending' && s.accountStatus !== 'pending') return false;
        if (studentFilterState.status === 'certified' && (!s.certificate || !s.certificate.id || s.certificate.status === 'revoked')) return false;
        if (studentFilterState.status === 'revoked' && (!s.certificate || s.certificate.status !== 'revoked')) return false;
      }

      // 4. Search
      if (studentFilterState.search) {
        var q = studentFilterState.search.toLowerCase().trim();
        var match = (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
                    (s.email && s.email.toLowerCase().indexOf(q) !== -1) ||
                    (s.phone && s.phone.toLowerCase().indexOf(q) !== -1) ||
                    (s.college && s.college.toLowerCase().indexOf(q) !== -1) ||
                    (s.id && s.id.toLowerCase().indexOf(q) !== -1) ||
                    (s.track && s.track.toLowerCase().indexOf(q) !== -1) ||
                    (s.enrolledByAdmin && s.enrolledByAdmin.toLowerCase().indexOf(q) !== -1);
        if (!match) return false;
      }

      return true;
    });
  }

  function applyAuditFilters(logs) {
    if (!logs) return [];
    return logs.filter(function(l) {
      // 1. Admin
      if (auditFilterState.admin !== 'all') {
        if (l.adminEmail !== auditFilterState.admin) return false;
      }

      // 2. Action
      if (auditFilterState.action !== 'all') {
        if (l.actionType.indexOf(auditFilterState.action) === -1) return false;
      }

      // 3. Search
      if (auditFilterState.search) {
        var q = auditFilterState.search.toLowerCase().trim();
        var targetInfo = '';
        if (l.targetUser) {
          targetInfo = (l.targetUser.name || '') + ' ' + (l.targetUser.email || '') + ' ' + (l.targetUser.track || '');
        }
        var match = (l.adminEmail && l.adminEmail.toLowerCase().indexOf(q) !== -1) ||
                    (l.actionType && l.actionType.toLowerCase().indexOf(q) !== -1) ||
                    (l.targetId && l.targetId.toLowerCase().indexOf(q) !== -1) ||
                    (l.details && l.details.toLowerCase().indexOf(q) !== -1) ||
                    (targetInfo.toLowerCase().indexOf(q) !== -1);
        if (!match) return false;
      }

      return true;
    });
  }

  function initAdmin() {
    currentAdmin = window.YuvantaraDB ? YuvantaraDB.getCurrentUser() : null;

    var loginView = document.getElementById('admin-login-view');
    var dashView = document.getElementById('admin-dashboard-view');

    // Allow both 'admin' and 'superadmin'
    if (!currentAdmin || (currentAdmin.role !== 'admin' && currentAdmin.role !== 'superadmin')) {
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
    var auditLogs = YuvantaraDB.getAuditLogs();
    var admins = YuvantaraDB.getAdmins();

    var isSuper = (currentAdmin && (currentAdmin.role === 'superadmin' || currentAdmin.email === 'a4dr_00@supper'));

    var pendingApps = apps.filter(function(a) { return a.status === 'pending'; });
    var issuedCerts = students.filter(function(s) {
      return s.certificate && (s.certificate.id || s.certificate.status === 'revoked');
    });
    var pendingStudents = students.filter(function(s) { return s.accountStatus === 'pending'; });

    // Update KPIs
    setText('kpi-students', students.length);
    setText('kpi-apps', pendingApps.length);
    setText('kpi-certs', issuedCerts.length);
    setText('tab-cnt-students', students.length);
    setText('tab-cnt-apps', apps.length);
    setText('tab-cnt-certs', issuedCerts.length);
    setText('tab-cnt-audit', auditLogs.length);
    setText('tab-cnt-admins', admins.length);

    // Super Admin Tab Visibility
    var superTabBtn = document.getElementById('tab-btn-super-admins');
    if (superTabBtn) {
      superTabBtn.style.display = isSuper ? 'inline-flex' : 'none';
    }

    // Header badge adjustment
    var headerMeta = document.querySelector('.portal-user-meta');
    if (headerMeta) {
      if (isSuper) {
        headerMeta.innerHTML =
          '<h2>👑 Super Administrator Command</h2>' +
          '<p>' +
            '<span class="admin-badge" style="background:#DC2626;color:#fff">👑 Super Admin Clearance</span>' +
            '<span>🔑 Logged In: ' + escapeHtml(currentAdmin.email) + '</span>' +
            '<span>📍 Master Control (All 6 Admins Manageable)</span>' +
          '</p>';
      } else {
        headerMeta.innerHTML =
          '<h2>🛡️ Administrator Management Console</h2>' +
          '<p>' +
            '<span class="admin-badge">Admin Clearance</span>' +
            '<span>👤 Logged In: ' + escapeHtml(currentAdmin.email) + '</span>' +
            '<span>🔒 Actions Attributed &amp; Locked</span>' +
          '</p>';
      }
    }

    // Pending student counter badge
    var stuTabCnt = document.getElementById('tab-cnt-students');
    if (stuTabCnt && pendingStudents.length > 0) {
      stuTabCnt.textContent = students.length + ' (' + pendingStudents.length + ' pending)';
    }

    // Render Tables
    renderStudentsTable(students);
    renderApplicationsTable(apps);
    renderCertificatesTable(issuedCerts);
    renderAuditTable(auditLogs);
    if (isSuper) renderSuperAdminRosterTable(admins, auditLogs);
    renderJsonViewer();
  }

  // ── Render Students Table ──
  function renderStudentsTable(students) {
    var tbody = document.getElementById('admin-students-tbody');
    if (!tbody) return;

    var filtered = applyStudentFilters(students);

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#64748B">No enrolled students match current filter criteria.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function(s) {
      var pct = typeof s.progress === 'number' ? s.progress : 0;
      var hasCert = s.certificate && s.certificate.id && s.certificate.status !== 'revoked';
      var certRevoked = s.certificate && s.certificate.status === 'revoked';
      var certBadge = hasCert
        ? '<span class="module-status-badge badge-done" style="font-size:.75rem">✅ Issued: ' + escapeHtml(s.certificate.id) + '</span>'
        : certRevoked
          ? '<span class="module-status-badge" style="font-size:.75rem;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA">❌ Revoked</span>'
          : '<span class="module-status-badge badge-wait" style="font-size:.75rem">Not Issued</span>';

      var isPending = s.accountStatus === 'pending';
      var statusBadge = isPending
        ? '<span class="module-status-badge" style="font-size:.72rem;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;margin-left:6px">⏳ Pending</span>'
        : '<span class="module-status-badge badge-done" style="font-size:.72rem;margin-left:6px">✅ Active</span>';

      var activateBtn = isPending
        ? '<button class="btn-sm-action" style="background:#D1FAE5;color:#065F46;border:1px solid #6EE7B7" data-act="activate-stu" data-email="' + escapeHtml(s.email) + '" title="Activate content access for student">▶ Activate</button>'
        : '';

      var enrolledByHtml = s.enrolledByAdmin
        ? '<span class="badge-track" style="font-size:.75rem;background:#F1F5F9;color:#334155;border-color:#CBD5E1">👤 ' + escapeHtml(s.enrolledByAdmin) + '</span>'
        : '<span style="color:#94A3B8;font-size:.8rem">—</span>';

      html += '<tr' + (isPending ? ' style="background:#FFFBEB"' : '') + '>' +
        '<td><strong style="font-family:monospace;color:#1E293B">' + escapeHtml(s.id || 'USR') + '</strong>' + statusBadge + '</td>' +
        '<td>' +
          '<div style="font-weight:700;color:#0F172A">' + escapeHtml(s.name) + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(s.email) + ' • ' + escapeHtml(s.phone || '') + '</div>' +
          (s.paymentRef ? '<div style="font-size:.75rem;color:#3B82F6;margin-top:2px">💳 ' + escapeHtml(s.paymentRef) + '</div>' : '') +
        '</td>' +
        '<td>' +
          '<div style="color:#0F172A;font-weight:600">' + escapeHtml(s.college || '—') + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(s.stream || '—') + '</div>' +
        '</td>' +
        '<td><span class="badge-track" style="font-size:.78rem">' + escapeHtml(s.track || 'General Track') + '</span></td>' +
        '<td style="min-width:140px">' +
          '<div style="display:flex;justify-content:space-between;font-size:.8rem;font-weight:700;margin-bottom:3px">' +
            '<span>' + (isPending ? '—' : pct + '%') + '</span>' +
          '</div>' +
          '<div class="progress-bar-bg" style="height:6px"><div class="progress-bar-fill" style="width:' + (isPending ? 0 : pct) + '%"></div></div>' +
        '</td>' +
        '<td>' + certBadge + '</td>' +
        '<td>' + enrolledByHtml + '</td>' +
        '<td style="text-align:right">' +
          '<div class="action-btns" style="justify-content:flex-end">' +
            activateBtn +
            '<button class="btn-sm-action primary" data-act="prog" data-email="' + escapeHtml(s.email) + '" title="Edit Progress & Modules">⚡ Progress</button>' +
            '<button class="btn-sm-action" data-act="cert" data-email="' + escapeHtml(s.email) + '" title="Issue / Manage Certificate">🎓 Certificate</button>' +
            '<button class="btn-sm-action danger" data-act="del-stu" data-email="' + escapeHtml(s.email) + '" title="Delete Student Record">🗑️</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Applications Table with Locked Admin Attribution ──
  function renderApplicationsTable(apps) {
    var tbody = document.getElementById('admin-apps-tbody');
    if (!tbody) return;

    if (!apps || apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#64748B">No submitted applications in queue.</td></tr>';
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

      var lockedAdminHtml = a.lockedApprovedBy
        ? '<span class="badge-track" style="font-size:.75rem;background:#DCFCE7;color:#15803D;border-color:#86EFAC">🔒 ' + escapeHtml(a.lockedApprovedBy) + '</span>'
        : '<span style="color:#94A3B8;font-size:.8rem">Pending Review</span>';

      html += '<tr style="' + rowStyle + '">' +
        '<td><code style="color:#0F172A;font-weight:700">' + escapeHtml(a.id) + '</code></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(a.name) + '</strong></td>' +
        '<td><div>' + escapeHtml(a.email) + '</div><div style="font-size:.82rem;color:#64748B">' + escapeHtml(a.phone || '') + '</div></td>' +
        '<td><span class="badge-track" style="font-size:.78rem">' + escapeHtml(a.track || 'Track') + '</span></td>' +
        '<td><div>' + escapeHtml(a.college || '—') + '</div><small style="color:#64748B">' + escapeHtml(a.stream || '') + '</small></td>' +
        '<td><span style="font-size:.85rem;color:#64748B">' + escapeHtml(a.appliedAt || 'Recent') + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + lockedAdminHtml + '</td>' +
        '<td style="text-align:right">' + actionHtml + '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Certificates Table with Locked Admin Attribution ──
  function renderCertificatesTable(issuedCerts) {
    var tbody = document.getElementById('admin-certs-tbody');
    if (!tbody) return;

    if (!issuedCerts || issuedCerts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#64748B">No certificates issued yet. Open "Registered Students" and click "Certificate" on any candidate.</td></tr>';
      return;
    }

    var html = '';
    issuedCerts.forEach(function(s) {
      var cert = s.certificate;
      var isRevoked = cert.status === 'revoked';

      var statusBadge = isRevoked
        ? '<span class="module-status-badge" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA">❌ Revoked</span>'
        : '<span class="module-status-badge badge-done">✅ ' + escapeHtml(cert.status || 'Verified') + '</span>';

      var actionHtml = isRevoked
        ? '<span style="font-size:.82rem;color:#DC2626;font-weight:600;padding:6px 12px;background:#FEE2E2;border-radius:6px;display:inline-block">❌ Revoked</span>'
        : '<div class="action-btns" style="justify-content:flex-end">' +
            '<a class="btn-sm-action primary" href="../verify-certificate/index.html?id=' + encodeURIComponent(cert.id) + '" target="_blank">🔍 Verify</a>' +
            '<button class="btn-sm-action danger" data-act="revoke-cert" data-email="' + escapeHtml(s.email) + '">Revoke</button>' +
          '</div>';

      var lockedAdmin = isRevoked ? cert.revokedByAdmin : cert.issuedByAdmin;
      var lockedAdminHtml = lockedAdmin
        ? '<span class="badge-track" style="font-size:.75rem;background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE">🔒 ' + escapeHtml(lockedAdmin) + '</span>'
        : '<span style="color:#94A3B8;font-size:.8rem">—</span>';

      var rowStyle = isRevoked ? 'background:linear-gradient(90deg,#FFF5F5 0%,#fff 100%);border-left:4px solid #EF4444;opacity:.8' : '';

      html += '<tr style="' + rowStyle + '">' +
        '<td><strong style="font-family:monospace;color:' + (isRevoked ? '#DC2626' : '#1D4ED8') + ';font-size:1.05rem">' + escapeHtml(cert.id || '—') + '</strong></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(s.name) + '</strong><br><small style="color:#64748B">' + escapeHtml(s.college || '') + '</small></td>' +
        '<td>' + escapeHtml(cert.title || s.track || '—') + '</td>' +
        '<td>' + escapeHtml(cert.issueDate || '—') + '</td>' +
        '<td><span style="color:' + (isRevoked ? '#DC2626' : '#047857') + ';font-weight:700">' + escapeHtml(cert.grade || (isRevoked ? 'N/A' : 'Passed')) + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + lockedAdminHtml + '</td>' +
        '<td style="text-align:right">' + actionHtml + '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Immutable System Audit Log ──
  function renderAuditTable(logs) {
    var tbody = document.getElementById('admin-audit-tbody');
    if (!tbody) return;

    var filteredLogs = applyAuditFilters(logs);

    if (!filteredLogs || filteredLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#64748B">No audit logs match current filters.</td></tr>';
      return;
    }

    var students = YuvantaraDB.getStudents() || [];
    var studentsMap = {};
    students.forEach(function(s) {
      studentsMap[s.email] = s;
      if (s.id) studentsMap[s.id] = s;
      if (s.certificate && s.certificate.id) studentsMap[s.certificate.id] = s;
    });

    var html = '';
    filteredLogs.forEach(function(l) {
      var isSuper = (l.adminEmail === 'a4dr_00@supper');
      var adminBadgeStyle = isSuper
        ? 'background:#FEF2F2;color:#DC2626;border:1px solid #FECACA'
        : 'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE';

      var badgeStyle = 'background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE';
      var actionIcon = '⚡';
      if (l.actionType.indexOf('REVOKE') !== -1 || l.actionType.indexOf('SUSPEND') !== -1 || l.actionType.indexOf('REMOVE') !== -1) {
        badgeStyle = 'background:#FEF2F2;color:#DC2626;border-color:#FECACA';
        actionIcon = '🚫';
      } else if (l.actionType.indexOf('APPROVE') !== -1) {
        badgeStyle = 'background:#DCFCE7;color:#15803D;border-color:#86EFAC';
        actionIcon = '✅';
      } else if (l.actionType.indexOf('REGISTER') !== -1 || l.actionType.indexOf('ENROLL') !== -1) {
        badgeStyle = 'background:#DCFCE7;color:#15803D;border-color:#86EFAC';
        actionIcon = '➕';
      } else if (l.actionType.indexOf('CERT') !== -1) {
        badgeStyle = 'background:#F3E8FF;color:#7E22CE;border-color:#D8B4FE';
        actionIcon = '🎓';
      }

      var targetUserHtml = '';
      if (l.targetUser && (l.targetUser.name || l.targetUser.email)) {
        targetUserHtml =
          '<div style="font-weight:700;color:#0F172A">' + escapeHtml(l.targetUser.name || 'Candidate') + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(l.targetUser.email || l.targetId) + '</div>' +
          (l.targetUser.track ? '<div style="font-size:.78rem;color:#2563EB;margin-top:2px">🎯 ' + escapeHtml(l.targetUser.track) + '</div>' : '');
      } else {
        var matched = studentsMap[l.targetId] || null;
        if (matched) {
          targetUserHtml =
            '<div style="font-weight:700;color:#0F172A">' + escapeHtml(matched.name) + '</div>' +
            '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(matched.email) + '</div>' +
            (matched.track ? '<div style="font-size:.78rem;color:#2563EB;margin-top:2px">🎯 ' + escapeHtml(matched.track) + '</div>' : '');
        } else {
          targetUserHtml = '<strong style="font-family:monospace;color:#1E293B">' + escapeHtml(l.targetId || '—') + '</strong>';
        }
      }

      html += '<tr>' +
        '<td><span style="font-size:.85rem;color:#475569;white-space:nowrap">' + escapeHtml(l.timestamp) + '</span></td>' +
        '<td>' +
          '<span class="badge-track" style="font-size:.78rem;' + adminBadgeStyle + '">' +
            (isSuper ? '👑 ' : '🛡️ ') + escapeHtml(l.adminEmail) +
          '</span>' +
        '</td>' +
        '<td><span class="badge-track" style="font-size:.74rem;' + badgeStyle + '">' + actionIcon + ' ' + escapeHtml(l.actionType) + '</span></td>' +
        '<td>' + targetUserHtml + '</td>' +
        '<td style="font-size:.86rem;color:#334155;line-height:1.4">' + escapeHtml(l.details) + '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Super Admin Roster Table (Only for a4dr_00@supper) ──
  function renderSuperAdminRosterTable(admins, auditLogs) {
    var tbody = document.getElementById('super-admin-roster-tbody');
    if (!tbody) return;

    var html = '';
    admins.forEach(function(adm) {
      var isSuspended = (adm.status === 'suspended');

      // Count actions performed by this admin from audit logs
      var actionCount = auditLogs.filter(function(l) { return l.adminEmail === adm.email; }).length;

      var statusBadge = isSuspended
        ? '<span class="module-status-badge" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA">⛔ Suspended</span>'
        : '<span class="module-status-badge badge-done">✅ Active</span>';

      var toggleBtn = isSuspended
        ? '<button class="btn-sm-action" style="background:#DCFCE7;color:#15803D;border:1px solid #86EFAC" data-act="restore-adm" data-email="' + escapeHtml(adm.email) + '">✅ Restore</button>'
        : '<button class="btn-sm-action danger" data-act="suspend-adm" data-email="' + escapeHtml(adm.email) + '">🚫 Suspend</button>';

      html += '<tr' + (isSuspended ? ' style="background:#FFF5F5;opacity:.8"' : '') + '>' +
        '<td><strong style="font-family:monospace;color:#1D4ED8;font-size:1rem">' + escapeHtml(adm.email) + '</strong></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(adm.name) + '</strong></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><span class="badge-track" style="font-size:.8rem;background:#F8FAFC;color:#0F172A">🔒 ' + actionCount + ' Actions Logged</span></td>' +
        '<td><span style="font-size:.85rem;color:#64748B">' + escapeHtml(adm.phone || '—') + '</span></td>' +
        '<td style="text-align:right">' +
          '<div class="action-btns" style="justify-content:flex-end">' +
            '<button class="btn-sm-action primary" data-act="open-chg-pass" data-email="' + escapeHtml(adm.email) + '">🔑 Reset Password</button>' +
            toggleBtn +
            '<button class="btn-sm-action danger" data-act="remove-adm" data-email="' + escapeHtml(adm.email) + '" title="Permanently delete admin account">🗑️</button>' +
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
      superAdmin: 'a4dr_00@supper',
      activeAdmins: YuvantaraDB.getAdmins().map(function(a) { return { email: a.email, name: a.name, status: a.status }; }),
      studentsCount: YuvantaraDB.getStudents().length,
      applicationsCount: YuvantaraDB.getApplications().length,
      auditLogsCount: YuvantaraDB.getAuditLogs().length
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

    // Refresh audit log button
    var refreshAuditBtn = document.getElementById('btn-refresh-audit');
    if (refreshAuditBtn) {
      refreshAuditBtn.addEventListener('click', function() {
        renderAuditTable(YuvantaraDB.getAuditLogs());
      });
    }

    // ── Student Filters ──
    var filterStuTf = document.getElementById('filter-stu-timeframe');
    var customDatesWrap = document.getElementById('filter-stu-custom-dates');
    var filterStuFrom = document.getElementById('filter-stu-from');
    var filterStuTo = document.getElementById('filter-stu-to');
    var filterStuTrack = document.getElementById('filter-stu-track');
    var filterStuStatus = document.getElementById('filter-stu-status');
    var filterStuSearch = document.getElementById('filter-stu-search');
    var btnResetStu = document.getElementById('btn-reset-stu-filters');

    function refreshStudentsView() {
      renderStudentsTable(YuvantaraDB.getStudents());
    }

    if (filterStuTf) {
      filterStuTf.addEventListener('change', function() {
        studentFilterState.timeframe = filterStuTf.value;
        if (customDatesWrap) {
          customDatesWrap.style.display = (filterStuTf.value === 'custom') ? 'flex' : 'none';
        }
        refreshStudentsView();
      });
    }

    if (filterStuFrom) {
      filterStuFrom.addEventListener('change', function() {
        studentFilterState.from = filterStuFrom.value;
        refreshStudentsView();
      });
    }

    if (filterStuTo) {
      filterStuTo.addEventListener('change', function() {
        studentFilterState.to = filterStuTo.value;
        refreshStudentsView();
      });
    }

    if (filterStuTrack) {
      filterStuTrack.addEventListener('change', function() {
        studentFilterState.track = filterStuTrack.value;
        refreshStudentsView();
      });
    }

    if (filterStuStatus) {
      filterStuStatus.addEventListener('change', function() {
        studentFilterState.status = filterStuStatus.value;
        refreshStudentsView();
      });
    }

    if (filterStuSearch) {
      filterStuSearch.addEventListener('input', function() {
        studentFilterState.search = filterStuSearch.value;
        refreshStudentsView();
      });
    }

    if (btnResetStu) {
      btnResetStu.addEventListener('click', function() {
        studentFilterState = { timeframe: 'all', from: '', to: '', track: 'all', status: 'all', search: '' };
        if (filterStuTf) filterStuTf.value = 'all';
        if (customDatesWrap) customDatesWrap.style.display = 'none';
        if (filterStuFrom) filterStuFrom.value = '';
        if (filterStuTo) filterStuTo.value = '';
        if (filterStuTrack) filterStuTrack.value = 'all';
        if (filterStuStatus) filterStuStatus.value = 'all';
        if (filterStuSearch) filterStuSearch.value = '';
        refreshStudentsView();
      });
    }

    // ── Audit Filters ──
    var filterAudAdmin = document.getElementById('filter-audit-admin');
    var filterAudAction = document.getElementById('filter-audit-action');
    var filterAudSearch = document.getElementById('filter-audit-search');
    var btnResetAudit = document.getElementById('btn-reset-audit-filters');

    function refreshAuditView() {
      renderAuditTable(YuvantaraDB.getAuditLogs());
    }

    if (filterAudAdmin) {
      filterAudAdmin.addEventListener('change', function() {
        auditFilterState.admin = filterAudAdmin.value;
        refreshAuditView();
      });
    }

    if (filterAudAction) {
      filterAudAction.addEventListener('change', function() {
        auditFilterState.action = filterAudAction.value;
        refreshAuditView();
      });
    }

    if (filterAudSearch) {
      filterAudSearch.addEventListener('input', function() {
        auditFilterState.search = filterAudSearch.value;
        refreshAuditView();
      });
    }

    if (btnResetAudit) {
      btnResetAudit.addEventListener('click', function() {
        auditFilterState = { admin: 'all', action: 'all', search: '' };
        if (filterAudAdmin) filterAudAdmin.value = 'all';
        if (filterAudAction) filterAudAction.value = 'all';
        if (filterAudSearch) filterAudSearch.value = '';
        refreshAuditView();
      });
    }

    // Admin Logout
    var logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to log out of the Command Center?')) {
          YuvantaraDB.logout();
          window.location.reload();
        }
      });
    }

    // Cloud Sync
    var cloudSyncBtn = document.getElementById('btn-cloud-sync');
    if (cloudSyncBtn) {
      cloudSyncBtn.addEventListener('click', function() {
        if (!window.YuvantaraCloudDB || !window.YuvantaraCloudDB.isConfigured()) {
          alert('☁️ Cloud Database Configuration Notice:\n\n' +
                'To connect your live cloud database for yuvantaraventure.in:\n' +
                '1. Open assets/config.js\n' +
                '2. Set firebase.enabled = true\n' +
                '3. Paste your Firebase apiKey & projectId\n\n' +
                'All records are currently preserved in local persistent storage.');
          return;
        }

        cloudSyncBtn.disabled = true;
        cloudSyncBtn.textContent = '☁️ Syncing...';
        window.YuvantaraCloudDB.syncToCloud().then(function(res) {
          cloudSyncBtn.disabled = false;
          cloudSyncBtn.textContent = '☁️ Sync Cloud DB';
          if (res.synced) {
            alert('✅ Cloud Sync Complete!\n\nSynchronized ' + res.count + ' records with Cloud Firestore.');
            renderAdminDashboard();
          } else {
            alert('Cloud sync notice: ' + (res.reason || 'Check network connection.'));
          }
        }).catch(function(err) {
          cloudSyncBtn.disabled = false;
          cloudSyncBtn.textContent = '☁️ Sync Cloud DB';
          alert('Sync error: ' + err.message);
        });
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
            system: 'Yuvantara Enterprise Production Database Backup',
            exportedAt: new Date().toISOString(),
            exportedBy: currentAdmin.email,
            users: YuvantaraDB.getUsers(),
            applications: YuvantaraDB.getApplications(),
            auditLogs: YuvantaraDB.getAuditLogs()
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
              if (data.auditLogs) localStorage.setItem('yuvantara_audit_logs', JSON.stringify(data.auditLogs));
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
        if (confirm('Reset all records to factory default state?')) {
          YuvantaraDB.resetToDemoData();
          alert('Database reset to factory default seed successfully.');
          window.location.reload();
        }
      });
    }

    // Delegated actions on tables
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

      // 2.5 Activate Student Content
      if (act === 'activate-stu') {
        var email = actBtn.dataset.email;
        var student = YuvantaraDB.getUserByEmail(email);
        if (student) {
          YuvantaraDB.updateStudent(email, {
            accountStatus: 'active',
            progress: student.progress || 15
          }, currentAdmin.email);
          alert('✅ Content activated for ' + student.name + '!\n\nStudent now has active access.');
          renderAdminDashboard();
        }
      }

      // 3. Delete Student
      if (act === 'del-stu') {
        var email = actBtn.dataset.email;
        if (confirm('Permanently delete student record for "' + email + '"?')) {
          var users = YuvantaraDB.getUsers();
          users = users.filter(function(u) { return u.email.toLowerCase() !== email.toLowerCase(); });
          localStorage.setItem('yuvantara_users_db', JSON.stringify(users));
          YuvantaraDB.logAuditAction(currentAdmin.email, 'DELETE_STUDENT', email, 'Deleted student record ' + email);
          renderAdminDashboard();
        }
      }

      // 4. Approve Application (Locked to current executing admin)
      if (act === 'approve-app') {
        var appId = actBtn.dataset.appid;
        var app = YuvantaraDB.getApplications().find(function(a) { return a.id === appId; });
        if (app) {
          var studentPass = app.password || 'student123';
          var regRes = YuvantaraDB.registerStudent({
            name: app.name,
            email: app.email,
            phone: app.phone,
            password: studentPass,
            track: app.track,
            college: app.college,
            stream: app.stream
          }, currentAdmin.email);

          YuvantaraDB.updateApplicationStatus(appId, 'approved', currentAdmin.email);
          alert('✅ Application Approved!\n\nAction locked to: ' + currentAdmin.email + '\nStudent account activated for: ' + app.name);
          renderAdminDashboard();
        }
      }

      // 5. Reject Application (Locked to current executing admin)
      if (act === 'reject-app') {
        var appId = actBtn.dataset.appid;
        if (confirm('Mark application ' + appId + ' as rejected?')) {
          YuvantaraDB.updateApplicationStatus(appId, 'rejected', currentAdmin.email);
          renderAdminDashboard();
        }
      }

      // 6. Revoke Certificate (Locked to current executing admin)
      if (act === 'revoke-cert') {
        var email = actBtn.dataset.email;
        if (confirm('Revoke official certificate for student "' + email + '"?\n\nThis action will be permanently recorded in the audit trail.')) {
          YuvantaraDB.revokeCertificate(email, currentAdmin.email);
          alert('Certificate revoked. Action locked to: ' + currentAdmin.email);
          renderAdminDashboard();
        }
      }

      // ── Super Admin Controls ──
      // 7. Open Super Admin Change Password Modal
      if (act === 'open-chg-pass') {
        var adminEmail = actBtn.dataset.email;
        var modalInput = document.getElementById('target-admin-email');
        if (modalInput) modalInput.value = adminEmail;
        openModal('admin-pass');
      }

      // 8. Suspend Admin Access
      if (act === 'suspend-adm') {
        var adminEmail = actBtn.dataset.email;
        if (confirm('Are you sure you want to SUSPEND administrative privileges for ' + adminEmail + '?')) {
          var res = YuvantaraDB.toggleAdminAccess(currentAdmin.email, adminEmail, true);
          if (res.success) {
            alert('⛔ Access suspended for ' + adminEmail);
            renderAdminDashboard();
          } else {
            alert(res.message);
          }
        }
      }

      // 9. Restore Admin Access
      if (act === 'restore-adm') {
        var adminEmail = actBtn.dataset.email;
        var res = YuvantaraDB.toggleAdminAccess(currentAdmin.email, adminEmail, false);
        if (res.success) {
          alert('✅ Access restored for ' + adminEmail);
          renderAdminDashboard();
        } else {
          alert(res.message);
        }
      }

      // 10. Remove Admin Permanently
      if (act === 'remove-adm') {
        var adminEmail = actBtn.dataset.email;
        if (confirm('⚠️ PERMANENT ACTION:\n\nAre you sure you want to permanently delete administrator account ' + adminEmail + '?')) {
          var res = YuvantaraDB.removeAdminBySuper(currentAdmin.email, adminEmail);
          if (res.success) {
            alert('Admin account removed.');
            renderAdminDashboard();
          } else {
            alert(res.message);
          }
        }
      }
    });

    // Close Modals
    document.querySelectorAll('[data-close-modal]').forEach(function(b) {
      b.addEventListener('click', closeAllModals);
    });
    document.querySelectorAll('.modal-overlay').forEach(function(o) {
      o.addEventListener('click', closeAllModals);
    });

    // Super Admin Change Admin Password Form
    var formChgAdminPass = document.getElementById('form-change-admin-pass');
    if (formChgAdminPass) {
      formChgAdminPass.addEventListener('submit', function(e) {
        e.preventDefault();
        var targetEmail = document.getElementById('target-admin-email').value;
        var newPass = document.getElementById('new-admin-password').value.trim();

        var res = YuvantaraDB.changeAdminPasswordBySuper(currentAdmin.email, targetEmail, newPass);
        if (res.success) {
          alert('✅ Password successfully changed for ' + targetEmail + '!\n\nNew Password: ' + newPass);
          formChgAdminPass.reset();
          closeAllModals();
          renderAdminDashboard();
        } else {
          alert('Error: ' + res.message);
        }
      });
    }

    // Enroll New Student Modal
    var addStuBtn = document.getElementById('btn-add-student-modal');
    if (addStuBtn) {
      addStuBtn.addEventListener('click', function() { openModal('enroll'); });
    }

    var enrollForm = document.getElementById('form-enroll-student');
    if (enrollForm) {
      enrollForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = {
          name: document.getElementById('new-stu-name').value.trim(),
          email: document.getElementById('new-stu-email').value.trim(),
          phone: document.getElementById('new-stu-phone').value.trim(),
          dob: document.getElementById('new-stu-dob') ? document.getElementById('new-stu-dob').value.trim() : '',
          password: document.getElementById('new-stu-pass').value.trim(),
          track: document.getElementById('new-stu-track').value,
          college: document.getElementById('new-stu-college').value.trim(),
          stream: document.getElementById('new-stu-stream').value.trim()
        };

        var res = YuvantaraDB.registerStudent(data, currentAdmin.email);
        if (res.success) {
          alert('Student ' + data.name + ' enrolled successfully! (Locked to: ' + currentAdmin.email + ')');
          enrollForm.reset();
          closeAllModals();
          renderAdminDashboard();
        } else {
          alert(res.message || 'Error enrolling student.');
        }
      });
    }

    // Save Progress Form (Locked to current admin)
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
        var pct = parseInt(progRange.value, 10);

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
        }, currentAdmin.email);

        alert('Student progress updated to ' + pct + '%! (Action locked to ' + currentAdmin.email + ')');
        closeAllModals();
        renderAdminDashboard();
      });
    }

    // Save Certificate Form (Locked to current admin)
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
          var res = YuvantaraDB.assignCertificate(email, certData, currentAdmin.email);
          if (res.success) {
            alert('Certificate ' + certData.id + ' successfully issued! (Locked to: ' + currentAdmin.email + ')');
            closeAllModals();
            renderAdminDashboard();
          } else {
            alert(res.message || 'Error issuing certificate.');
          }
        }

        if (fileInput && fileInput.files && fileInput.files[0]) {
          var reader = new FileReader();
          reader.onload = function(ev) { commitCert(ev.target.result); };
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
      modules.forEach(function(m) {
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

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('adm-email').value;
        var pass = document.getElementById('adm-pass').value;

        var res = YuvantaraDB.login(email, pass);
        if (res.success && (res.user.role === 'admin' || res.user.role === 'superadmin')) {
          initAdmin();
        } else {
          if (alertBox) {
            alertBox.className = 'alert-box error';
            alertBox.textContent = res.message || 'Invalid administrator credentials.';
            alertBox.style.display = 'block';
          }
        }
      });
    }
  }

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
