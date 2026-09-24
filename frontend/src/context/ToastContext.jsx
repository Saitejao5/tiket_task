import { createContext, useContext, useState, useCallback } from 'react';
const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => { const id = Math.random(); setItems((a) => [...a, { id, message, type }]); setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), 4500); }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.type}`}><b>{t.type === 'error' ? 'Error: ' : 'Done: '}</b>{t.message}</div>)}
      </div>
    </Ctx.Provider>
  );
}
