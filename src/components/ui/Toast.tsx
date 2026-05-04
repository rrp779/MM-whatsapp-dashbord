/**
 * Toast Component
 *
 * Displays success or error notifications/toasts.
 * Supports auto-close and manual close functionality.
 */

import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * Toast variant type
 */
export type ToastVariant = 'success' | 'error';

/**
 * Toast component props
 */
export interface ToastProps {
  /** Toast variant (success or error) */
  variant: ToastVariant;
  /** Toast title/message */
  title: string;
  /** Optional description */
  description?: string;
  /** Whether to show close button */
  showClose?: boolean;
  /** Callback when toast is closed */
  onClose: () => void;
  /** Auto-close delay in milliseconds (0 to disable) */
  autoCloseDelay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toast Component
 *
 * Displays success or error notifications in a toast format.
 * Auto-closes after specified delay or can be manually closed.
 *
 * @param props - Toast component props
 * @returns Toast component
 */
export function Toast({
  variant,
  title,
  description,
  showClose = true,
  onClose,
  autoCloseDelay = 5000,
  className = '',
}: ToastProps): JSX.Element {
  // Auto-close effect
  useEffect(() => {
    if (autoCloseDelay > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  // Variant-specific styles
  const variantStyles = {
    success: {
      background: 'bg-green-50',
      borderColor: 'border-green-500',
      iconColor: 'text-green-500',
      titleColor: 'text-green-900',
      descriptionColor: 'text-green-800',
      icon: CheckCircle2,
    },
    error: {
      background: 'bg-red-50',
      borderColor: 'border-red-500',
      iconColor: 'text-red-500',
      titleColor: 'text-red-900',
      descriptionColor: 'text-red-800',
      icon: XCircle,
    },
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={`
        min-w-[300px] max-w-[400px]
        ${styles.background} rounded-lg
        border-l-4 ${styles.borderColor}
        shadow-lg
        flex items-start gap-3
        p-4
        relative
        animate-in fade-in slide-in-from-top-4 duration-200
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      style={{
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Icon */}
      <Icon
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={`
            text-sm font-semibold mb-1
            ${styles.titleColor}
          `}
        >
          {title}
        </h4>
        {description && (
          <p
            className={`
              text-sm
              ${styles.descriptionColor}
            `}
          >
            {description}
          </p>
        )}
      </div>

      {/* Close Button */}
      {showClose && onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={`
            p-1 rounded-md
            hover:bg-white/50
            transition-colors
            ${styles.iconColor}
            flex-shrink-0
          `}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
