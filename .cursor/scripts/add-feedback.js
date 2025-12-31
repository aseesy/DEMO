#!/usr/bin/env node
/**
 * Add Feedback Entry
 * 
 * Quick way to add feedback entries to the feedback system.
 * 
 * Usage:
 *   node .cursor/scripts/add-feedback.js ⭐ "Good behavior" "Used design tokens correctly"
 *   node .cursor/scripts/add-feedback.js ❌ "Bad behavior" "Hardcoded hex values" --category code-quality --files "file1.js,file2.jsx"
 */

const fs = require('fs');
const path = require('path');
// Simple UUID generator (no dependency required)
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
    console.log('✅ Feedback added successfully!');
  } catch (error) {
    console.error('Error saving feedback:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node add-feedback.js <rating> <context> <behavior> [options]');
    console.error('');
    console.error('Ratings: ⭐ ⭐⭐ ❌ ⚠️');
    console.error('');
    console.error('Options:');
    console.error('  --category <category>  Category (code-quality, communication, workflow, design)');
    console.error('  --files <files>        Comma-separated list of files');
    console.error('  --suggestion <text>    Suggestion for improvement');
    process.exit(1);
  }
  
  const rating = args[0];
  const context = args[1];
  const behavior = args[2];
  
  // Parse options
  let category = 'uncategorized';
  let files = [];
  let suggestion = null;
  
  for (let i = 3; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1];
      i++;
    } else if (args[i] === '--files' && args[i + 1]) {
      files = args[i + 1].split(',').map(f => f.trim());
      i++;
    } else if (args[i] === '--suggestion' && args[i + 1]) {
      suggestion = args[i + 1];
      i++;
    }
  }
  
  const feedback = loadFeedback();
  
  const entry = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    rating,
    category,
    context,
    behavior,
    suggestion,
    files,
    sessionId: process.env.SESSION_ID || 'manual',
  };
  
  feedback.push(entry);
  saveFeedback(feedback);
  
  console.log('\n📝 Entry added:');
  console.log(`   Rating: ${rating}`);
  console.log(`   Category: ${category}`);
  console.log(`   Context: ${context}`);
  console.log(`   Behavior: ${behavior}`);
  if (suggestion) {
    console.log(`   Suggestion: ${suggestion}`);
  }
  if (files.length > 0) {
    console.log(`   Files: ${files.join(', ')}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addFeedback: main };

