import {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-100 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />,
    error: <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
    info: <AlertCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: "border-l-4 border-l-gray-800",
    error: "border-l-4 border-l-red-500",
    info: "border-l-4 border-l-gray-400",
  };

  return (
    <div
      className={`pointer-events-auto bg-white rounded-lg shadow-lg border border-gray-200 ${borders[item.variant]} flex items-start gap-3 px-4 py-3 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {icons[item.variant]}
      <p className="text-sm text-gray-800 flex-1 leading-snug">
        {item.message}
      </p>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}
