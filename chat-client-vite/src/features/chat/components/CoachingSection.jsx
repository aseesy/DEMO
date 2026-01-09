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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          borderTop: '1px solid rgba(229, 231, 235, 0.8)',
          paddingTop: '0.75rem',
        }}
      >
        <div className="flex items-center gap-3 text-sm text-gray-600 max-w-3xl mx-auto">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-teal-medium" />
          <span>Analyzing message...</span>
        </div>
      </div>
    );
  }

  return null;
}

export default CoachingSection;
