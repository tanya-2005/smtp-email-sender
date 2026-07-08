import { useCallback, useRef, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback(
    ({ type = 'success', message, duration = 5000 }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type, message }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="alert">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="toast__icon" />
            ) : (
              <XCircle size={18} className="toast__icon" />
            )}
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__dismiss"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
