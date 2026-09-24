import { useEffect, useState } from 'react';
export default function useDebounce(v, ms = 350) { const [d, set] = useState(v); useEffect(() => { const t = setTimeout(() => set(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }
