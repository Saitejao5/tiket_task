import { describe, fmtDate } from '../../utils/format';
import { Empty } from '../ui';
export default function Timeline({ items, isStudent }) {
  if (!items.length) return <Empty title="No activity yet" />;
  return <ol className="timeline">{[...items].reverse().map((h) => <li key={h._id}><span>{describe(h, isStudent)}</span><time>{fmtDate(h.createdAt)}</time></li>)}</ol>;
}
