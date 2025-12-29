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

  // Auto-resize textarea to fit content
  const adjustTextareaHeight = React.useCallback(() => {
    if (textareaRef.current) {
      // Preserve cursor position before adjusting height
      const textarea = textareaRef.current;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const isFocused = document.activeElement === textarea;

      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Get the scroll height (content height)
      const scrollHeight = textarea.scrollHeight;
      // Max height is 8rem (128px) - matches max-h-32
      const maxHeight = 128;
      // Set height to scrollHeight, but cap at maxHeight
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      // Enable scrolling if content exceeds max height
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';

      // Restore cursor position after height adjustment
      if (isFocused && selectionStart !== null && selectionEnd !== null) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
          }
        });
      }

      // Scroll textarea into view if it expanded significantly
      // This ensures the full message is visible when AI rewrite is selected
      if (newHeight > 60) {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }, []);

  // Adjust height when input message changes (especially when AI rewrite is selected)
  React.useEffect(() => {
    adjustTextareaHeight();
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
    // Adjust height after readonly is removed
    setTimeout(adjustTextareaHeight, 0);
  };

  const handleMouseDown = e => {
    removeReadonly();
    setTimeout(adjustTextareaHeight, 0);
  };

  const handleTouchStart = e => {
    removeReadonly();
    setTimeout(adjustTextareaHeight, 0);
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

  return (
    <div
      className="px-4 sm:px-6 md:px-8 pb-4 pt-2 safe-area-inset-bottom"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <form
        onSubmit={sendMessage}
        className="flex-1 relative max-w-3xl mx-auto min-w-0 flex items-end gap-2"
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={e => {
              handleInputChange(e);
              // Adjust height after value changes
              setTimeout(adjustTextareaHeight, 0);
            }}
            placeholder="Type a message..."
            rows={1}
            className={`w-full pl-12 pr-14 py-3 border border-gray-200 rounded-full bg-white/90 focus:outline-none focus:border-teal-dark focus:ring-1 focus:ring-teal-dark text-base text-gray-900 placeholder-gray-400 min-h-[44px] max-h-32 resize-none font-normal leading-snug shadow-sm transition-all ${
              hasCoachingWarning ? 'placeholder-orange-400 border-orange-300' : ''
            }`}
            style={{ fontSize: '16px', height: 'auto', overflowY: 'hidden' }}
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
          {/* Send button positioned inside textarea (absolute) */}
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md group z-10"
            title="Send message"
            style={{ pointerEvents: 'auto' }}
          >
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45"
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
