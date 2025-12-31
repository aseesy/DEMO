#!/usr/bin/env node
/**
 * Coding Feedback Processor
 * 
 * Processes feedback entries and generates statistics, patterns, and goal progress.
 * 
 * Usage:
 *   node .cursor/scripts/process-feedback.js stats
 *   node .cursor/scripts/process-feedback.js patterns
 *   node .cursor/scripts/process-feedback.js goals
 *   node .cursor/scripts/process-feedback.js report
 */

const fs = require('fs');
const path = require('path');

const FEEDBACK_DIR = path.join(__dirname, '..', 'feedback');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'feedback.json');
const PATTERNS_FILE = path.join(FEEDBACK_DIR, 'patterns.json');
const GOALS_FILE = path.join(FEEDBACK_DIR, 'goals.json');

function loadJSON(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return defaultValue;
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
  }
}

function generateStats(feedback) {
  const stats = {
    total: feedback.length,
    positive: feedback.filter(f => f.rating === '⭐' || f.rating === '⭐⭐').length,
    negative: feedback.filter(f => f.rating === '❌').length,
    warnings: feedback.filter(f => f.rating === '⚠️').length,
    byCategory: {},
    byRating: {},
    recent: feedback.slice(-10).reverse(),
  };

  // Count by category
  feedback.forEach(f => {
    const cat = f.category || 'uncategorized';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  });

  // Count by rating
  feedback.forEach(f => {
    const rating = f.rating || 'unknown';
    stats.byRating[rating] = (stats.byRating[rating] || 0) + 1;
  });

  return stats;
}

function identifyPatterns(feedback) {
  const patterns = {
    positive: {},
    negative: {},
    lastUpdated: new Date().toISOString(),
  };

  feedback.forEach(f => {
    const behavior = f.behavior || f.context || 'unknown';
    const isPositive = f.rating === '⭐' || f.rating === '⭐⭐';
    const patternType = isPositive ? 'positive' : 'negative';
    
    if (!patterns[patternType][behavior]) {
      patterns[patternType][behavior] = {
        frequency: 0,
        lastSeen: f.timestamp,
        examples: [],
      };
    }

    patterns[patternType][behavior].frequency++;
    if (f.timestamp > patterns[patternType][behavior].lastSeen) {
      patterns[patternType][behavior].lastSeen = f.timestamp;
    }
    if (patterns[patternType][behavior].examples.length < 5) {
      patterns[patternType][behavior].examples.push({
        context: f.context,
        timestamp: f.timestamp,
        files: f.files || [],
      });
    }
  });

  return patterns;
}

function generateReport(stats, patterns, goals) {
  const report = [];
  
  report.push('# Coding Feedback Report\n');
  report.push(`Generated: ${new Date().toLocaleString()}\n`);
  
  // Statistics
  report.push('## Statistics\n');
  report.push(`- **Total Feedback**: ${stats.total}`);
  report.push(`- **Positive (⭐)**: ${stats.positive} (${((stats.positive / stats.total) * 100).toFixed(1)}%)`);
  report.push(`- **Negative (❌)**: ${stats.negative} (${((stats.negative / stats.total) * 100).toFixed(1)}%)`);
  report.push(`- **Warnings (⚠️)**: ${stats.warnings}\n`);
  
  // Categories
  if (Object.keys(stats.byCategory).length > 0) {
    report.push('### By Category\n');
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        report.push(`- **${cat}**: ${count}`);
      });
    report.push('');
  }
  
  // Positive Patterns
  const positivePatterns = Object.entries(patterns.positive)
    .sort((a, b) => b[1].frequency - a[1].frequency)
    .slice(0, 5);
  
  if (positivePatterns.length > 0) {
    report.push('## Top Positive Patterns\n');
    positivePatterns.forEach(([behavior, data]) => {
      report.push(`### ${behavior}`);
      report.push(`- Frequency: ${data.frequency}`);
      report.push(`- Last seen: ${new Date(data.lastSeen).toLocaleDateString()}\n`);
    });
  }
  
  // Negative Patterns
  const negativePatterns = Object.entries(patterns.negative)
    .sort((a, b) => b[1].frequency - a[1].frequency)
    .slice(0, 5);
  
  if (negativePatterns.length > 0) {
    report.push('## Top Negative Patterns\n');
    negativePatterns.forEach(([behavior, data]) => {
      report.push(`### ${behavior}`);
      report.push(`- Frequency: ${data.frequency}`);
      report.push(`- Last seen: ${new Date(data.lastSeen).toLocaleDateString()}\n`);
    });
  }
  
  // Goals
  if (goals.goals && goals.goals.length > 0) {
    report.push('## Goals\n');
    goals.goals.forEach(goal => {
      const progress = goal.current ? `${goal.current} / ${goal.target}` : 'Not started';
      report.push(`### ${goal.name}`);
      report.push(`- Progress: ${progress}`);
      report.push(`- Description: ${goal.description}\n`);
    });
  }
  
  // Recent Feedback
  if (stats.recent.length > 0) {
    report.push('## Recent Feedback\n');
    stats.recent.forEach(f => {
      report.push(`- **${f.rating}** ${f.category || 'uncategorized'}: ${f.context || f.behavior}`);
      if (f.files && f.files.length > 0) {
        report.push(`  - Files: ${f.files.join(', ')}`);
      }
      report.push(`  - ${new Date(f.timestamp).toLocaleString()}\n`);
    });
  }
  
  return report.join('\n');
}

function main() {
  const command = process.argv[2] || 'report';
  
  const feedback = loadJSON(FEEDBACK_FILE, []);
  const patterns = loadJSON(PATTERNS_FILE, { positive: {}, negative: {}, lastUpdated: null });
  const goals = loadJSON(GOALS_FILE, { goals: [], lastUpdated: null });
  
  if (command === 'stats') {
    const stats = generateStats(feedback);
    console.log(JSON.stringify(stats, null, 2));
  } else if (command === 'patterns') {
    const updatedPatterns = identifyPatterns(feedback);
    saveJSON(PATTERNS_FILE, updatedPatterns);
    console.log(JSON.stringify(updatedPatterns, null, 2));
  } else if (command === 'goals') {
    console.log(JSON.stringify(goals, null, 2));
  } else if (command === 'report') {
    const stats = generateStats(feedback);
    const updatedPatterns = identifyPatterns(feedback);
    saveJSON(PATTERNS_FILE, updatedPatterns);
    const report = generateReport(stats, updatedPatterns, goals);
    console.log(report);
    
    // Save report to file
    const reportPath = path.join(FEEDBACK_DIR, 'report.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\nReport saved to: ${reportPath}`);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Usage: node process-feedback.js [stats|patterns|goals|report]');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateStats, identifyPatterns, generateReport };

