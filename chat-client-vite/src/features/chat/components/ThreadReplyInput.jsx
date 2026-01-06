import React, { useState } from 'react';

/**
 * ThreadReplyInput - Input component for replying directly in a thread
 * 
 * @param {Object} props
 * @param {string} props.threadId - ID of the thread to reply in
 * @param {string} props.threadTitle - Title of the thread
 * @param {Function} props.replyInThread - Function to call when submitting reply
 * @param {string} props.username - Current user's username
 */
export function ThreadReplyInput({ threadId, threadTitle, replyInThread, username }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    try {
      replyInThread(threadId, text.trim());
      setText('');
    } catch (error) {
      console.error('Error replying in thread:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
      <div className="text-xs text-gray-500 mb-2">
        Replying in: <span className="font-semibold">{threadTitle}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply in thread..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-medium"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="px-4 py-2 bg-teal-medium text-white rounded-lg hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}

export default ThreadReplyInput;

