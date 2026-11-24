// scratch/generate_1000_users.js
// Enterprise Scale Dataset Generator: 1,000+ Realistic Test Users across 3 Database Categories & 7 Replicas
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.join(__dirname, '..', '..', '..', '..', 'Desktop', 'Start-up', 'provision-site');
const dataDir = path.join(projectRoot, 'data');
const assetsDir = path.join(projectRoot, 'assets');

const SALT = 'YUVANTARA_DEFENSE_PROD_SALT_@2026_PATNA#';
function hashPassword(password) {
  return 'SHA256$' + crypto.createHash('sha256').update(SALT + password + SALT).digest('hex');
}

const defaultStudentHash = hashPassword('student123');

const firstNames = [
  'Aarav', 'Rohan', 'Priya', 'Sneha', 'Vikram', 'Amit', 'Ananya', 'Rohit', 'Aditya', 'Neha',
  'Ishaan', 'Pooja', 'Rahul', 'Meera', 'Sanjay', 'Divya', 'Kunal', 'Shreya', 'Varun', 'Ritu',
  'Alok', 'Swati', 'Deepa', 'Rajesh', 'Rakesh', 'Manish', 'Sunita', 'Kavita', 'Harsh', 'Tanvi',
  'Arjun', 'Preeti', 'Deepak', 'Shalini', 'Aman', 'Simran', 'Tarun', 'Kriti', 'Nikhil', 'Anjali',
  'Gaurav', 'Bhavna', 'Mayank', 'Rupal', 'Sachin', 'Nisha', 'Vivek', 'Pallavi', 'Abhishek', 'Monika'
];

const lastNames = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Patel', 'Mishra', 'Roy', 'Das', 'Sen',
  'Prasad', 'Jha', 'Choudhary', 'Thakur', 'Sinha', 'Pandey', 'Yadav', 'Tiwari', 'Joshi', 'Shah',
  'Bhatt', 'Reddy', 'Nair', 'Menon', 'Bose', 'Mukherjee', 'Chatterjee', 'Banerjee', 'Biswas', 'Paul'
];

const colleges = [
  'National Institute of Technology (NIT), Patna',
  'Indian Institute of Technology (IIT), Patna',
  'Birla Institute of Technology (BIT), Patna Campus',
  'Patna University, Patna, Bihar',
  'Aryabhatta Knowledge University (AKU), Patna',
  'Muzaffarpur Institute of Technology (MIT), Muzaffarpur',
  'Bhagalpur College of Engineering (BCE), Bhagalpur',
  'Darbhanga College of Engineering (DCE), Darbhanga',
  'Gaya College of Engineering (GCE), Gaya',
  'Purnea University, Purnia, Bihar'
];

const streams = [
  'B.Tech (Computer Science & Engineering)',
  'B.Tech (Information Technology)',
  'B.Tech (Electronics & Communication)',
  'B.Tech (Electrical Engineering)',
  'BCA / B.Sc Computer Science',
  'MCA / M.Tech (Computer Applications)',
  'Diploma in Engineering'
];

const tracks = [
  { name: 'Cybersecurity & SOC Operations', code: 'CS', role: 'Junior SOC Analyst' },
  { name: 'Artificial Intelligence & Machine Learning', code: 'AI', role: 'Associate AI Engineer' },
  { name: 'Cloud Infrastructure & DevOps', code: 'CL', role: 'Cloud Infrastructure Specialist' },
  { name: 'Python Full-Stack & Automation', code: 'PY', role: 'Full-Stack Python Engineer' },
  { name: 'Robotics & IoT Embedded Systems', code: 'RB', role: 'Embedded Systems Specialist' },
  { name: 'Data Science & Business Analytics', code: 'DS', role: 'Associate Data Scientist' }
];

const admins = [
  'a4dr_00@supper',
  'adk_01@admin',
  'alk_01@admin',
  'dhb_03@admin',
  'abk_04@admin',
  'anp_05@admin',
  'rop_06@admin'
];

const replicaFiles = [
  { file: 'master_super_admin.json', email: 'a4dr_00@supper', role: 'superadmin', name: 'Super Admin Command' },
  { file: 'admin_adk_01.json', email: 'adk_01@admin', role: 'admin', name: 'Admin ADK-01 (Patna SOC)' },
  { file: 'admin_alk_01.json', email: 'alk_01@admin', role: 'admin', name: 'Admin ALK-01 (Gaya Cloud)' },
  { file: 'admin_dhb_03.json', email: 'dhb_03@admin', role: 'admin', name: 'Admin DHB-03 (Muzaffarpur Lab)' },
  { file: 'admin_abk_04.json', email: 'abk_04@admin', role: 'admin', name: 'Admin ABK-04 (Bhagalpur IoT)' },
  { file: 'admin_anp_05.json', email: 'anp_05@admin', role: 'admin', name: 'Admin ANP-05 (Darbhanga Unit)' },
  { file: 'admin_rop_06.json', email: 'rop_06@admin', role: 'admin', name: 'Admin ROP-06 (Purnia AI Command)' }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

console.log('Generating 1,050 unique test users across 3 categories...');

const newRegistrations = [];
const currentInterns = [];
const allEmployees = [];
const usersDb = [];
const auditLogs = [];

let userCounter = 1;

// 1. Generate 350 NEW REGISTRATIONS (Category 1)
for (let i = 1; i <= 350; i++) {
  const fName = randomChoice(firstNames);
  const lName = randomChoice(lastNames);
  const fullName = `${fName} ${lName}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@nitp.ac.in`;
  const phone = `+91 ${98000 + Math.floor(Math.random() * 1999)} ${pad(i * 17 % 100000, 5)}`;
  const dobYear = 2000 + (i % 5);
  const dobMonth = pad((i % 12) + 1, 2);
  const dobDay = pad((i % 28) + 1, 2);
  const dob = `${dobYear}-${dobMonth}-${dobDay}`;
  const trackObj = tracks[i % tracks.length];
  const college = colleges[i % colleges.length];
  const stream = streams[i % streams.length];
  const regId = `REG-${pad(i, 4)}`;

  const regItem = {
    id: regId,
    name: fullName,
    email: email,
    phone: phone,
    dob: dob,
    track: trackObj.name,
    stream: stream,
    college: college,
    registeredAt: `2026-11-${pad((i % 20) + 1, 2)}`,
    status: 'pending'
  };
  newRegistrations.push(regItem);

  // Pre-register in usersDb as pending
  usersDb.push({
    id: `USR-${pad(userCounter++, 5)}`,
    name: fullName,
    email: email,
    phone: phone,
    dob: dob,
    passwordHash: defaultStudentHash,
    role: 'student',
    track: trackObj.name,
    stream: stream,
    college: college,
    accountStatus: 'pending',
    registeredAt: regItem.registeredAt,
    progress: 0,
    offerLetter: null,
    invoice: null,
    certificate: null
  });
}

// 2. Generate 450 CURRENT INTERNS (Category 2)
for (let i = 1; i <= 450; i++) {
  const fName = randomChoice(firstNames);
  const lName = randomChoice(lastNames);
  const fullName = `${fName} ${lName}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${1000 + i}@iitp.ac.in`;
  const phone = `+91 ${87000 + Math.floor(Math.random() * 1999)} ${pad(i * 23 % 100000, 5)}`;
  const dobYear = 2000 + (i % 5);
  const dobMonth = pad((i % 12) + 1, 2);
  const dobDay = pad((i % 28) + 1, 2);
  const dob = `${dobYear}-${dobMonth}-${dobDay}`;
  const trackObj = tracks[i % tracks.length];
  const college = colleges[i % colleges.length];
  const stream = streams[i % streams.length];
  const internId = `INT-${pad(i, 4)}`;
  const approvingAdmin = admins[i % admins.length];
  const enrolledAt = `2026-0${(i % 5) + 1}-${pad((i % 25) + 1, 2)}`;
  const progressPct = 20 + ((i * 7) % 75); // between 20% and 95%

  const internItem = {
    id: internId,
    name: fullName,
    email: email,
    phone: phone,
    dob: dob,
    track: trackObj.name,
    stream: stream,
    college: college,
    enrolledAt: enrolledAt,
    progress: progressPct,
    status: 'active',
    approvedByAdmin: approvingAdmin,
    approvedAt: enrolledAt,
    modules: [
      { name: 'Module 1: Orientation & Foundations', status: 'completed' },
      { name: 'Module 2: Practical Lab Implementations', status: progressPct >= 40 ? 'completed' : 'in_progress' },
      { name: 'Module 3: Project Architecture & Execution', status: progressPct >= 60 ? 'completed' : progressPct >= 40 ? 'in_progress' : 'pending' },
      { name: 'Module 4: Mid-Term Assessment', status: progressPct >= 80 ? 'completed' : progressPct >= 60 ? 'in_progress' : 'pending' },
      { name: 'Module 5: Capstone Review & Final Submission', status: progressPct >= 95 ? 'completed' : 'pending' }
    ]
  };
  currentInterns.push(internItem);

  const stuId = `USR-${pad(userCounter++, 5)}`;
  usersDb.push({
    id: stuId,
    name: fullName,
    email: email,
    phone: phone,
    dob: dob,
    passwordHash: defaultStudentHash,
    role: 'student',
    track: trackObj.name,
    stream: stream,
    college: college,
    accountStatus: 'active',
    registeredAt: enrolledAt,
    enrolledByAdmin: approvingAdmin,
    progress: progressPct,
    modules: internItem.modules,
    offerLetter: {
      refNo: `YUV/HR/INT-2026/${stuId}`,
      date: enrolledAt,
      joiningDate: enrolledAt,
      track: trackObj.name,
      duration: '6 Months',
      college: college,
      stream: stream,
      status: 'Confirmed & Active'
    },
    invoice: {
      invNumber: `INV-2026-${stuId.replace('USR-', '')}`,
      date: enrolledAt,
      amount: 236,
      baseAmount: 200,
      gstAmount: 36,
      sacCode: '9992',
      paymentRef: `PAY-RZP-2026-${pad(i, 4)}`,
      status: 'PAID'
    },
    certificate: null
  });

  // Log verification in audit trail
  if (i <= 100) {
    auditLogs.push({
      id: `LOG-${pad(auditLogs.length + 1, 5)}`,
      timestamp: `${enrolledAt} 10:15:00`,
      adminEmail: approvingAdmin,
      actionType: 'VERIFY_AND_AUTHORIZE_INTERN',
      targetId: internId,
      targetUser: `${fullName} (${email})`,
      details: `Authorized applicant and moved to Current Interns database for track ${trackObj.name}`
    });
  }
}

// 3. Generate 250 ALL EMPLOYEES (Category 3)
for (let i = 1; i <= 250; i++) {
  const fName = randomChoice(firstNames);
  const lName = randomChoice(lastNames);
  const fullName = `${fName} ${lName}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${2000 + i}@yuvantara.com`;
  const phone = `+91 ${76000 + Math.floor(Math.random() * 1999)} ${pad(i * 31 % 100000, 5)}`;
  const dobYear = 1999 + (i % 4);
  const dobMonth = pad((i % 12) + 1, 2);
  const dobDay = pad((i % 28) + 1, 2);
  const dob = `${dobYear}-${dobMonth}-${dobDay}`;
  const trackObj = tracks[i % tracks.length];
  const college = colleges[i % colleges.length];
  const stream = streams[i % streams.length];
  const empId = `EMP-${pad(i, 4)}`;
  const certNumber = `YUV-2026-${trackObj.code}${pad(100 + i, 3)}`;
  const approvingAdmin = admins[i % admins.length];
  const issueDate = `2026-06-${pad((i % 25) + 1, 2)}`;
  const grades = ['Grade A+ (Distinction)', 'Grade A+ (Outstanding)', 'Grade A (Excellent)'];
  const grade = grades[i % grades.length];

  const employeeItem = {
    id: empId,
    name: fullName,
    email: email,
    phone: phone,
    dob: dob,
    role: trackObj.role,
    domain: trackObj.name,
    college: college,
    stream: stream,
    certificateNumber: certNumber,
    issueDate: issueDate,
    grade: grade,
    duration: '6 Months (Jan 2026 – Jun 2026)',
    authority: 'Yuvantara Academic & Cyber Defense Council',
    verificationUrl: `https://yuvantaraventure.in/verify-certificate/?id=${encodeURIComponent(certNumber)}`,
    status: 'completed',
    approvedByAdmin: approvingAdmin,
    approvedAt: issueDate
  };
  allEmployees.push(employeeItem);

  const stuId = `USR-${pad(userCounter++, 5)}`;
  usersDb.push({
    id: stuId,
    name: fullName,
    email: email,
    phone: phone,
    dob: dob,
    passwordHash: defaultStudentHash,
    role: 'student',
    track: trackObj.name,
    stream: stream,
    college: college,
    accountStatus: 'active',
    registeredAt: '2026-01-01',
    enrolledByAdmin: approvingAdmin,
    progress: 100,
    offerLetter: {
      refNo: `YUV/HR/INT-2026/${stuId}`,
      date: '2026-01-01',
      joiningDate: '2026-01-01',
      track: trackObj.name,
      duration: '6 Months',
      college: college,
      stream: stream,
      status: 'Completed & Certified'
    },
    invoice: {
      invNumber: `INV-2026-${stuId.replace('USR-', '')}`,
      date: '2026-01-01',
      amount: 236,
      baseAmount: 200,
      gstAmount: 36,
      sacCode: '9992',
      paymentRef: `PAY-RZP-2026-${pad(i + 500, 4)}`,
      status: 'PAID'
    },
    certificate: {
      id: certNumber,
      certNumber: certNumber,
      name: fullName,
      course: trackObj.name,
      title: `${trackObj.name} Industrial Internship`,
      dob: dob,
      email: email,
      phone: phone,
      college: college,
      date: issueDate,
      issueDate: issueDate,
      duration: '6 Months (Jan 2026 – Jun 2026)',
      grade: grade,
      authority: 'Yuvantara Academic & Cyber Defense Council',
      status: 'Valid & Verified',
      issuedByAdmin: approvingAdmin,
      issuedAt: `${issueDate} 12:00:00`,
      qrCodeUrl: `https://yuvantaraventure.in/verify-certificate/index.html?id=${encodeURIComponent(certNumber)}`
    }
  });

  // Log graduation in audit trail
  if (i <= 100) {
    auditLogs.push({
      id: `LOG-${pad(auditLogs.length + 1, 5)}`,
      timestamp: `${issueDate} 16:30:00`,
      adminEmail: approvingAdmin,
      actionType: 'GRADUATE_TO_ALL_EMPLOYEES',
      targetId: certNumber,
      targetUser: `${fullName} (${email})`,
      details: `Graduated intern to All Employees with Certificate ${certNumber} (${grade})`
    });
  }
}

// Add System Administrators into usersDb
const adminAccounts = [
  { id: 'SUPER-001', name: 'Super Administrator', email: 'a4dr_00@supper', passwordHash: hashPassword('!!a4dr@00'), role: 'superadmin', phone: '+91 98765 00000' },
  { id: 'ADM-01', name: 'Admin ADK-01', email: 'adk_01@admin', passwordHash: hashPassword('!adk_01@'), role: 'admin', phone: '+91 98765 00001' },
  { id: 'ADM-02', name: 'Admin ALK-01', email: 'alk_01@admin', passwordHash: hashPassword('!alk_01@'), role: 'admin', phone: '+91 98765 00002' },
  { id: 'ADM-03', name: 'Admin DHB-03', email: 'dhb_03@admin', passwordHash: hashPassword('!dhb_03@'), role: 'admin', phone: '+91 98765 00003' },
  { id: 'ADM-04', name: 'Admin ABK-04', email: 'abk_04@admin', passwordHash: hashPassword('!abk_04@'), role: 'admin', phone: '+91 98765 00004' },
  { id: 'ADM-05', name: 'Admin ANP-05', email: 'anp_05@admin', passwordHash: hashPassword('!anp_05@'), role: 'admin', phone: '+91 98765 00005' },
  { id: 'ADM-06', name: 'Admin ROP-06', email: 'rop_06@admin', passwordHash: hashPassword('!rop_06@'), role: 'admin', phone: '+91 98765 00006' }
];

adminAccounts.forEach(adm => {
  usersDb.unshift({
    id: adm.id,
    name: adm.name,
    email: adm.email,
    passwordHash: adm.passwordHash,
    role: adm.role,
    status: 'active',
    registeredAt: '2026-01-01',
    phone: adm.phone
  });
});

console.log(`Generated:`);
console.log(`- 1. New Registrations: ${newRegistrations.length}`);
console.log(`- 2. Current Interns:   ${currentInterns.length}`);
console.log(`- 3. All Employees:     ${allEmployees.length}`);
console.log(`- Total Test Users:     ${newRegistrations.length + currentInterns.length + allEmployees.length} (exceeds 1,000 requirement)`);
console.log(`- User Auth Records:    ${usersDb.length}`);
console.log(`- System Audit Logs:    ${auditLogs.length}`);

// Write to all 7 replicas
const payload = {
  new_registrations: newRegistrations,
  current_interns: currentInterns,
  all_employees: allEmployees,
  audit_logs: auditLogs,
  lastSynced: new Date().toISOString()
};

replicaFiles.forEach(rep => {
  const repData = Object.assign({}, payload, {
    replicaId: rep.file.replace('.json', ''),
    adminEmail: rep.email,
    adminRole: rep.role,
    adminName: rep.name
  });
  const targetPath = path.join(dataDir, rep.file);
  fs.writeFileSync(targetPath, JSON.stringify(repData, null, 2), 'utf8');
  console.log(`[WRITTEN] ${rep.file} (${(fs.statSync(targetPath).size / 1024).toFixed(1)} KB)`);
});

// Also write master_students.json and audit_trail.json
fs.writeFileSync(path.join(dataDir, 'master_students.json'), JSON.stringify(usersDb, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'audit_trail.json'), JSON.stringify(auditLogs, null, 2), 'utf8');

// Write assets/seed_1000_users.json for client-side hydration
fs.writeFileSync(path.join(assetsDir, 'seed_1000_users.json'), JSON.stringify({
  new_registrations: newRegistrations,
  current_interns: currentInterns,
  all_employees: allEmployees,
  users: usersDb,
  audit_logs: auditLogs
}), 'utf8');
console.log(`[WRITTEN] assets/seed_1000_users.json`);

console.log('\n🎉 Successfully generated and seeded 1,050+ test users across all 7 database replicas!');
