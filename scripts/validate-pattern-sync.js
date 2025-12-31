#!/usr/bin/env node
/**
 * Pattern Synchronization Validator
 * 
 * Validates that frontend and backend patterns are synchronized.
 * 
 * Usage:
 *   node scripts/validate-pattern-sync.js
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_PATTERNS_DIR = path.join(__dirname, '..', 'chat-client-vite', 'src', 'config', 'patterns');
const BACKEND_PATTERNS_DIR = path.join(__dirname, '..', 'chat-server', 'src', 'config', 'patterns');

function readPatternFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function extractRegexPatterns(content) {
  // Match regex patterns in array definitions like [/\b(word1|word2)\b/i, ...]
  // Look for patterns inside array brackets
  const arrayMatch = content.match(/\[([\s\S]*?)\]/);
  if (!arrayMatch) return [];
  
  const arrayContent = arrayMatch[1];
  // Match regex patterns like /\b(word1|word2)\b/i
  const regexPattern = /\/[^/]+\/[gimuy]*/g;
  const patterns = [];
  let match;
  
  while ((match = regexPattern.exec(arrayContent)) !== null) {
    // Only include if it's actually a regex pattern (not a path or comment)
    if (match[0].length > 3 && match[0].includes('\\')) {
      patterns.push(match[0]);
    }
  }
  
  return patterns.sort();
}

function extractStringArrays(content) {
  const arrayPattern = /\[(.*?)\]/gs;
  const matches = [];
  let match;
  
  while ((match = arrayPattern.exec(content)) !== null) {
    const items = match[1]
      .split(',')
      .map(item => item.trim().replace(/['"]/g, ''))
      .filter(item => item.length > 0);
    if (items.length > 0) {
      matches.push(items.sort());
    }
  }
  
  return matches;
}

function comparePatterns(frontendFile, backendFile, patternName) {
  const frontendContent = readPatternFile(frontendFile);
  const backendContent = readPatternFile(backendFile);
  
  if (!frontendContent || !backendContent) {
    console.log(`⚠️  ${patternName}: One or both files missing`);
    return false;
  }
  
  // Extract patterns more carefully - look for the actual pattern arrays
  const frontendRegex = extractRegexPatternsFromArray(frontendContent);
  const backendRegex = extractRegexPatternsFromArray(backendContent);
  
  const frontendArrays = extractStringArrays(frontendContent);
  const backendArrays = extractStringArrays(backendContent);
  
  let allMatch = true;
  
  // Compare regex patterns
  if (frontendRegex.length !== backendRegex.length) {
    console.log(`❌ ${patternName}: Regex pattern count mismatch (frontend: ${frontendRegex.length}, backend: ${backendRegex.length})`);
    allMatch = false;
  } else if (frontendRegex.length > 0) {
    for (let i = 0; i < frontendRegex.length; i++) {
      if (frontendRegex[i] !== backendRegex[i]) {
        console.log(`❌ ${patternName}: Regex pattern mismatch at index ${i}`);
        console.log(`   Frontend: ${frontendRegex[i]}`);
        console.log(`   Backend:  ${backendRegex[i]}`);
        allMatch = false;
      }
    }
  }
  
  // Compare string arrays (if any)
  if (frontendArrays.length > 0 && backendArrays.length > 0) {
    const frontendFlat = frontendArrays.flat().sort();
    const backendFlat = backendArrays.flat().sort();
    
    if (frontendFlat.length !== backendFlat.length) {
      console.log(`❌ ${patternName}: String array count mismatch (frontend: ${frontendFlat.length}, backend: ${backendFlat.length})`);
      allMatch = false;
    } else {
      for (let i = 0; i < frontendFlat.length; i++) {
        if (frontendFlat[i] !== backendFlat[i]) {
          console.log(`❌ ${patternName}: String array mismatch: "${frontendFlat[i]}" vs "${backendFlat[i]}"`);
          allMatch = false;
        }
      }
    }
  }
  
  if (allMatch) {
    console.log(`✅ ${patternName}: Patterns synchronized`);
  }
  
  return allMatch;
}

function extractRegexPatternsFromArray(content) {
  // Find the array definition (either export const PATTERNS = [...] or PATTERNS: [...])
  const arrayMatch = content.match(/(?:export\s+const|PATTERNS\s*[:=])\s*\[([\s\S]*?)\]/);
  if (!arrayMatch) return [];
  
  const arrayContent = arrayMatch[1];
  // Match regex patterns like /\b(word1|word2)\b/i
  const regexPattern = /\/[^/]+\/[gimuy]*/g;
  const patterns = [];
  let match;
  
  while ((match = regexPattern.exec(arrayContent)) !== null) {
    // Only include if it's actually a regex pattern (contains backslash for escape sequences)
    if (match[0].includes('\\')) {
      patterns.push(match[0]);
    }
  }
  
  return patterns.sort();
}

function main() {
  console.log('🔍 Validating pattern synchronization...\n');
  
  let allSynchronized = true;
  
  // Compare polite-requests
  const politeRequestsMatch = comparePatterns(
    path.join(FRONTEND_PATTERNS_DIR, 'polite-requests.js'),
    path.join(BACKEND_PATTERNS_DIR, 'polite-requests.js'),
    'Polite Requests'
  );
  allSynchronized = allSynchronized && politeRequestsMatch;
  
  // Compare positive-messages
  const positiveMessagesMatch = comparePatterns(
    path.join(FRONTEND_PATTERNS_DIR, 'positive-messages.js'),
    path.join(BACKEND_PATTERNS_DIR, 'positive-messages.js'),
    'Positive Messages'
  );
  allSynchronized = allSynchronized && positiveMessagesMatch;
  
  // Note: Backend has additional patterns (greetings, polite-responses) that frontend doesn't need
  // Frontend has simple-responses that backend handles differently
  
  console.log('\n' + '='.repeat(50));
  if (allSynchronized) {
    console.log('✅ All shared patterns are synchronized!');
    process.exit(0);
  } else {
    console.log('❌ Pattern synchronization issues found');
    console.log('\nPlease update patterns to match between frontend and backend.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { comparePatterns, extractRegexPatterns, extractStringArrays };

