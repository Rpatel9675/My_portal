// Yuvantara Admin Command Center Controller
// 3 Synchronized Databases: 1. New Registrations, 2. Current Interns, 3. All Employees
// 7 Synchronized Replicas: 1 Master Super Admin + 6 System Administrators (Atomic Multi-Replica Updates & Deletions)
(function() {
  'use strict';

  var currentAdmin = null;

  var internFilterState = {
    timeframe: 'all',
    track: 'all',
    search: ''
  };

  var employeeFilterState = {
    search: ''
  };

  var auditFilterState = {
    admin: 'all',
    action: 'all',
    search: ''
  };

  function applyInternFilters(interns) {
    if (!interns) return [];
    var now = new Date();
    var todayStr = now.toISOString().substring(0, 10);

    return interns.filter(function(i) {
      // 1. Timeframe
      if (internFilterState.timeframe !== 'all') {
        var dateStr = i.enrolledAt || i.approvedAt || '';
        var date = dateStr ? new Date(dateStr) : null;

        if (internFilterState.timeframe === 'today') {
          if (!dateStr || dateStr.substring(0, 10) !== todayStr) return false;
        } else if (internFilterState.timeframe === '7days') {
          if (!date) return false;
          var diff7 = (now - date) / (1000 * 60 * 60 * 24);
          if (diff7 < 0 || diff7 > 7) return false;
        } else if (internFilterState.timeframe === '30days') {
          if (!date) return false;
          var diff30 = (now - date) / (1000 * 60 * 60 * 24);
          if (diff30 < 0 || diff30 > 30) return false;
        } else if (internFilterState.timeframe === 'this_month') {
          if (!date) return false;
          if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // 2. Track
      if (internFilterState.track !== 'all') {
        if ((i.track || '') !== internFilterState.track) return false;
      }

      // 3. Search
      if (internFilterState.search) {
        var q = internFilterState.search.toLowerCase().trim();
        var match = (i.name && i.name.toLowerCase().indexOf(q) !== -1) ||
                    (i.email && i.email.toLowerCase().indexOf(q) !== -1) ||
                    (i.phone && i.phone.toLowerCase().indexOf(q) !== -1) ||
                    (i.college && i.college.toLowerCase().indexOf(q) !== -1) ||
                    (i.id && i.id.toLowerCase().indexOf(q) !== -1) ||
                    (i.track && i.track.toLowerCase().indexOf(q) !== -1) ||
                    (i.approvedByAdmin && i.approvedByAdmin.toLowerCase().indexOf(q) !== -1);
        if (!match) return false;
      }

      return true;
    });
  }

  function applyEmployeeFilters(employees) {
    if (!employees) return [];
    if (!employeeFilterState.search) return employees;
    var q = employeeFilterState.search.toLowerCase().trim();
    return employees.filter(function(e) {
      return (e.name && e.name.toLowerCase().indexOf(q) !== -1) ||
             (e.email && e.email.toLowerCase().indexOf(q) !== -1) ||
             (e.phone && e.phone.toLowerCase().indexOf(q) !== -1) ||
             (e.role && e.role.toLowerCase().indexOf(q) !== -1) ||
             (e.domain && e.domain.toLowerCase().indexOf(q) !== -1) ||
             (e.certificateNumber && e.certificateNumber.toLowerCase().indexOf(q) !== -1) ||
             (e.id && e.id.toLowerCase().indexOf(q) !== -1);
    });
  }

  function applyAuditFilters(logs) {
    if (!logs) return [];
    return logs.filter(function(l) {
      if (auditFilterState.admin !== 'all') {
        if (l.adminEmail !== auditFilterState.admin) return false;
      }
      if (auditFilterState.action !== 'all') {
        if (l.actionType.indexOf(auditFilterState.action) === -1) return false;
      }
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
    var newRegs = YuvantaraDB.getNewRegistrations();
    var currentInterns = YuvantaraDB.getCurrentInterns();
    var allEmployees = YuvantaraDB.getAllEmployees();
    var auditLogs = YuvantaraDB.getAuditLogs();
    var admins = YuvantaraDB.getAdmins();

    var isSuper = (currentAdmin && (currentAdmin.role === 'superadmin' || currentAdmin.email === 'a4dr_00@supper' || currentAdmin.email === 'admin@yuvantara.com'));

    // Update KPIs (3 Categories + Single Master DB)
    setText('kpi-new-regs', newRegs.length);
    setText('kpi-current-interns', currentInterns.length);
    setText('kpi-all-employees', allEmployees.length);
    setText('kpi-master-records', YuvantaraDB.getMasterDB().length);

    // Update Tab Counters
    setText('tab-cnt-new-regs', newRegs.length);
    setText('tab-cnt-current-interns', currentInterns.length);
    setText('tab-cnt-all-employees', allEmployees.length);
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
            '<span>📍 Single Master Database (yuvantara_master_db)</span>' +
          '</p>';
      } else {
        headerMeta.innerHTML =
          '<h2>🛡️ Administrator Management Console</h2>' +
          '<p>' +
            '<span class="admin-badge">Admin Clearance</span>' +
            '<span>👤 Logged In: ' + escapeHtml(currentAdmin.email) + '</span>' +
            '<span>🔒 Actions Stored in Single Master DB</span>' +
          '</p>';
      }
    }

    // Render Tables
    renderPendingEnrollmentsSection(newRegs);
    renderNewRegistrationsTable(newRegs);
    renderCurrentInternsTable(currentInterns);
    renderAllEmployeesTable(allEmployees);
    renderAuditTable(auditLogs);
    if (isSuper) renderSuperAdminRosterTable(admins, auditLogs);
    renderJsonViewer();
  }

  // ── Render Quickview Notification Section ──
  function renderPendingEnrollmentsSection(newRegs) {
    var container = document.getElementById('pending-enrollments-quickview');
    var listEl = document.getElementById('pending-enrollments-list');
    var badgeEl = document.getElementById('pending-enrollments-badge');
    if (!container || !listEl) return;

    if (!newRegs || newRegs.length === 0) {
      if (badgeEl) badgeEl.textContent = '0 New';
      listEl.innerHTML = '<div style="text-align:center;padding:16px;color:#64748B;font-size:.9rem">✅ No pending registration requests at this time. All applicants have been verified.</div>';
      return;
    }

    if (badgeEl) badgeEl.textContent = newRegs.length + ' New';

    var html = '<div style="display:flex;flex-direction:column;gap:12px">';
    newRegs.forEach(function(r) {
      var isPaid = r.paymentStatus === 'paid' || !!r.paymentRef;
      var statusBadge = isPaid
        ? '<span style="background:#DCFCE7;color:#15803D;padding:2px 8px;border-radius:4px;font-weight:600">✅ Paid (₹236) · Pending Access</span>'
        : '<span style="background:#FEF3C7;color:#B45309;padding:2px 8px;border-radius:4px;font-weight:600">⚠️ Unpaid · Registration Logged</span>';

      var descText = isPaid
        ? '📢 Person <span style="color:#1E40AF">' + escapeHtml(r.name) + '</span> has registered &amp; completed payment (₹236) for <span style="color:#0F172A;text-decoration:underline">' + escapeHtml(r.track || 'Internship Program') + '</span>. Grant internship access.'
        : '📢 Person <span style="color:#1E40AF">' + escapeHtml(r.name) + '</span> has registered for <span style="color:#0F172A;text-decoration:underline">' + escapeHtml(r.track || 'Internship Program') + '</span> (Pending Payment).';

      html +=
        '<div style="background:#fff;border:1px solid #E2E8F0;border-left:4px solid ' + (isPaid ? '#10B981' : '#F59E0B') + ';border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">' +
          '<div style="flex:1;min-width:280px">' +
            '<div style="font-size:1rem;color:#0F172A;font-weight:700;margin-bottom:4px">' +
              descText +
            '</div>' +
            '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:.84rem;color:#475569;margin-top:4px">' +
              '<span><strong>Email:</strong> ' + escapeHtml(r.email) + '</span>' +
              '<span><strong>Phone:</strong> ' + escapeHtml(r.phone || '—') + '</span>' +
              '<span><strong>College:</strong> ' + escapeHtml(r.college || '—') + '</span>' +
              '<span><strong>Date:</strong> ' + escapeHtml(r.registeredAt || 'Recent') + '</span>' +
              '<span><strong>Status:</strong> ' + statusBadge + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center">' +
            '<button class="btn-sm-action primary" data-act="verify-reg" data-regid="' + escapeHtml(r.id) + '" style="padding:8px 16px;font-size:.85rem;background:#15803D;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">✅ Grant Access</button>' +
            '<button class="btn-sm-action danger" data-act="reject-reg" data-regid="' + escapeHtml(r.id) + '" style="padding:8px 16px;font-size:.85rem;background:#DC2626;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">❌ Reject</button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    listEl.innerHTML = html;
  }

  // ── Render Category 1: New Registrations Table (Querying Unified Master DB) ──
  function renderNewRegistrationsTable(newRegs) {
    var tbody = document.getElementById('admin-new-regs-tbody');
    if (!tbody) return;

    if (!newRegs || newRegs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#64748B">No new registration requests in queue.</td></tr>';
      return;
    }

    var html = '';
    newRegs.forEach(function(r) {
      var isPaid = r.paymentStatus === 'paid' || !!r.paymentRef;
      var statusBadge = isPaid
        ? '<span class="module-status-badge" style="background:#DCFCE7;color:#15803D;border:1px solid #86EFAC;font-size:.78rem">✅ Paid (₹236) · Pending Access</span>'
        : '<span class="module-status-badge" style="background:#FEF3C7;color:#B45309;border:1px solid #FDE68A;font-size:.78rem">⚠️ Unpaid · Registration Logged</span>';

      html += '<tr>' +
        '<td><code style="color:#0F172A;font-weight:700">' + escapeHtml(r.id) + '</code></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(r.name) + '</strong></td>' +
        '<td><div>' + escapeHtml(r.email) + '</div><div style="font-size:.82rem;color:#64748B">' + escapeHtml(r.phone || '') + '</div></td>' +
        '<td><span class="badge-track" style="font-size:.78rem">' + escapeHtml(r.track || 'Track') + '</span></td>' +
        '<td><div>' + escapeHtml(r.college || '—') + '</div><small style="color:#64748B">' + escapeHtml(r.stream || '') + '</small></td>' +
        '<td><span style="font-size:.85rem;color:#64748B">' + escapeHtml(r.registeredAt || 'Recent') + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="text-align:right">' +
          '<button class="btn-sm-action primary" data-act="verify-reg" data-regid="' + escapeHtml(r.id) + '" title="Grant internship access and move to Current Interns">✅ Grant Access</button> ' +
          '<button class="btn-sm-action danger" data-act="reject-reg" data-regid="' + escapeHtml(r.id) + '" title="Reject registration">❌ Reject</button>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Category 2: Current Interns Table ──
  function renderCurrentInternsTable(interns) {
    var tbody = document.getElementById('admin-current-interns-tbody');
    if (!tbody) return;

    var filtered = applyInternFilters(interns);

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748B">No current interns match filter criteria.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function(i) {
      var pct = typeof i.progress === 'number' ? i.progress : 0;
      var authBadge = i.approvedByAdmin
        ? '<span class="badge-track" style="font-size:.75rem;background:#DCFCE7;color:#15803D;border-color:#86EFAC">🛡️ ' + escapeHtml(i.approvedByAdmin) + (i.approvedAt ? ' (' + escapeHtml(i.approvedAt) + ')' : '') + '</span>'
        : '<span style="color:#94A3B8;font-size:.8rem">Authority Pending</span>';

      html += '<tr>' +
        '<td><strong style="font-family:monospace;color:#1E293B">' + escapeHtml(i.id || 'INT') + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:700;color:#0F172A">' + escapeHtml(i.name) + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(i.email) + ' • ' + escapeHtml(i.phone || '') + '</div>' +
        '</td>' +
        '<td>' +
          '<div style="color:#0F172A;font-weight:600">' + escapeHtml(i.college || '—') + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(i.stream || '—') + '</div>' +
        '</td>' +
        '<td><span class="badge-track" style="font-size:.78rem">' + escapeHtml(i.track || 'Track') + '</span></td>' +
        '<td style="min-width:140px">' +
          '<div style="display:flex;justify-content:space-between;font-size:.8rem;font-weight:700;margin-bottom:3px">' +
            '<span>' + pct + '%</span>' +
          '</div>' +
          '<div class="progress-bar-bg" style="height:6px"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</td>' +
        '<td>' + authBadge + '</td>' +
        '<td style="text-align:right">' +
          '<div class="action-btns" style="justify-content:flex-end">' +
            '<button class="btn-sm-action primary" data-act="prog" data-email="' + escapeHtml(i.email) + '" title="Edit Progress & Modules">⚡ Progress</button>' +
            '<button class="btn-sm-action" data-act="open-graduate" data-email="' + escapeHtml(i.email) + '" style="background:#0284C7;color:#fff;border-color:#0284C7" title="Graduate to All Employees & Issue Certificate">🎓 Graduate</button>' +
            '<button class="btn-sm-action danger" data-act="del-intern" data-id="' + escapeHtml(i.id) + '" title="Delete from master database">🗑️</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ── Render Category 3: All Employees Table ──
  function renderAllEmployeesTable(employees) {
    var tbody = document.getElementById('admin-all-employees-tbody');
    if (!tbody) return;

    var filtered = applyEmployeeFilters(employees);

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#64748B">No employees found. Candidates graduate here upon receiving their official certificate.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function(e) {
      var certNum = e.certificateNumber || '—';
      var verifyLink = certNum !== '—'
        ? '<a class="btn-sm-action primary" href="../verify-certificate/index.html?id=' + encodeURIComponent(certNum) + '" target="_blank">🔍 Verify</a>'
        : '';

      var authBadge = e.approvedByAdmin
        ? '<span class="badge-track" style="font-size:.75rem;background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE">🔒 ' + escapeHtml(e.approvedByAdmin) + '</span>'
        : '<span style="color:#94A3B8;font-size:.8rem">—</span>';

      html += '<tr>' +
        '<td><strong style="font-family:monospace;color:#0F172A">' + escapeHtml(e.id || 'EMP') + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:700;color:#0F172A">' + escapeHtml(e.name) + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(e.email) + ' • ' + escapeHtml(e.phone || '') + '</div>' +
        '</td>' +
        '<td>' +
          '<div style="color:#0F172A;font-weight:600">' + escapeHtml(e.role || 'Specialist') + '</div>' +
          '<div style="font-size:.82rem;color:#64748B">' + escapeHtml(e.domain || '') + '</div>' +
        '</td>' +
        '<td>' + escapeHtml(e.college || '—') + '</td>' +
        '<td><strong style="font-family:monospace;color:#0284C7;font-size:1rem">' + escapeHtml(certNum) + '</strong></td>' +
        '<td><div>' + escapeHtml(e.issueDate || '—') + '</div><small style="color:#059669;font-weight:600">' + escapeHtml(e.grade || '') + '</small></td>' +
        '<td>' + authBadge + '</td>' +
        '<td style="text-align:right">' +
          '<div class="action-btns" style="justify-content:flex-end">' +
            verifyLink +
            '<button class="btn-sm-action danger" data-act="del-employee" data-id="' + escapeHtml(e.id) + '" title="Delete from master database">🗑️</button>' +
          '</div>' +
        '</td>' +
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

    var html = '';
    filteredLogs.forEach(function(l) {
      var isSuper = (l.adminEmail === 'a4dr_00@supper');
      var adminBadgeStyle = isSuper
        ? 'background:#FEF2F2;color:#DC2626;border:1px solid #FECACA'
        : 'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE';

      var badgeStyle = 'background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE';
      var actionIcon = '⚡';
      if (l.actionType.indexOf('DELETE') !== -1 || l.actionType.indexOf('REJECT') !== -1) {
        badgeStyle = 'background:#FEF2F2;color:#DC2626;border-color:#FECACA';
        actionIcon = '🗑️';
      } else if (l.actionType.indexOf('AUTHORIZE') !== -1 || l.actionType.indexOf('APPROVE') !== -1) {
        badgeStyle = 'background:#DCFCE7;color:#15803D;border-color:#86EFAC';
        actionIcon = '✅';
      } else if (l.actionType.indexOf('EMPLOYEES') !== -1 || l.actionType.indexOf('GRADUATE') !== -1) {
        badgeStyle = 'background:#F3E8FF;color:#7E22CE;border-color:#D8B4FE';
        actionIcon = '🎓';
      }

      html += '<tr>' +
        '<td><span style="font-size:.85rem;color:#475569;white-space:nowrap">' + escapeHtml(l.timestamp) + '</span></td>' +
        '<td>' +
          '<span class="badge-track" style="font-size:.78rem;' + adminBadgeStyle + '">' +
            (isSuper ? '👑 ' : '🛡️ ') + escapeHtml(l.adminEmail) +
          '</span>' +
        '</td>' +
        '<td><span class="badge-track" style="font-size:.74rem;' + badgeStyle + '">' + actionIcon + ' ' + escapeHtml(l.actionType) + '</span></td>' +
        '<td><strong style="color:#0F172A">' + escapeHtml(l.targetUser || l.targetId || '—') + '</strong></td>' +
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
      system: 'Yuvantara Unified Master Database Architecture',
      database: 'yuvantara_master_db',
      categories: {
        new_registrations: YuvantaraDB.getNewRegistrations().length,
        current_interns: YuvantaraDB.getCurrentInterns().length,
        all_employees: YuvantaraDB.getAllEmployees().length
      },
      superAdmin: 'a4dr_00@supper',
      activeAdmins: YuvantaraDB.getAdmins().map(function(a) { return { email: a.email, name: a.name, status: a.status }; }),
      auditLogsCount: YuvantaraDB.getAuditLogs().length,
      lastSynced: new Date().toISOString()
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


    // ── Intern Filters ──
    var filterStuTf = document.getElementById('filter-stu-timeframe');
    var filterStuTrack = document.getElementById('filter-stu-track');
    var filterStuSearch = document.getElementById('filter-stu-search');
    var btnResetStu = document.getElementById('btn-reset-stu-filters');

    function refreshInternsView() {
      renderCurrentInternsTable(YuvantaraDB.getCurrentInterns());
    }

    if (filterStuTf) {
      filterStuTf.addEventListener('change', function() {
        internFilterState.timeframe = filterStuTf.value;
        refreshInternsView();
      });
    }

    if (filterStuTrack) {
      filterStuTrack.addEventListener('change', function() {
        internFilterState.track = filterStuTrack.value;
        refreshInternsView();
      });
    }

    if (filterStuSearch) {
      filterStuSearch.addEventListener('input', function() {
        internFilterState.search = filterStuSearch.value;
        refreshInternsView();
      });
    }

    if (btnResetStu) {
      btnResetStu.addEventListener('click', function() {
        internFilterState = { timeframe: 'all', track: 'all', search: '' };
        if (filterStuTf) filterStuTf.value = 'all';
        if (filterStuTrack) filterStuTrack.value = 'all';
        if (filterStuSearch) filterStuSearch.value = '';
        refreshInternsView();
      });
    }

    // ── Employee Filters ──
    var filterEmpSearch = document.getElementById('filter-emp-search');
    if (filterEmpSearch) {
      filterEmpSearch.addEventListener('input', function() {
        employeeFilterState.search = filterEmpSearch.value;
        renderAllEmployeesTable(YuvantaraDB.getAllEmployees());
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

    // Export Backup JSON
    var exportBtns = [
      document.getElementById('btn-export-backup'),
      document.getElementById('btn-download-json')
    ];
    exportBtns.forEach(function(btn) {
      if (btn) {
        btn.addEventListener('click', function() {
          var state = {
            system: 'Yuvantara Unified Master Database Backup',
            master_db: YuvantaraDB.getMasterDB(),
            exportedAt: new Date().toISOString(),
            exportedBy: currentAdmin.email,
            new_registrations: YuvantaraDB.getNewRegistrations(),
            current_interns: YuvantaraDB.getCurrentInterns(),
            all_employees: YuvantaraDB.getAllEmployees(),
            audit_logs: YuvantaraDB.getAuditLogs()
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
            if (data.new_registrations || data.current_interns || data.all_employees || data.master_db) {
              if (data.master_db && Array.isArray(data.master_db)) {
                YuvantaraDB.saveMasterDB(data.master_db);
              } else {
                var list = [].concat(data.new_registrations || [], data.current_interns || [], data.all_employees || []);
                YuvantaraDB.saveMasterDB(list);
              }
              if (data.audit_logs) localStorage.setItem('yuvantara_audit_logs', JSON.stringify(data.audit_logs));
              alert('Unified master database restored successfully!');
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
        if (confirm('Reset all records to factory default state in master database?')) {
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

      // Security check: Only verified logged-in admins may execute actions
      if (!currentAdmin || (currentAdmin.role !== 'admin' && currentAdmin.role !== 'superadmin')) {
        alert('Access Denied: Only authenticated administrators may perform this action.');
        window.location.reload();
        return;
      }

      var act = actBtn.dataset.act;

      // 1. VERIFY & APPROVE NEW REGISTRATION
      if (act === 'verify-reg') {
        var regId = actBtn.dataset.regid;
        var res = YuvantaraDB.verifyAndApproveRegistration(regId, currentAdmin.email);
        if (res.success) {
          alert('✅ Candidate Verified & Access Granted!\n\nCandidate: ' + (res.intern.name || regId) +
                '\nAuthority granted by: ' + currentAdmin.email +
                '\nMoved from Pending to Current Interns (In Progress: ' + res.intern.progress + '%).');
          renderAdminDashboard();
        } else {
          alert(res.message || 'Error approving registration.');
        }
      }

      // 2. REJECT NEW REGISTRATION
      if (act === 'reject-reg') {
        var regId = actBtn.dataset.regid;
        if (confirm('Reject and delete registration request "' + regId + '"?\n\nThis will remove the record from the master database.')) {
          var res = YuvantaraDB.deleteRecord('new_registrations', regId, currentAdmin.email);
          if (res.success) {
            alert('Registration rejected and deleted from master database.');
            renderAdminDashboard();
          } else {
            alert(res.message || 'Error rejecting registration.');
          }
        }
      }

      // 3. EDIT INTERN PROGRESS
      if (act === 'prog') {
        var email = actBtn.dataset.email;
        openProgressModal(email);
      }

      // 4. OPEN GRADUATE INTERN TO ALL EMPLOYEES MODAL
      if (act === 'open-graduate') {
        var email = actBtn.dataset.email;
        openCertModal(email);
      }

      // 5. DELETE CURRENT INTERN
      if (act === 'del-intern') {
        var internId = actBtn.dataset.id;
        if (confirm('Permanently delete intern record "' + internId + '"?\n\nThis will delete the record from the master database.')) {
          var res = YuvantaraDB.deleteRecord('current_interns', internId, currentAdmin.email);
          if (res.success) {
            alert('Intern record deleted from master database.');
            renderAdminDashboard();
          } else {
            alert(res.message || 'Error deleting intern.');
          }
        }
      }

      // 6. DELETE EMPLOYEE
      if (act === 'del-employee') {
        var empId = actBtn.dataset.id;
        if (confirm('Permanently delete employee record "' + empId + '"?\n\nThis will delete the record from the master database.')) {
          var res = YuvantaraDB.deleteRecord('all_employees', empId, currentAdmin.email);
          if (res.success) {
            alert('Employee record deleted from master database.');
            renderAdminDashboard();
          } else {
            alert(res.message || 'Error deleting employee.');
          }
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

    // Enroll New Candidate Modal Form
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

        var res = YuvantaraDB.submitNewRegistration(data);
        if (res.success) {
          alert('Candidate ' + data.name + ' registered successfully!\n\nAdded to New Registrations in master database.');
          enrollForm.reset();
          closeAllModals();
          renderAdminDashboard();
        } else {
          alert(res.message || 'Error registering candidate.');
        }
      });
    }

    // Save Progress Form (Current Interns)
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

        var res = YuvantaraDB.updateIntern(email, {
          progress: pct,
          modules: modules
        }, currentAdmin.email);

        if (res.success) {
          alert('Intern progress updated to ' + pct + '% in master database! (Action attributed to ' + currentAdmin.email + ')');
          closeAllModals();
          renderAdminDashboard();
        } else {
          alert(res.message || 'Error updating progress.');
        }
      });
    }

    // Graduate Intern to Employee & Issue Certificate Form
    var certForm = document.getElementById('form-issue-cert');
    if (certForm) {
      certForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('cert-stu-email').value;

        var certData = {
          certNumber: document.getElementById('cert-input-id').value.trim(),
          role: document.getElementById('cert-input-role') ? document.getElementById('cert-input-role').value.trim() : 'Specialist',
          title: document.getElementById('cert-input-title').value.trim(),
          duration: document.getElementById('cert-input-duration').value.trim(),
          grade: document.getElementById('cert-input-grade').value.trim(),
          issueDate: document.getElementById('cert-input-date').value.trim(),
          authority: document.getElementById('cert-input-authority').value.trim()
        };

        var res = YuvantaraDB.graduateToEmployee(email, certData, currentAdmin.email);
        if (res.success) {
          alert('🎓 Intern successfully graduated to All Employees with Certificate ' + certData.certNumber + '!\n\nSaved to master database.');
          closeAllModals();
          renderAdminDashboard();
        } else {
          alert(res.message || 'Error graduating intern to employee.');
        }
      });
    }
  }

  // ── Modal Helpers ──
  function openProgressModal(email) {
    var interns = YuvantaraDB.getCurrentInterns();
    var intern = interns.find(function(i) { return i.email === email; });
    if (!intern) {
      var student = YuvantaraDB.getUserByEmail(email);
      if (!student) return;
      intern = student;
    }

    setVal('prog-stu-email', intern.email);
    setVal('prog-stu-name', intern.name + ' (' + intern.email + ')');
    var pct = typeof intern.progress === 'number' ? intern.progress : 50;
    setVal('prog-range-input', pct);
    setText('prog-range-val', pct + '%');

    var modules = intern.modules || [
      { name: 'Module 1: Orientation & Foundations', status: 'completed' },
      { name: 'Module 2: Practical Lab Implementations', status: 'in-progress' },
      { name: 'Module 3: Project Architecture & Execution', status: 'pending' },
      { name: 'Module 4: Mid-Term Assessment', status: 'pending' },
      { name: 'Module 5: Capstone Review & Final Submission', status: 'pending' }
    ];

    var container = document.getElementById('prog-modules-container');
    if (container) {
      var html = '';
      modules.forEach(function(m) {
        var isDone = (m.status === 'completed');
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
    var interns = YuvantaraDB.getCurrentInterns();
    var intern = interns.find(function(i) { return i.email === email; });
    if (!intern) return;

    setVal('cert-stu-email', intern.email);
    setVal('cert-stu-name', intern.name + ' — ' + (intern.track || 'Track'));

    var trackCode = (intern.track ? intern.track.slice(0, 2).toUpperCase() : 'IN');
    var defaultId = 'YUV-2026-' + trackCode + Math.floor(100 + Math.random() * 900);
    var defaultTitle = (intern.track || 'Industrial') + ' Industrial Program';
    var defaultRole = (intern.track ? intern.track.split(' ')[0] + ' Specialist' : 'Junior Engineer');

    setVal('cert-input-id', defaultId);
    setVal('cert-input-role', defaultRole);
    setVal('cert-input-title', defaultTitle);
    setVal('cert-input-duration', '6 Months (Jan 2026 – Jun 2026)');
    setVal('cert-input-grade', 'Grade A+ (Distinction)');
    setVal('cert-input-date', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setVal('cert-input-authority', 'Yuvantara Academic & Skill Council');

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

  window.addEventListener('yuvantara_dataset_hydrated', function() {
    if (currentAdmin && (currentAdmin.role === 'admin' || currentAdmin.role === 'superadmin')) {
      renderAdminDashboard();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
