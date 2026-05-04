/**
 * Toast Context
 *
 * Provides global toast notification management across the application.
 * Supports stacking multiple toasts with proper spacing.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastVariant } from '../components/ui/Toast';

/**
 * Toast notification data
 */
interface ToastNotification {
  /** Unique ID for the toast */
  id: string;
  /** Toast variant */
  variant: ToastVariant;
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Auto-close delay in milliseconds */
  autoCloseDelay: number;
}

/**
 * Toast context value
 */
interface ToastContextValue {
  /** Show a success toast */
  showSuccess: (title: string, description?: string) => void;
  /** Show an error toast */
  showError: (title: string, description?: string) => void;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
}

/**
 * Toast context
 */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast provider props
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider Component
 *
 * Provides global toast notification management.
 * Supports stacking multiple notifications with proper spacing.
 */
export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  // Ensure we only render portal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Remove a toast by ID
   */
  const removeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Show a success toast
   */
  const showSuccess = useCallback((title: string, description?: string): void => {
    const id = `success-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      ...prev,
      {
        id,
        variant: 'success',
        title,
        description,
        autoCloseDelay: 5000,
      },
    ]);
  }, []);

  /**
   * Show an error toast
   */
  const showError = useCallback((title: string, description?: string): void => {
    const id = `error-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      ...prev,
      {
        id,
        variant: 'error',
        title,
        description,
        autoCloseDelay: 7000, // Errors stay longer
      },
    ]);
  }, []);

  const contextValue: ToastContextValue = {
    showSuccess,
    showError,
    removeToast,
  };

  const toastContainer = (
    <div
      className="fixed flex flex-col gap-3"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 99999,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 2rem)',
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="relative"
          style={{
            animationDelay: `${index * 50}ms`,
            pointerEvents: 'auto',
            zIndex: 99999,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Toast
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            autoCloseDelay={toast.autoCloseDelay}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container - Fixed top-right with stacking */}
      {mounted && typeof window !== 'undefined' && createPortal(toastContainer, document.body)}
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast context
 *
 * @returns Toast context with showSuccess, showError, and removeToast methods
 * @throws Error if used outside ToastProvider
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
