export const fmtDate = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
export const fmtDay = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fromNow = (d) => { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} hr ago`; if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`; return fmtDay(d); };
export const fmtAge = (h) => (h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 24 ? `${Math.round(h)} hours` : `${Math.round(h / 24)} days`);
export const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const STATUSES = ['Open', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Reopened'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const SLA_STATUSES = ['Within SLA', 'Due Soon', 'SLA Breached'];
export const AGE_BUCKETS = [['lt1d', 'Less than 24 hours'], ['1to3d', '1 to 3 days'], ['3to7d', '3 to 7 days'], ['7to14d', '7 to 14 days'], ['gt14d', 'More than 14 days']];
export const ACTIONS = ['TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_ASSIGNED', 'TICKET_REASSIGNED', 'PRIORITY_CHANGED', 'STATUS_CHANGED', 'PUBLIC_REPLY_ADDED', 'INTERNAL_NOTE_ADDED', 'ATTACHMENT_UPLOADED', 'TICKET_RESOLVED', 'TICKET_REOPENED', 'TICKET_CLOSED', 'TICKET_DELETED', 'USER_CREATED', 'USER_UPDATED'];
export const actionLabel = (a) => a.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
export const describe = (h, isStudent) => {
  const who = h.actor?.name || 'Someone';
  switch (h.action) {
    case 'TICKET_CREATED': return `${who} created the request`;
    case 'TICKET_ASSIGNED': return isStudent ? 'Request assigned to a support team member' : `${who} assigned the ticket to ${h.metadata?.assigneeName || 'a staff member'}`;
    case 'TICKET_REASSIGNED': return isStudent ? 'Request reassigned within the support team' : `${who} reassigned the ticket to ${h.metadata?.assigneeName || 'another staff member'}`;
    case 'PRIORITY_CHANGED': return `${who} changed priority from ${h.previousValue} to ${h.newValue}`;
    case 'STATUS_CHANGED': case 'TICKET_RESOLVED': case 'TICKET_CLOSED': case 'TICKET_REOPENED': return `${who} changed status from ${h.previousValue} to ${h.newValue}`;
    case 'PUBLIC_REPLY_ADDED': return `${who} sent a reply`;
    case 'INTERNAL_NOTE_ADDED': return `${who} added an internal note`;
    case 'ATTACHMENT_UPLOADED': return `${who} uploaded ${h.metadata?.files?.length || ''} attachment(s)`;
    case 'TICKET_UPDATED': return `${who} edited the ticket details`;
    default: return `${who}: ${actionLabel(h.action)}`;
  }
};
