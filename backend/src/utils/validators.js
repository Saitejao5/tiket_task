const { z } = require('zod');
const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const opt = (s) => s.optional().or(z.literal('').transform(() => undefined));
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Open', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Reopened'];
const ROLES = ['student', 'staff', 'manager', 'admin'];
module.exports = {
  PRIORITIES, STATUSES, ROLES,
  login: z.object({ email: z.string().email(), password: z.string().min(1) }),
  register: z.object({ name: z.string().trim().min(2), email: z.string().email(), password: z.string().min(8, 'Password must be at least 8 characters'), studentId: z.string().trim().min(2), department: opt(id), course: opt(z.string().trim()), year: opt(z.string().trim()), section: opt(z.string().trim()) }),
  profile: z.object({ name: z.string().trim().min(2).optional(), currentPassword: z.string().optional(), newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(), course: z.string().optional(), year: z.string().optional(), section: z.string().optional() }),
  ticketCreate: z.object({ category: id, subcategory: opt(z.string().trim()), subject: z.string().trim().min(3).max(200), description: z.string().trim().min(5), priority: opt(z.enum(['Normal', 'Urgent', ...PRIORITIES])) }),
  ticketUpdate: z.object({ subject: z.string().trim().min(3).max(200).optional(), description: z.string().trim().min(5).optional(), subcategory: z.string().trim().optional(), category: id.optional() }),
  status: z.object({ status: z.enum(STATUSES) }),
  priority: z.object({ priority: z.enum(PRIORITIES) }),
  assign: z.object({ assignedTo: id }),
  reason: z.object({ reason: z.string().trim().max(500).optional() }),
  message: z.object({ type: z.enum(['Public Reply', 'Internal Note']).default('Public Reply'), content: z.string().trim().max(5000).default('') }),
  userCreate: z.object({ name: z.string().trim().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(ROLES), studentId: opt(z.string().trim()), department: opt(id), course: opt(z.string().trim()), year: opt(z.string().trim()), section: opt(z.string().trim()) }),
  userUpdate: z.object({ name: z.string().trim().min(2).optional(), email: z.string().email().optional(), password: z.string().min(8).optional(), role: z.enum(ROLES).optional(), studentId: z.string().trim().optional(), department: z.union([id, z.literal(''), z.null()]).optional(), course: z.string().optional(), year: z.string().optional(), section: z.string().optional(), active: z.boolean().optional() }),
  department: z.object({ name: z.string().trim().min(2), code: z.string().trim().min(2).max(10), description: z.string().optional(), active: z.boolean().optional() }),
  department_patch: z.object({ name: z.string().trim().min(2).optional(), code: z.string().trim().min(2).max(10).optional(), description: z.string().optional(), active: z.boolean().optional() }),
  category: z.object({ name: z.string().trim().min(2), description: z.string().optional(), department: z.union([id, z.null(), z.literal('')]).optional(), subcategories: z.array(z.string().trim().min(1)).default([]), defaultPriority: z.enum(PRIORITIES).default('Medium'), slaPolicy: z.union([id, z.null(), z.literal('')]).optional(), active: z.boolean().optional() }),
  sla: z.object({ name: z.string().trim().min(2), priority: z.enum(PRIORITIES), firstResponseHours: z.number().positive(), resolutionHours: z.number().positive(), active: z.boolean().optional() }),
  settings: z.object({ reopenWindowDays: z.number().int().min(0).max(365).optional(), dueSoonPercent: z.number().int().min(1).max(90).optional(), pendingAlertThreshold: z.number().int().min(1).optional() }),
};
