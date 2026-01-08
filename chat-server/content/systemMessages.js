/**
 * System Messages - Product/Content Team Owned
 *
 * SINGLE SOURCE OF TRUTH for all LiaiZen system messages.
 *
 * DO NOT CHANGE these messages without Product approval.
 * The WELCOME_MESSAGE is the first message shown in every new co-parent chat room.
 *
 * ACTOR: Product Team
 * REASON TO CHANGE: Tone, wording, branding updates (requires Product approval)
 */

const SYSTEM_IDENTITY = {
  name: 'LiaiZen',
  username: 'LiaiZen',
  email: 'liaizen@system.local',
};

/**
 * WELCOME MESSAGE - First message in every new co-parent chat room
 *
 * This message is automatically sent when a co-parent room is created.
 * It introduces LiaiZen and explains how the mediation works.
 */
const WELCOME_MESSAGE = {
  text: 'Hello, I am LiaiZen - your personal communication coach. I am here to help you improve your interpersonal skills through personalized guidance, feedback, and practice. Try saying something rude to your co-parent to see how it works.',
  type: 'ai_comment',
};

const COACHING_MESSAGES = {
  analyzing: 'Analyzing message...',
  connectionLost: 'Connection lost. Reconnecting...',
  connectionRestored: 'Connection restored.',
};

module.exports = {
  SYSTEM_IDENTITY,
  WELCOME_MESSAGE,
  COACHING_MESSAGES,
};
