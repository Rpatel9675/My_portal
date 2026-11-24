// scratch/test_replica_lifecycle.js
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..', '..', '..', 'Desktop', 'Start-up', 'provision-site');
const dataDir = path.join(projectRoot, 'data');

const replicaFiles = [
  'master_super_admin.json',
  'admin_adk_01.json',
  'admin_alk_01.json',
  'admin_dhb_03.json',
  'admin_abk_04.json',
  'admin_anp_05.json',
  'admin_rop_06.json'
];

console.log('--- TEST 1: Check 7 Replica Files Exist on Disk ---');
replicaFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Missing replica file ${file}`);
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`[OK] ${file}: NewRegs=${content.new_registrations?.length || 0}, CurrentInterns=${content.current_interns?.length || 0}, AllEmployees=${content.all_employees?.length || 0}, Logs=${content.audit_logs?.length || 0}`);
});

console.log('\n--- TEST 2: Simulate Complete Lifecycle (Submit -> Verify -> Graduate -> Delete) ---');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Mock fetch to simulate /api/replicas/sync saving to disk
global.fetch = async (url, opts) => {
  if (url === '/api/replicas/sync' && opts && opts.body) {
    const payload = JSON.parse(opts.body);
    const repMeta = [
      { file: 'master_super_admin.json', email: 'a4dr_00@supper' },
      { file: 'admin_adk_01.json', email: 'adk_01@admin' },
      { file: 'admin_alk_01.json', email: 'alk_01@admin' },
      { file: 'admin_dhb_03.json', email: 'dhb_03@admin' },
      { file: 'admin_abk_04.json', email: 'abk_04@admin' },
      { file: 'admin_anp_05.json', email: 'anp_05@admin' },
      { file: 'admin_rop_06.json', email: 'rop_06@admin' }
    ];
    repMeta.forEach(r => {
      const repData = Object.assign({}, payload, { adminEmail: r.email });
      fs.writeFileSync(path.join(dataDir, r.file), JSON.stringify(repData, null, 2), 'utf8');
    });
  }
  return { ok: true, json: async () => ({ success: true }) };
};

// Load assets/db.js
global.window = global;
require(path.join(projectRoot, 'assets', 'db.js'));

const DB = window.YuvantaraDB;

// Step A: Submit New Registration
const initialRegs = DB.getNewRegistrations().length;
const initialInterns = DB.getCurrentInterns().length;
const initialEmployees = DB.getAllEmployees().length;

const regRes = DB.submitNewRegistration({
  name: 'Vikram Aditya',
  email: 'vikram.aditya@testpatna.edu',
  phone: '9876543210',
  dob: '2002-04-10',
  track: 'Cybersecurity & SOC Operations',
  college: 'NIT Patna',
  stream: 'B.Tech CSE'
});

console.log('Step A (New Registration):', regRes.success ? 'SUCCESS' : 'FAILED', regRes.app ? regRes.app.id : '');
if (!regRes.success) {
  console.error('Error submitting:', regRes.message);
  process.exit(1);
}

let newRegs = DB.getNewRegistrations();
if (newRegs.length !== initialRegs + 1) {
  console.error('FAIL: New registration not found in list!');
  process.exit(1);
}
console.log(`[OK] New Registrations count increased to ${newRegs.length}`);

// Step B: Authority Verification by an Admin (e.g. adk_01@admin)
const targetRegId = regRes.app.id;
const verifyRes = DB.verifyAndApproveRegistration(targetRegId, 'adk_01@admin');
console.log('Step B (Verify & Approve by adk_01@admin):', verifyRes.success ? 'SUCCESS' : 'FAILED');

newRegs = DB.getNewRegistrations();
let interns = DB.getCurrentInterns();
const isRemovedFromNew = !newRegs.some(r => r.id === targetRegId);
const isAddedToInterns = interns.some(i => i.email === 'vikram.aditya@testpatna.edu');
const verifiedIntern = interns.find(i => i.email === 'vikram.aditya@testpatna.edu');

if (!isRemovedFromNew) {
  console.error('FAIL: User was NOT removed from new_registrations!');
  process.exit(1);
}
if (!isAddedToInterns || !verifiedIntern) {
  console.error('FAIL: User was NOT added to current_interns!');
  process.exit(1);
}
if (verifiedIntern.approvedByAdmin !== 'adk_01@admin') {
  console.error('FAIL: Approving admin attribution missing or incorrect:', verifiedIntern.approvedByAdmin);
  process.exit(1);
}
console.log(`[OK] Removed from new_registrations, added to current_interns (Approved by: ${verifiedIntern.approvedByAdmin})`);

// Step C: Update Progress
const progRes = DB.updateIntern(verifiedIntern.id, { progress: 100 }, 'adk_01@admin');
console.log('Step C (Update Progress to 100%):', progRes.success ? 'SUCCESS' : 'FAILED');
interns = DB.getCurrentInterns();
const updatedIntern = interns.find(i => i.email === 'vikram.aditya@testpatna.edu');
if (updatedIntern.progress !== 100) {
  console.error('FAIL: Progress not updated!');
  process.exit(1);
}
console.log(`[OK] Intern progress updated to ${updatedIntern.progress}%`);

// Step D: Graduate to All Employees
const certNum = 'YUV-2026-CS999';
const gradRes = DB.graduateToEmployee(verifiedIntern.email, {
  certNumber: certNum,
  role: 'SOC Defense Specialist',
  grade: 'Grade A+ (Distinction)',
  issueDate: 'November 23, 2026',
  authority: 'Yuvantara Cyber Defense Council'
}, 'adk_01@admin');

console.log('Step D (Graduate to All Employees):', gradRes.success ? 'SUCCESS' : 'FAILED');
let employees = DB.getAllEmployees();
const emp = employees.find(e => e.email === 'vikram.aditya@testpatna.edu');
if (!emp || emp.certificateNumber !== certNum) {
  console.error('FAIL: Employee not found in all_employees with certificate number!');
  process.exit(1);
}
console.log(`[OK] Graduated to all_employees! Cert ID: ${emp.certificateNumber}, Role: ${emp.role}`);

// Step E: Verify Certificate Search
const verifiedCert = DB.getCertificateByNumber(certNum);
if (!verifiedCert || verifiedCert.id !== certNum) {
  console.error('FAIL: Certificate lookup in getCertificateByNumber failed!');
  process.exit(1);
}
console.log(`[OK] Certificate lookup verified in registry: ${verifiedCert.name} - ${verifiedCert.course}`);

// Step F: Atomic Deletion across all 7 Replicas
const delRes = DB.deleteRecord('all_employees', emp.id, 'adk_01@admin');
console.log('Step F (Delete record across all 7 replicas):', delRes.success ? 'SUCCESS' : 'FAILED');
employees = DB.getAllEmployees();
if (employees.some(e => e.id === emp.id)) {
  console.error('FAIL: Record was not deleted from all_employees!');
  process.exit(1);
}
console.log(`[OK] Record successfully deleted. Remaining all_employees count: ${employees.length}`);

// Step G: Clean up test intern
DB.deleteRecord('current_interns', verifiedIntern.id, 'adk_01@admin');

// Step H: Check Disk Replicas after sync
console.log('\n--- TEST 3: Verifying all 7 replica files on disk remain 100% in sync ---');
const diskCounts = replicaFiles.map(file => {
  const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  return {
    file,
    newRegs: content.new_registrations?.length,
    interns: content.current_interns?.length,
    employees: content.all_employees?.length
  };
});

const first = diskCounts[0];
const allMatch = diskCounts.every(d => d.newRegs === first.newRegs && d.interns === first.interns && d.employees === first.employees);

if (allMatch) {
  console.log('✅ ALL 7 REPLICAS ON DISK ARE 100% IN SYNC!');
  diskCounts.forEach(d => console.log(`  - ${d.file}: Regs=${d.newRegs}, Interns=${d.interns}, Employees=${d.employees}`));
} else {
  console.error('FAIL: Mismatch among 7 replicas on disk!', diskCounts);
  process.exit(1);
}

console.log('\n🎉 ALL LIFECYCLE AND REPLICA TESTS PASSED PERFECTLY!');
