#!/usr/bin/env node
/**
 * Prompt Linting Script
 * 
 * Validates LiaiZen mediation prompts for:
 * - Missing 1-2-3 structure (ADDRESS + TIP + REWRITES)
 * - Banned phrases
 * - Tone drift
 * - Formatting problems
 * 
 * Usage: npm run prompts:lint
 */

const fs = require('fs');
const path = require('path');

// Banned phrases that should not appear in prompts
const BANNED_PHRASES = [
  'you should',
  'you must',
  'you need to',
  'diagnose',
  'diagnosis',
  'disorder',
  'syndrome',
  'pathological',
  'toxic',
  'narcissist',
  'abusive',
];

// Required structure elements for 1-2-3 framework
const REQUIRED_ELEMENTS = [
  'ADDRESS',
  'TIP',
  'REWRITE',
];

// Files to check
const PROMPT_FILES = [
  'src/liaizen/core/mediator.js',
  'src/liaizen/agents/proactiveCoach.js',
  'src/liaizen/agents/feedbackLearner.js',
];

function checkBannedPhrases(content, filePath) {
  const issues = [];
  const lowerContent = content.toLowerCase();
  
  BANNED_PHRASES.forEach(phrase => {
    if (lowerContent.includes(phrase)) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(phrase)) {
          issues.push({
            type: 'banned_phrase',
            file: filePath,
            line: index + 1,
            phrase,
            context: line.trim().substring(0, 80)
          });
        }
      });
    }
  });
  
  return issues;
}

function checkStructure(content, filePath) {
  const issues = [];
  const upperContent = content.toUpperCase();
  
  // Check for required elements
  REQUIRED_ELEMENTS.forEach(element => {
    if (!upperContent.includes(element)) {
      issues.push({
        type: 'missing_structure',
        file: filePath,
        element,
        message: `Missing required element: ${element}`
      });
    }
  });
  
  // Check for 1-2-3 pattern
  const hasAddress = upperContent.includes('ADDRESS') || upperContent.includes('ADDRESS (');
  const hasTip = upperContent.includes('TIP') || upperContent.includes('ONE TIP');
  const hasRewrite = upperContent.includes('REWRITE') || upperContent.includes('REWRITES');
  
  if (!hasAddress || !hasTip || !hasRewrite) {
    issues.push({
      type: 'incomplete_framework',
      file: filePath,
      message: 'Prompt may not follow 1-2-3 framework (ADDRESS + TIP + REWRITES)'
    });
  }
  
  return issues;
}

function checkTone(content, filePath) {
  const issues = [];
  
  // Check for directive language
  const directivePatterns = [
    /you (must|should|need to|have to)/gi,
    /(always|never) (do|say|use)/gi,
  ];
  
  directivePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          issues.push({
            type: 'tone_issue',
            file: filePath,
            line: index + 1,
            message: 'Directive language detected (may feel like tone policing)',
            context: line.trim().substring(0, 80)
          });
        }
      });
    }
  });
  
  return issues;
}

async function lintPrompts() {
  console.log('🔍 Linting LiaiZen prompts...\n');

  const allIssues = [];

  for (const filePath of PROMPT_FILES) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for banned phrases
    const bannedIssues = checkBannedPhrases(content, filePath);
    allIssues.push(...bannedIssues);
    
    // Check structure
    const structureIssues = checkStructure(content, filePath);
    allIssues.push(...structureIssues);
    
    // Check tone
    const toneIssues = checkTone(content, filePath);
    allIssues.push(...toneIssues);
  }

  // Report results
  if (allIssues.length === 0) {
    console.log('✅ All prompts passed linting!\n');
    process.exit(0);
  }

  console.log(`❌ Found ${allIssues.length} issue(s):\n`);

  // Group by type
  const byType = {};
  allIssues.forEach(issue => {
    if (!byType[issue.type]) {
      byType[issue.type] = [];
    }
    byType[issue.type].push(issue);
  });

  Object.entries(byType).forEach(([type, issues]) => {
    console.log(`\n📋 ${type.toUpperCase().replace(/_/g, ' ')} (${issues.length}):`);
    issues.forEach(issue => {
      console.log(`   ${issue.file}`);
      if (issue.line) {
        console.log(`   Line ${issue.line}: ${issue.context || issue.message}`);
      } else {
        console.log(`   ${issue.message}`);
      }
    });
  });

  console.log('\n💡 Fix issues before committing prompts.');
  process.exit(1);
}

// Run linting
lintPrompts();

