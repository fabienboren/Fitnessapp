import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import "./toast.css";

interface ToastOptions {
  message: string;
  action?: { label: string; to: string };
}

const ToastContext = createContext<(t: ToastOptions) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<number>();

  const show = useCallback((t: ToastOptions) => {
    window.clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            <Icon name="check" size={18} />
            <span>{toast.message}</span>
            {toast.action && (
              <Link to={toast.action.to} className="toast__action" onClick={() => setToast(null)}>
                {toast.action.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
