// Integration test. Requires a running MongoDB and `npm run seed` first (uses demo accounts).
const test = require('node:test'), assert = require('node:assert');
const st = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const PW = 'Password@123'; const api = st(app); const tok = {}; let ticket, staffId;
const login = async (k, email) => { const r = await api.post('/api/auth/login').send({ email, password: PW }); assert.equal(r.status, 200); tok[k] = r.body.data.token; return r.body.data.user; };
const as = (k) => ({ Authorization: `Bearer ${tok[k]}` });
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
test.before(async () => { await mongoose.connect(process.env.MONGO_URI); });
test.after(async () => { await mongoose.disconnect(); });
test('invalid login rejected; protected routes need a token', async () => {
  assert.equal((await api.post('/api/auth/login').send({ email: 'student1@college.edu', password: 'wrong-password' })).status, 401);
  assert.equal((await api.get('/api/tickets')).status, 401);
});
test('full student → manager → staff → closure workflow', async () => {
  await login('student', 'student1@college.edu'); await login('other', 'student2@college.edu'); await login('manager', 'manager1@college.edu'); const s = await login('staff', 'staff1@college.edu'); staffId = s._id; await login('admin', 'admin@college.edu');
  const cats = (await api.get('/api/categories').set(as('student'))).body.data; const att = cats.find((c) => c.name === 'Attendance');
  const c = await api.post('/api/tickets').set(as('student')).field('category', att._id).field('subcategory', 'Incorrect Attendance').field('subject', `Workflow test ticket ${Date.now()}`).field('description', 'Attendance is wrong for last week.').field('priority', 'Urgent').attach('attachments', PNG, { filename: 'proof.png', contentType: 'image/png' });
  assert.equal(c.status, 201); ticket = c.body.data; assert.match(ticket.ticketNumber, /^TKT-\d{4}-\d{6}$/); assert.equal(ticket.status, 'Open'); assert.ok(ticket.resolutionDue);
  assert.equal((await api.get(`/api/tickets/${ticket._id}`).set(as('other'))).status, 404, 'student isolation');
  assert.equal((await api.patch(`/api/tickets/${ticket._id}/assign`).set(as('student')).send({ assignedTo: staffId })).status, 403);
  const a = await api.patch(`/api/tickets/${ticket._id}/assign`).set(as('manager')).send({ assignedTo: staffId }); assert.equal(a.status, 200); assert.equal(a.body.data.status, 'Assigned');
  assert.equal((await api.patch(`/api/tickets/${ticket._id}/status`).set(as('staff')).send({ status: 'Resolved' })).status, 409, 'invalid transition');
  assert.equal((await api.patch(`/api/tickets/${ticket._id}/status`).set(as('staff')).send({ status: 'In Progress' })).status, 200);
  assert.equal((await api.post(`/api/tickets/${ticket._id}/messages`).set(as('staff')).send({ type: 'Public Reply', content: 'We are checking.' })).status, 201);
  assert.equal((await api.post(`/api/tickets/${ticket._id}/messages`).set(as('staff')).send({ type: 'Internal Note', content: 'SECRET-NOTE' })).status, 201);
  assert.equal((await api.post(`/api/tickets/${ticket._id}/messages`).set(as('student')).send({ type: 'Internal Note', content: 'x' })).status, 403);
  const sm = await api.get(`/api/tickets/${ticket._id}/messages`).set(as('student')); assert.ok(!JSON.stringify(sm.body).includes('SECRET-NOTE'));
  assert.ok(JSON.stringify((await api.get(`/api/tickets/${ticket._id}/messages`).set(as('staff'))).body).includes('SECRET-NOTE'));
  const bad = await api.post(`/api/tickets/${ticket._id}/messages`).set(as('student')).field('content', 'fake').attach('attachments', Buffer.from('not a real pdf'), { filename: 'x.pdf', contentType: 'application/pdf' }); assert.equal(bad.status, 422);
  assert.equal((await api.patch(`/api/tickets/${ticket._id}/status`).set(as('staff')).send({ status: 'Resolved' })).status, 200);
  const closed = await api.post(`/api/tickets/${ticket._id}/close`).set(as('student')); assert.equal(closed.status, 200); assert.equal(closed.body.data.status, 'Closed');
  const re = await api.post(`/api/tickets/${ticket._id}/reopen`).set(as('student')).send({ reason: 'Still wrong' }); assert.equal(re.status, 200); assert.equal(re.body.data.status, 'Reopened');
  const hist = (await api.get(`/api/tickets/${ticket._id}/history`).set(as('manager'))).body.data.map((h) => h.action);
  for (const x of ['TICKET_CREATED', 'TICKET_ASSIGNED', 'STATUS_CHANGED', 'INTERNAL_NOTE_ADDED', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'TICKET_REOPENED']) assert.ok(hist.includes(x), x);
  assert.ok(!(await api.get(`/api/tickets/${ticket._id}/history`).set(as('student'))).body.data.some((h) => h.action === 'INTERNAL_NOTE_ADDED'));
  const n = await api.get('/api/notifications').set(as('staff')); assert.ok(n.body.data.items.some((x) => x.type === 'TICKET_ASSIGNED'));
});
test('search, filters, pagination and dashboards', async () => {
  const l = await api.get('/api/tickets?search=workflow test&status=Reopened&limit=5').set(as('manager')); assert.equal(l.status, 200); assert.ok(l.body.data.items.length >= 1); assert.equal(l.body.data.pagination.limit, 5);
  assert.equal((await api.get('/api/tickets?age=lt1d&slaStatus=Within SLA&priority=High').set(as('admin'))).status, 200);
  for (const [k, p] of [['student', 'student'], ['staff', 'staff'], ['manager', 'manager'], ['admin', 'admin']]) { const d = await api.get(`/api/dashboard/${p}`).set(as(k)); assert.equal(d.status, 200, p); }
  assert.equal((await api.get('/api/dashboard/admin').set(as('manager'))).status, 403);
  assert.equal((await api.get('/api/users').set(as('student'))).status, 403);
});
test('audit logs are append-only', async () => {
  const AuditLog = require('../src/models/AuditLog'); const one = await AuditLog.findOne();
  await assert.rejects(() => AuditLog.updateOne({ _id: one._id }, { action: 'X' })); await assert.rejects(() => AuditLog.deleteMany({}));
});
