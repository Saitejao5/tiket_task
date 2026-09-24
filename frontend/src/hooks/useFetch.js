import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../services/api';
export default function useFetch(fn, deps = []) {
  const [state, set] = useState({ data: null, loading: true, error: '' });
  const seq = useRef(0);
  const run = useCallback(() => {
    const id = ++seq.current; set((s) => ({ ...s, loading: true, error: '' }));
    Promise.resolve(fn()).then((d) => id === seq.current && set({ data: d, loading: false, error: '' })).catch((e) => id === seq.current && set((s) => ({ ...s, loading: false, error: errMsg(e) })));
  }, deps); // eslint-disable-line
  useEffect(run, [run]);
  return { ...state, reload: run };
}
