import React from 'react';
import { ObserverCard } from '../../dashboard/components/ObserverCard.jsx';

/**
 * CoachingSection - Displays AI coaching feedback and analyzing state
 */
export function CoachingSection({
  draftCoaching,
  inputMessage,
  setInputMessage,
  setIsPreApprovedRewrite,
  setOriginalRewrite,
  setDraftCoaching,
  socket,
}) {
  const handleUseRewrite = rewrite => {
    setInputMessage(rewrite);
    setIsPreApprovedRewrite(true);
    setOriginalRewrite(rewrite);
    setDraftCoaching(null);
  };

  const handleEditMyself = () => {
    setDraftCoaching(null);
  };

  const handleSendOriginal = () => {
    if (socket && socket.connected) {
      socket.emit('send_message', {
        text: draftCoaching.originalText || inputMessage,
        isPreApprovedRewrite: false,
        bypassMediation: true,
      });
      setInputMessage('');
      setDraftCoaching(null);
    }
  };

  // Show observer card when there's coaching data
  if (draftCoaching && draftCoaching.observerData && !draftCoaching.shouldSend) {
    return (
      <div
        className="px-4 sm:px-6 md:px-8 pb-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <ObserverCard
          observerData={draftCoaching.observerData}
          originalText={draftCoaching.originalText || inputMessage}
          onUseRewrite={handleUseRewrite}
          onEditMyself={handleEditMyself}
          onSendOriginal={handleSendOriginal}
        />
      </div>
    );
  }

  // Show loading state when analyzing
  if (draftCoaching && draftCoaching.analyzing) {
    return (
      <div
        className="px-4 sm:px-6 md:px-8 pb-3"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 50, // Higher than MessageInput (z-index: 40 on mobile)
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(229, 231, 235, 0.9)',
          paddingTop: '0.75rem',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="flex items-center gap-3 text-sm text-gray-700 max-w-3xl mx-auto">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-light border-t-teal-medium" />
            <div className="absolute inset-0 inline-block animate-ping rounded-full h-5 w-5 border border-teal-medium opacity-20" />
          </div>
          <span className="font-medium">Analyzing message...</span>
          <div className="flex gap-1 ml-1">
            <span
              className="inline-block w-1 h-1 bg-teal-medium rounded-full animate-pulse"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="inline-block w-1 h-1 bg-teal-medium rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="inline-block w-1 h-1 bg-teal-medium rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default CoachingSection;
