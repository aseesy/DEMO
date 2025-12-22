/**
 * System Messages - Product/Content Team Owned
 *
 * This module contains all user-facing system messages.
 * Changes to this file are typically requested by Product/Marketing.
 *
 * ACTOR: Product Team
 * REASON TO CHANGE: Tone, wording, branding updates
 */

const SYSTEM_IDENTITY = {
  name: 'LiaiZen',
  username: 'LiaiZen',
};

const WELCOME_MESSAGE = {
  text: "Welcome to LiaiZen! I'm here to help you and your co-parent communicate more effectively. I'll offer suggestions when messages might benefit from a different approach. Let's work together to keep conversations focused on what matters most - your children.",
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
