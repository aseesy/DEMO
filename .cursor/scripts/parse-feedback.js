#!/usr/bin/env node
/**
 * Parse and add multiple feedback entries from formatted text
 */

const fs = require('fs');
const path = require('path');

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const FEEDBACK_FILE = path.join(__dirname, '..', 'feedback', 'feedback.json');

function loadFeedback() {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Error loading feedback:', error.message);
    return [];
  }
}

function saveFeedback(feedback) {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving feedback:', error.message);
    process.exit(1);
  }
}

function parseFeedbackText(text) {
  const entries = [];
  const lines = text.split('\n');
  
  let currentFile = null;
  let currentEntry = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // File path detection
    if (line.includes('src/') && !line.includes('@feedback')) {
      currentFile = line.replace(/^.*?(src\/[^\s]+).*$/, '$1');
      continue;
    }
    
    // Feedback entry detection
    if (line.includes('@feedback')) {
      // Save previous entry if exists
      if (currentEntry) {
        entries.push(currentEntry);
      }
      
      // Parse rating and category
      const ratingMatch = line.match(/@feedback\s+([⭐❌⚠️]+)\s+([^-]+?)(?:\s*-\s*|$)/);
      if (ratingMatch) {
        const rating = ratingMatch[1];
        const category = ratingMatch[2].trim();
        
        // Get description (everything after the dash or after category)
        const descMatch = line.match(/-\s*(.+)$/);
        const description = descMatch ? descMatch[1].trim() : category;
        
        currentEntry = {
          rating,
          category: mapCategory(category),
          context: description,
          behavior: category,
          files: currentFile ? [currentFile] : [],
        };
      }
    } else if (currentEntry && line && !line.startsWith('@feedback')) {
      // Additional context lines
      if (!currentEntry.suggestion && line.length > 20) {
        currentEntry.suggestion = line;
      } else if (currentEntry.context && line.length > 20) {
        currentEntry.context += ' ' + line;
      }
    }
  }
  
  // Add last entry
  if (currentEntry) {
    entries.push(currentEntry);
  }
  
  return entries;
}

function mapCategory(category) {
  const cat = category.toLowerCase();
  if (cat.includes('refactoring') || cat.includes('design-system') || cat.includes('architecture')) {
    return 'code-quality';
  }
  if (cat.includes('hardcoded') || cat.includes('design') || cat.includes('token')) {
    return 'design';
  }
  if (cat.includes('over-engineering') || cat.includes('complexity')) {
    return 'workflow';
  }
  if (cat.includes('proactive') || cat.includes('optimization')) {
    return 'code-quality';
  }
  if (cat.includes('potential-issue') || cat.includes('warning')) {
    return 'code-quality';
  }
  return 'code-quality';
}

function main() {
  const feedbackText = `src/adapters/socket/SocketAdapter.js
@feedback ⭐ refactoring - Excellent use of the Adapter pattern. By wrapping socket.io-client in a custom SocketConnection class, you have successfully decoupled the application logic from the specific websocket library. This makes future replacements or mocking for tests significantly easier.

src/features/chat/components/MessageInput.jsx
@feedback ❌ hardcoded-values - Found inline style fontSize: '15px'. This bypasses the design system. You should use a utility class (e.g., text-sm or text-base) or a defined design token to ensure typography consistency across the app.

@feedback ⭐ proactive - The use of paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' is a great proactive measure for mobile responsiveness, ensuring the input isn't hidden behind the home indicator on iOS devices.

src/features/chat/model/useSendMessage.js
@feedback ❌ over-engineering - This hook is doing too much. It handles UI state (scrolling), network transport (socket.emit), and complex business logic (Mediation/Analysis) all in one place. This violates the Single Responsibility Principle.

@feedback ⚠️ potential-issue - The error handling allows the message to be sent "fail open" if analysis fails. While this ensures deliverability, it might bypass safety features silently during a partial outage.

src/utils/messageAnalyzer.js
@feedback ⚠️ potential-issue - The POLITE_REQUEST_PATTERNS and POSITIVE_PATTERNS are hardcoded arrays of regex inside the logic file. As these lists grow, this file will become cluttered.

@feedback ⭐ refactoring - Breaking out quickLocalCheck prevents unnecessary API calls for simple messages ("ok", "thanks"). This is a good performance optimization.

src/config/profileConfig.js & src/utils/profileBuilder.js
@feedback ⭐ design-system - Extracting profile constants and builder functions separates data structure definitions from the UI components that use them. This is good data modeling.

General Structure (src/features/...)
@feedback ⭐ refactoring - The directory structure is well-organized by "Feature" (auth, chat, dashboard, etc.) rather than just by file type. This makes the codebase scalable and easier to navigate.`;

  const parsedEntries = parseFeedbackText(feedbackText);
  const feedback = loadFeedback();
  
  parsedEntries.forEach(entry => {
    const fullEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      rating: entry.rating,
      category: entry.category,
      context: entry.context,
      behavior: entry.behavior,
      suggestion: entry.suggestion || null,
      files: entry.files,
      sessionId: 'user-feedback-2025-01-27',
    };
    
    feedback.push(fullEntry);
    console.log(`✅ Added: ${entry.rating} ${entry.category} - ${entry.context.substring(0, 50)}...`);
  });
  
  saveFeedback(feedback);
  console.log(`\n📊 Total feedback entries: ${feedback.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { parseFeedbackText, mapCategory };

