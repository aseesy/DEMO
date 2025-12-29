module.exports = {
  // JavaScript and JSX files
  '**/*.{js,jsx}': ['eslint --fix', 'prettier --write'],
  // TypeScript files (if you add TypeScript later)
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  // JSON files
  '**/*.json': ['prettier --write'],
  // Markdown files
  '**/*.md': ['prettier --write'],
  // CSS and other style files
  '**/*.{css,scss,less}': ['prettier --write'],
};






