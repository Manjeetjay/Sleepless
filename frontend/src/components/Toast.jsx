import { useState, useCallback, useContext, createContext, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type, fadingOut: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fadingOut: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 350);
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none" aria-live="assertive" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-sm rounded-xl border shadow-xl shadow-black/50 backdrop-blur-xl transition-all duration-300 ${
              toast.fadingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-[slideUp_0.3s_ease-out_forwards]'
            } ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200' 
                : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
