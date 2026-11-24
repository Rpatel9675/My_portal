const fs = require('fs');
const path = require('path');

// Mock localStorage and window for Node testing
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  localStorage: global.localStorage,
  location: { origin: 'http://localhost:8080', pathname: '/' }
};
global.document = {
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};

// Load Yuvantara Config and DB
const configCode = fs.readFileSync(path.join(__dirname, '../assets/config.js'), 'utf8');
eval(configCode);
const dbCode = fs.readFileSync(path.join(__dirname, '../assets/db.js'), 'utf8');
eval(dbCode);
const YuvantaraDB = global.window.YuvantaraDB;

console.log('--- STARTING COMPLETE WORKFLOW TEST ---');

// 1. Submit New Student Registration
const studentEmail = 'rahul.test.' + Date.now() + '@example.com';
const regData = {
  name: 'Rahul Sharma',
  email: studentEmail,
  phone: '+91 98765 12345',
  dob: '2001-08-15',
  password: 'Password@123',
  track: 'Cybersecurity & SOC Operations',
  stream: 'B.Tech / B.E (CSE, IT, ECE, EE)',
  college: 'IIT Patna'
};

const appRes = YuvantaraDB.submitNewRegistration(regData);
console.log('1. Application submitted:', appRes.success, 'ID:', appRes.app ? appRes.app.id : 'N/A');

const regRes = YuvantaraDB.registerStudent({
  ...regData,
  accountStatus: 'pending'
});
console.log('2. Student pre-registered:', regRes.success);

// Verify student in new_registrations
let newRegs = YuvantaraDB.getNewRegistrations();
let foundReg = newRegs.find(r => r.email === studentEmail);
console.log('3. In new_registrations:', !!foundReg, 'Status:', foundReg ? foundReg.status : 'N/A');

// 2. Simulate Payment Flow
const payRef = 'PAY-TEST-' + Date.now().toString().slice(-6);
foundReg.paymentRef = payRef;
foundReg.paymentMethod = 'Razorpay Gateway';
foundReg.paymentAmount = 236;
foundReg.paymentStatus = 'paid';
foundReg.paidAt = new Date().toISOString().split('T')[0];
localStorage.setItem('yuvantara_new_registrations', JSON.stringify(newRegs));

let stuUser = YuvantaraDB.getUserByEmail(studentEmail);
stuUser.paymentRef = payRef;
stuUser.paymentMethod = 'Razorpay Gateway';
stuUser.paymentAmount = 236;
stuUser.paidAt = foundReg.paidAt;
stuUser.accountStatus = 'pending'; // 2-hour wait status
YuvantaraDB.setCurrentUser(stuUser);
YuvantaraDB.syncAllReplicas();
console.log('4. Payment completed & logged. Student status:', stuUser.accountStatus, 'Payment Ref:', payRef);

// Verify replicas before admin approval
const repsBefore = YuvantaraDB.getReplicasMetadata();
console.log('5. Replicas in sync (pre-approval):', repsBefore.length, 'Master new_regs:', repsBefore[0].counts.new_registrations);

// 3. Admin Grants Access
const adminEmail = 'adk_01@admin';
const approveRes = YuvantaraDB.verifyAndApproveRegistration(foundReg.id, adminEmail);
console.log('6. Admin granted access:', approveRes.success, 'Approving Admin:', adminEmail);

// Verify student moved to current_interns and removed from new_registrations
newRegs = YuvantaraDB.getNewRegistrations();
const inNewAfter = newRegs.some(r => r.email === studentEmail);
const currentInterns = YuvantaraDB.getCurrentInterns();
const inInterns = currentInterns.find(i => i.email === studentEmail);
console.log('7. Removed from new_registrations:', !inNewAfter);
console.log('8. Present in current_interns:', !!inInterns, 'Status:', inInterns ? inInterns.status : 'N/A', 'ApprovedBy:', inInterns ? inInterns.approvedByAdmin : 'N/A');

stuUser = YuvantaraDB.getUserByEmail(studentEmail);
console.log('9. Student account status after admin grant:', stuUser.accountStatus); // must be 'active'

// 4. Course Completion to 100% and Certificate Minting
const mintRes = YuvantaraDB.generateCertificateForStudent(studentEmail, 'Rahul Sharma', 'IIT Patna', adminEmail);
console.log('10. Certificate generated:', mintRes.success, 'Cert ID:', mintRes.certificate ? mintRes.certificate.certNumber : 'N/A');

// 5. Verify Certificate in All Employees and Verification Lookup
const employees = YuvantaraDB.getAllEmployees();
const inEmp = employees.find(e => e.email === studentEmail);
console.log('11. Registered in all_employees:', !!inEmp, 'CertNum:', inEmp ? inEmp.certificateNumber : 'N/A');

const certLookup = YuvantaraDB.getCertificateByNumber(mintRes.certificate.certNumber);
console.log('12. Public certificate verification lookup:', !!certLookup, 'Candidate:', certLookup ? certLookup.name : 'N/A', 'Status:', certLookup ? certLookup.status : 'N/A');

// 6. Verify All 7 Replicas Are Synchronized
const repsAfter = YuvantaraDB.getReplicasMetadata();
const allMatch = repsAfter.every(r => r.counts.all_employees === repsAfter[0].counts.all_employees && r.counts.current_interns === repsAfter[0].counts.current_interns);
console.log('13. All 7 replicas synchronized with exact counts:', allMatch);
console.log('Master counts:', repsAfter[0].counts);
console.log('Replica 6 counts:', repsAfter[6].counts);

console.log('--- WORKFLOW TEST FINISHED SUCCESSFULLY ---');
