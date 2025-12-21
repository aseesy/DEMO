import React, { useEffect } from 'react';

const sizes = {
  small: 'max-w-md',
  medium: 'max-w-xl',
  large: 'max-w-3xl',
  fullscreen: 'max-w-full h-full m-0',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
}) => {
  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = e => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Scroll lock (prevents body scrolling when modal is open)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = sizes[size] || sizes.medium;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal p-4 pb-24 md:pb-4 overflow-y-auto"
      style={{ zIndex: 'var(--z-modal)' }}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={subtitle ? 'modal-subtitle' : undefined}
    >
      <div
        className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full ${sizeClass} flex flex-col max-h-full my-auto ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Always visible */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 id="modal-title" className="text-base sm:text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {subtitle && (
              <p id="modal-subtitle" className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors ml-4 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">{children}</div>

        {/* Footer - Conditionally rendered */}
        {footer && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex gap-2 justify-end flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
