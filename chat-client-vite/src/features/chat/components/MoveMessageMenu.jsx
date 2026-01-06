import React, { useState, useEffect, useRef } from 'react';

/**
 * MoveMessageMenu - Dropdown menu for moving messages to threads
 * 
 * @param {Object} props
 * @param {string} props.messageId - ID of the message to move
 * @param {string|null} props.currentThreadId - ID of thread message is currently in (null for main chat)
 * @param {Array} props.threads - List of available threads
 * @param {string} props.roomId - ID of the room
 * @param {Function} props.moveMessageToThread - Function to call when moving message
 * @param {Function} props.onClose - Optional callback when menu closes
 */
export function MoveMessageMenu({ 
  messageId, 
  currentThreadId, 
  threads, 
  roomId,
  moveMessageToThread,
  onClose 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        onClose?.();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);
  
  const handleMove = (targetThreadId) => {
    moveMessageToThread(messageId, targetThreadId, roomId);
    setIsOpen(false);
    onClose?.();
  };
  
  // Filter out archived threads
  const availableThreads = threads.filter(t => !t.is_archived || t.is_archived === 0);
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-xs text-gray-400 hover:text-teal-500 transition-colors"
        title="Move to thread"
        type="button"
      >
        📦
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-2">
              Move to thread:
            </div>
            
            {/* Option: Main chat */}
            <button
              onClick={() => handleMove(null)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm transition-colors"
              type="button"
            >
              💬 Main Chat
            </button>
            
            {/* Thread options */}
            {availableThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => handleMove(thread.id)}
                disabled={thread.id === currentThreadId}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm transition-colors ${
                  thread.id === currentThreadId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                type="button"
              >
                {thread.title} ({thread.message_count || 0} msgs)
              </button>
            ))}
            
            {availableThreads.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">
                No threads available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MoveMessageMenu;

