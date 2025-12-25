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
    // Prevent default to control when focus happens
    // But allow it to proceed so keyboard appears
  };

  const handleMouseDown = e => {
    removeReadonly();
  };

  const handleTouchStart = e => {
    removeReadonly();
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
        className="bg-white shadow-lg rounded-2xl border border-gray-100 p-2 flex items-end gap-2 max-w-3xl mx-auto w-full"
        style={{
          maxWidth: 'min(48rem, calc(100vw - 2rem))',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div className="flex-1 flex items-center">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            rows={1}
            className={`flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px] max-h-32 resize-none font-normal leading-snug bg-transparent ${
              hasCoachingWarning ? 'placeholder-orange-400' : ''
            }`}
            style={{ fontSize: '16px' }}
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
        </div>
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="w-11 h-11 bg-linear-to-br from-teal-500 to-teal-600 text-white rounded-full font-bold hover:from-teal-600 hover:to-teal-700 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg group"
          title="Send message"
        >
          <svg
            className="w-5 h-5 transition-transform duration-200 group-hover:rotate-45"
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
      </form>
    </div>
  );
}

export default MessageInput;
