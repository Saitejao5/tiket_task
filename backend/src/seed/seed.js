// DEVELOPMENT ONLY: wipes the database and loads demo data. Run: npm run seed
const mongoose = require('mongoose');
const env = require('../config/env');
const connect = require('../config/db');
const M = { User: require('../models/User'), Department: require('../models/Department'), Category: require('../models/Category'), SlaPolicy: require('../models/SlaPolicy'), Ticket: require('../models/Ticket'), Message: require('../models/Message'), Notification: require('../models/Notification'), AuditLog: require('../models/AuditLog'), Counter: require('../models/Counter'), Setting: require('../models/Setting') };
const { hash } = require('../services/user.service');
const sla = require('../services/sla.service');
const { format } = require('../utils/ticketNumber');
const PASSWORD = 'Password@123';
const H = 36e5, ago = (h) => new Date(Date.now() - h * H);
const pick = (a, i) => a[i % a.length];

(async () => {
  await connect();
  for (const m of Object.values(M)) { if (m === M.AuditLog) await m.collection.deleteMany({}); else await m.deleteMany({}); }
  const passwordHash = await hash(PASSWORD);
  const depts = await M.Department.insertMany([['Computer Science', 'CSE'], ['Electronics', 'ECE'], ['Mechanical', 'ME'], ['Civil', 'CE']].map(([name, code]) => ({ name, code, description: `Department of ${name}` })));
  const [cse, ece, me, ce] = depts;
  const policies = await M.SlaPolicy.insertMany([['Low', 24, 72], ['Medium', 12, 48], ['High', 4, 24], ['Urgent', 1, 8]].map(([priority, f, r]) => ({ name: `${priority} priority`, priority, firstResponseHours: f, resolutionHours: r })));
  const OTHER = ['Other'];
  const cats = await M.Category.insertMany([
    ['Fees', ['Payment Issue', 'Receipt Issue', 'Refund', 'Outstanding Amount', 'Other'], 'High'], ['Attendance', ['Incorrect Attendance', 'Attendance Correction', 'Low Attendance', 'Other'], 'Medium'],
    ['ID Card', ['New ID Card', 'Lost ID Card', 'Damaged ID Card', 'Other'], 'Low'], ['Certificates and Documents', ['Bonafide Certificate', 'Transfer Certificate', 'Study Certificate', 'Other'], 'Medium'],
    ['Examination', OTHER, 'High'], ['Hostel', OTHER, 'Medium'], ['Transport', OTHER, 'Low'], ['Library', OTHER, 'Low'], ['Technical Support', OTHER, 'Medium'], ['General', OTHER, 'Low'],
  ].map(([name, subcategories, defaultPriority]) => ({ name, subcategories, defaultPriority, description: `${name} related requests` })));
  const cat = Object.fromEntries(cats.map((c) => [c.name, c]));
  const mk = (name, email, role, extra = {}) => ({ name, email, role, passwordHash, ...extra });
  const admin = await M.User.create(mk('Aarav Admin', 'admin@college.edu', 'admin'));
  const managers = await M.User.insertMany([mk('Meera Manager', 'manager1@college.edu', 'manager', { department: cse._id }), mk('Manish Manager', 'manager2@college.edu', 'manager', { department: ece._id })]);
  const staff = await M.User.insertMany(['Sneha Rao:cse', 'Rahul Nair:cse', 'Priya Shah:cse', 'Karan Mehta:ece', 'Divya Iyer:ece'].map((s, i) => { const [n, d] = s.split(':'); return mk(n, `staff${i + 1}@college.edu`, 'staff', { department: d === 'cse' ? cse._id : ece._id }); }));
  const names = ['Ananya Sharma', 'Rohan Gupta', 'Ishita Verma', 'Arjun Reddy', 'Kavya Menon', 'Vikram Singh', 'Neha Patel', 'Aditya Kumar', 'Pooja Joshi', 'Siddharth Rao', 'Riya Kapoor', 'Manav Bansal', 'Tanvi Desai', 'Yash Malhotra', 'Sana Khan', 'Dev Chatterjee', 'Lakshmi Pillai', 'Harsh Agarwal', 'Nikita Bose', 'Farhan Ali'];
  const students = await M.User.insertMany(names.map((n, i) => mk(n, `student${i + 1}@college.edu`, 'student', { studentId: `STU${String(2026001 + i)}`, department: i < 12 ? cse._id : i < 18 ? ece._id : me._id, course: 'B.Tech', year: String(1 + (i % 4)), section: 'ABC'[i % 3] })));
  const T = [['Attendance', 'Incorrect Attendance', 'Attendance not updated for Data Structures lab', 'My attendance for the last two weeks of the DS lab shows absent although I attended every session.'], ['Fees', 'Payment Issue', 'Semester fee paid but not reflected', 'I paid the semester fee online on Monday and the amount was deducted, but the portal still shows it as outstanding.'], ['ID Card', 'Lost ID Card', 'Lost my ID card', 'I lost my ID card in the library. Please issue a duplicate.'], ['Certificates and Documents', 'Bonafide Certificate', 'Bonafide certificate for bank loan', 'I need a bonafide certificate for an education loan application.'], ['Examination', 'Other', 'Hall ticket missing subject', 'My hall ticket does not list the Signals and Systems paper.'], ['Hostel', 'Other', 'Water leakage in room 214', 'There is water leakage from the ceiling in my hostel room.'], ['Transport', 'Other', 'Bus route change request', 'Requesting a stop near Lakeview Colony on the morning route.'], ['Library', 'Other', 'Book renewal blocked', 'The library system blocks renewal of a book with no pending fine.'], ['Technical Support', 'Other', 'Cannot log in to LMS', 'The LMS says my account is locked since yesterday.'], ['General', 'Other', 'Request for scholarship information', 'Where can I find the list of scholarships available for second year students?'], ['Attendance', 'Attendance Correction', 'Correction for medical leave', 'Attendance for 3 days of medical leave needs to be corrected. Certificate attached.'], ['Fees', 'Receipt Issue', 'Need fee receipt for tuition', 'I did not receive the receipt for the tuition payment.']];
  const flows = [['Open'], ['Assigned'], ['Assigned', 'In Progress'], ['Assigned', 'In Progress', 'Pending'], ['Assigned', 'In Progress', 'Resolved'], ['Assigned', 'In Progress', 'Resolved', 'Closed'], ['Assigned', 'In Progress', 'Resolved', 'Reopened'], ['Assigned', 'In Progress']];
  const prios = ['Medium', 'High', 'Low', 'Urgent', 'Medium', 'Low'];
  const CNT = 36; const notes = ['Verified with the accounts office. Payment reference matches.', 'Student called the helpdesk earlier; escalated to the exam cell.', 'Waiting for the department head to approve the correction.'];
  for (let i = 0; i < CNT; i++) {
    const [cn, sub, subject, description] = pick(T, i * 5 + 1); const st = pick(students, i * 7 + 3); const priority = pick(prios, i); const flow = pick(flows, i);
    const fin0 = flow[flow.length - 1]; const done = ['Resolved', 'Closed'].includes(fin0); const created = ago(done ? 30 + ((i * 37) % 380) : i % 9 === 0 ? 90 + ((i * 13) % 200) : 1 + ((i * 11) % 60)); const dept = st.department; const c = cat[cn];
    const assignee = flow.length ? pick(staff.filter((s) => String(s.department) === String(dept)).concat(staff), i) : null;
    const policy = await sla.policyFor(priority, c); const final = flow[flow.length - 1];
    const t = new M.Ticket({ ticketNumber: format(new Date().getFullYear(), i + 1), student: st._id, department: dept, category: c._id, subcategory: sub, subject, description, priority, status: 'Open', createdAt: created, updatedAt: created, lastActivityAt: created, ...sla.deadlines(created, policy) });
    const A = [{ actor: st._id, action: 'TICKET_CREATED', newValue: { status: 'Open', priority }, at: created }];
    const msgs = [];
    let cur = new Date(+created + 0.6 * H);
    if (flow[0] !== 'Open') {
      t.assignedTo = assignee._id; const mgr = pick(managers, i);
      A.push({ actor: mgr._id, action: 'TICKET_ASSIGNED', previousValue: null, newValue: String(assignee._id), metadata: { assigneeName: assignee.name }, at: cur });
      let prev = 'Open';
      for (const s of flow) {
        cur = new Date(+cur + (0.5 + (i % 5)) * H); if (+cur > Date.now()) cur = new Date(Date.now() - 0.1 * H);
        A.push({ actor: assignee._id, action: { Resolved: 'TICKET_RESOLVED', Closed: 'TICKET_CLOSED', Reopened: 'TICKET_REOPENED' }[s] || 'STATUS_CHANGED', previousValue: prev, newValue: s, at: cur });
        if (s === 'In Progress' && !t.firstResponseAt) { t.firstResponseAt = cur; msgs.push({ sender: assignee._id, type: 'Public Reply', content: 'Hello, we have picked this up and are looking into it.', at: cur }); msgs.push({ sender: st._id, type: 'Public Reply', content: 'Thank you. Please let me know if you need any documents from my side.', at: new Date(+cur + 1.5 * H) }); msgs.push({ sender: assignee._id, type: 'Internal Note', content: pick(notes, i), at: new Date(+cur + 2 * H) }); }
        if (s === 'Resolved') t.resolvedAt = cur; if (s === 'Closed') t.closedAt = cur; if (s === 'Reopened') { t.resolvedAt = null; msgs.push({ sender: st._id, type: 'Public Reply', content: 'The issue is still not fixed on my side, please check again.', at: cur }); }
        prev = s;
      }
    }
    t.status = final; t.lastActivityAt = cur; t.slaStatus = sla.computeStatus(t, 25);
    t.$locals = {}; await t.save({ timestamps: false });
    await M.AuditLog.insertMany(A.map(({ at, ...a }) => ({ ...a, ticket: t._id, createdAt: at })));
    if (msgs.length) await M.Message.insertMany(msgs.map(({ at, ...m }) => ({ ...m, ticket: t._id, createdAt: at, updatedAt: at })));
    await M.Notification.insertMany([{ recipient: st._id, type: 'TICKET_CREATED', title: 'Request submitted', message: `${t.ticketNumber} has been created.`, ticket: t._id, read: i % 3 !== 0, createdAt: created }, ...(t.assignedTo ? [{ recipient: t.assignedTo, type: 'TICKET_ASSIGNED', title: 'New ticket assigned', message: `${t.ticketNumber}: ${t.subject}`, ticket: t._id, read: i % 2 === 0, createdAt: cur }] : [{ recipient: pick(managers, i)._id, type: 'UNASSIGNED_TICKET', title: 'New unassigned ticket', message: `${t.ticketNumber}: ${t.subject}`, ticket: t._id, read: false, createdAt: created }])]);
  }
  await M.Counter.create({ _id: `ticket-${new Date().getFullYear()}`, seq: CNT });
  await M.Setting.create({});
  console.log(`Seeded: 1 admin, ${managers.length} managers, ${staff.length} staff, ${students.length} students, ${CNT} tickets.\nDEV-ONLY password for all demo users: ${PASSWORD}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
