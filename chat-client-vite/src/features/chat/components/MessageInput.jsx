import React from 'react';

/**
 * MessageInput - Chat message input form with send button
 */
export function MessageInput({ inputMessage, handleInputChange, sendMessage, hasCoachingWarning }) {
  const textareaRef = React.useRef(null);

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Auto-resize textarea to fit content - optimized to prevent forced reflows
  const adjustTextareaHeight = React.useCallback(() => {
    if (!textareaRef.current) return;
    
    // Use requestAnimationFrame to batch DOM reads/writes and prevent forced reflows
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const isFocused = document.activeElement === textarea;

      // Batch DOM reads (get computed values)
      const currentHeight = textarea.offsetHeight;
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 128;
      const newHeight = Math.min(scrollHeight, maxHeight);

      // Only update if height actually changed (prevents unnecessary reflows)
      if (Math.abs(currentHeight - newHeight) > 1) {
        // Batch DOM writes (set styles together)
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';

        // Restore cursor position in next frame to avoid blocking
        if (isFocused && selectionStart !== null && selectionEnd !== null) {
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
            }
          });
        }

        // Scroll into view only if significant expansion (debounced)
        if (newHeight > 60 && newHeight > currentHeight + 20) {
          requestAnimationFrame(() => {
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }
      }
    });
  }, []);

  // Adjust height when input message changes - debounced to prevent excessive reflows
  const adjustHeightTimeoutRef = React.useRef(null);
  React.useEffect(() => {
    // Clear any pending adjustment
    if (adjustHeightTimeoutRef.current) {
      clearTimeout(adjustHeightTimeoutRef.current);
    }
    // Debounce height adjustment to prevent excessive reflows during rapid typing
    adjustHeightTimeoutRef.current = setTimeout(() => {
      adjustTextareaHeight();
    }, 0); // Use 0ms timeout to batch with other DOM updates
    
    return () => {
      if (adjustHeightTimeoutRef.current) {
        clearTimeout(adjustHeightTimeoutRef.current);
      }
    };
  }, [inputMessage, adjustTextareaHeight]);

  // Set readonly on mount to prevent iOS keyboard accessory bar
  React.useEffect(() => {
    if (textareaRef.current) {
      // Set readonly immediately to prevent iOS from showing accessory bar
      textareaRef.current.setAttribute('readonly', 'readonly');
      // Also set it via property for extra safety
      textareaRef.current.readOnly = true;
    }
  }, []);

  // Remove readonly BEFORE any interaction - this is critical
  // We need to remove it before iOS detects the focus
  const removeReadonly = React.useCallback(() => {
    if (textareaRef.current) {
      // Remove both attribute and property
      if (textareaRef.current.hasAttribute('readonly')) {
        textareaRef.current.removeAttribute('readonly');
      }
      textareaRef.current.readOnly = false;
    }
  }, []);

  // Handle focus - readonly should already be removed by pointer events
  const handleFocus = () => {
    removeReadonly();
  };

  // Handle pointer/touch events - remove readonly BEFORE focus
  const handlePointerDown = e => {
    // Remove readonly immediately, before focus event fires
    removeReadonly();
    // Height adjustment handled by useEffect
  };

  const handleMouseDown = e => {
    removeReadonly();
    // Height adjustment handled by useEffect
  };

  const handleTouchStart = e => {
    removeReadonly();
    // Height adjustment handled by useEffect
  };

  // Handle blur - set readonly back after delay
  const handleBlur = () => {
    if (textareaRef.current) {
      // Wait a bit before setting readonly to allow any pending operations
      setTimeout(() => {
        if (textareaRef.current && document.activeElement !== textareaRef.current) {
          textareaRef.current.setAttribute('readonly', 'readonly');
          textareaRef.current.readOnly = true;
        }
      }, 300);
    }
  };

  // Responsive positioning: fixed at bottom on mobile, relative on desktop
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="safe-area-inset-bottom"
      style={{
        // Responsive padding that scales with viewport width - matches MessagesContainer
        // Mobile: 1rem (16px), scales up to 2rem (32px) on larger screens
        // On very large screens: uses viewport-based units for better scaling
        paddingLeft: isMobile ? '1rem' : 'clamp(1.5rem, 4vw, 3rem)',
        paddingRight: isMobile ? '1rem' : 'clamp(1.5rem, 4vw, 3rem)',
        paddingBottom: '0px',
        paddingTop: '0px',
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 'calc(2.5rem + 0.5rem)' : 'auto',
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        backgroundColor: 'white',
        zIndex: isMobile ? 40 : 'auto',
      }}
    >
      <form
        onSubmit={sendMessage}
        className="flex-1 relative max-w-3xl mx-auto min-w-0 flex items-center gap-2"
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 'min(100%, 48rem)',
        }}
      >
        <div className="flex-1 relative" style={{ display: 'flex', alignItems: 'center' }}>
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={e => {
              handleInputChange(e);
              // Height adjustment is handled by useEffect with debouncing
              // No need to call here to avoid double execution
            }}
            placeholder="Send message..."
            rows={1}
            className={`w-full pl-4 pr-12 border border-gray-200 rounded-full bg-white/90 focus:outline-none focus:border-teal-dark focus:ring-1 focus:ring-teal-dark text-base text-gray-900 placeholder-gray-400 min-h-[32px] max-h-32 resize-none font-normal leading-snug shadow-sm transition-all ${
              hasCoachingWarning ? 'placeholder-orange-400 border-orange-300' : ''
            }`}
            style={{
              height: 'auto',
              overflowY: 'hidden',
              textAlign: 'left',
              paddingTop: '0.375rem',
              paddingBottom: '0.375rem',
              lineHeight: '1.5',
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onPointerDown={handlePointerDown}
            onClick={removeReadonly}
            onBlur={handleBlur}
            // readonly is set via setAttribute in useEffect to prevent iOS accessory bar
            // Mobile input optimizations
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {/* Send button positioned on the right, vertically centered */}
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="absolute right-2.5 w-7 h-7 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md group z-10"
            title="Send message"
            style={{
              pointerEvents: 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <svg
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-45"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageInput;
