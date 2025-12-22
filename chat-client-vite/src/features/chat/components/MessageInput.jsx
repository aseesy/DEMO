import React from 'react';

/**
 * MessageInput - Chat message input form with send button
 */
export function MessageInput({ inputMessage, handleInputChange, sendMessage, hasCoachingWarning }) {
  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div
      className="px-4 sm:px-6 md:px-8 pb-4 pt-2 safe-area-inset-bottom"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <form
        onSubmit={sendMessage}
        className="bg-white shadow-lg rounded-2xl border border-gray-100 p-2 flex items-end gap-2 max-w-3xl mx-auto"
      >
        <div className="flex-1 flex items-center">
          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            rows={1}
            className={`flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px] max-h-32 resize-none font-normal leading-snug bg-transparent ${
              hasCoachingWarning ? 'placeholder-orange-400' : ''
            }`}
            style={{ fontSize: '15px' }}
            onKeyDown={handleKeyDown}
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
