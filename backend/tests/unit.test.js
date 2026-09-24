process.env.MONGO_URI ||= 'mongodb://127.0.0.1:27017/x'; process.env.JWT_SECRET ||= 'test';
const test = require('node:test'), assert = require('node:assert');
const sla = require('../src/services/sla.service');
const { format } = require('../src/utils/ticketNumber');
const { TRANSITIONS } = require('../src/services/ticket.service');
test('ticket number format', () => assert.equal(format(2026, 2), 'TKT-2026-000002'));
test('SLA deadlines from policy', () => { const d = sla.deadlines(new Date(0), { firstResponseHours: 4, resolutionHours: 24 }); assert.equal(+d.firstResponseDue, 4 * 36e5); assert.equal(+d.resolutionDue, 24 * 36e5); });
test('SLA status: within / due soon / breached', () => {
  const now = new Date(100 * 36e5), base = { createdAt: new Date(0), firstResponseAt: new Date(1), firstResponseDue: new Date(4e6) };
  assert.equal(sla.computeStatus({ ...base, resolutionDue: new Date(200 * 36e5) }, 25, now), 'Within SLA');
  assert.equal(sla.computeStatus({ ...base, resolutionDue: new Date(110 * 36e5) }, 25, now), 'Due Soon');
  assert.equal(sla.computeStatus({ ...base, resolutionDue: new Date(90 * 36e5) }, 25, now), 'SLA Breached');
});
test('status transition map matches PRD', () => {
  assert.deepEqual(TRANSITIONS.Open, ['Assigned', 'In Progress']); assert.deepEqual(TRANSITIONS.Closed, ['Reopened']); assert.deepEqual(TRANSITIONS.Reopened, ['In Progress']); assert.ok(!TRANSITIONS.Open.includes('Resolved'));
});
