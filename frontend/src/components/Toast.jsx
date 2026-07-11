import { useState, useCallback, useContext, createContext, useRef } from 'react';
import { ToastSuccessIcon, ToastErrorIcon } from './Icons';

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
      <div className="toast-container" aria-live="assertive" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type}${toast.fadingOut ? ' fade-out' : ''}`}
          >
            {toast.type === 'success' ? (
              <ToastSuccessIcon className="toast-icon" />
            ) : (
              <ToastErrorIcon className="toast-icon" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
