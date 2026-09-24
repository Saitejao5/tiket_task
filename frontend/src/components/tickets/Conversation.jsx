import { useState } from 'react';
import { fmtDate, fmtSize } from '../../utils/format';
import * as messages from '../../services/messages';
import { errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Empty } from '../ui';
export function Conversation({ items, userId }) {
  const toast = useToast();
  const dl = (a) => messages.download(a.filename, a.originalName).catch((e) => toast(errMsg(e), 'error'));
  if (!items.length) return <Empty title="No messages yet" hint="Replies between the student and support team appear here." />;
  return (
    <ol className="convo" aria-label="Conversation">{items.map((m) => (
      <li key={m._id} className={`msg ${m.type === 'Internal Note' ? 'note' : ''} ${String(m.sender?._id) === String(userId) ? 'mine' : ''}`}>
        <header><b>{m.sender?.name}</b><span className="role">{m.sender?.role === 'student' ? 'Student' : 'Support'}</span>{m.type === 'Internal Note' && <span className="badge notebadge">Internal note · staff only</span>}<time>{fmtDate(m.createdAt)}</time></header>
        {m.content && <p>{m.content}</p>}
        {m.attachments?.length > 0 && <ul className="files">{m.attachments.map((a) => <li key={a.filename}><button className="link" onClick={() => dl(a)}>{a.originalName}</button> <small>{fmtSize(a.size)}</small></li>)}</ul>}
      </li>))}</ol>
  );
}
export function ReplyBox({ ticket, isStaff, onSent, send }) {
  const toast = useToast(); const [type, setType] = useState('Public Reply'); const [text, setText] = useState(''); const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false);
  const pick = (e) => { const f = [...e.target.files]; if (f.length > 5) toast('You can attach up to 5 files.', 'error'); setFiles(f.slice(0, 5)); e.target.value = ''; };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true);
    const fd = new FormData(); fd.append('type', type); fd.append('content', text); files.forEach((f) => fd.append('attachments', f));
    try { await send(fd); setText(''); setFiles([]); toast(type === 'Internal Note' ? 'Internal note added' : 'Reply sent'); onSent(); } catch (er) { toast(errMsg(er), 'error'); } finally { setBusy(false); }
  };
  if (!ticket.capabilities.reply && !isStaff) return <p className="muted">This ticket is closed. Reopen it to send another message.</p>;
  return (
    <form className={`reply ${type === 'Internal Note' ? 'is-note' : ''}`} onSubmit={submit}>
      {isStaff && <div className="seg" role="radiogroup" aria-label="Message type">{['Public Reply', 'Internal Note'].map((t) => <button type="button" key={t} role="radio" aria-checked={type === t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t === 'Public Reply' ? 'Reply to student' : 'Internal note'}</button>)}</div>}
      {type === 'Internal Note' && <p className="hint">Internal notes are only visible to staff and managers.</p>}
      <label className="field"><span className="lbl">{type === 'Internal Note' ? 'Note' : 'Your reply'}</span><textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder={type === 'Internal Note' ? 'Add context for your colleagues…' : 'Write a message…'} /></label>
      <div className="row between wrap">
        <div><label className="btn sm filebtn">Attach files<input type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={pick} /></label><small className="muted"> PDF, JPG, PNG, DOC, DOCX · up to 5 files, 10 MB each</small></div>
        <button className="btn primary" disabled={busy || (!text.trim() && !files.length)}>{busy ? (files.length ? 'Uploading…' : 'Sending…') : type === 'Internal Note' ? 'Add note' : 'Send reply'}</button>
      </div>
      {files.length > 0 && <ul className="files">{files.map((f, i) => <li key={i}>{f.name} <small>{fmtSize(f.size)}</small> <button type="button" className="link" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>}
    </form>
  );
}
