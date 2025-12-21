# Figma Plugin Setup Guide

## Quick Start

The LiaiZen Figma plugin allows you to sync design tokens and components from Figma to your codebase.

### 1. Build the Plugin

```bash
cd figma-plugin
npm install
npm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` directory.

### 2. Install in Figma

1. **Open Figma Desktop** (required for plugin development)
2. Go to `Plugins` → `Development` → `Import plugin from manifest...`
3. Select `figma-plugin/manifest.json`
4. The plugin will appear in your plugins list

### 3. Run the Plugin

1. Open a Figma file
2. Go to `Plugins` → `Development` → `LiaiZen Design Sync`
3. The plugin UI will open

### 4. Configure Backend URL

In the plugin UI:

- Enter your backend API URL (default: `http://localhost:3001`)
- For production: `https://demo-production-6dcd.up.railway.app` or `https://coparentliaizen.com`
- Click "Update API URL"

## Features

### Extract Design Tokens

1. Click **"Extract Design Tokens"**
2. Plugin scans your Figma file for:
   - Colors (teal palette, semantic colors)
   - Spacing values
   - Typography (font families, sizes, weights)
   - Border radius values
3. Preview tokens in the text area

### Sync to Backend

1. Extract tokens first
2. Click **"Sync to Backend"**
3. Tokens are sent to `/api/figma/sync-tokens`
4. Backend processes and stores the tokens

### Export Component

1. Select a component or frame in Figma
2. Click **"Export Selected Component"**
3. Component data (dimensions, styles, properties) is extracted
4. Data is logged to console (can be extended to generate code)

## Development

### File Structure

```
figma-plugin/
├── manifest.json       # Plugin manifest
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── src/
│   └── code.ts        # Plugin code
├── dist/
│   └── code.js        # Compiled JavaScript (generated)
├── ui.html            # Plugin UI
└── README.md          # Full documentation
```

### Build Commands

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev
```

### Debugging

1. Open Figma Desktop
2. Run the plugin
3. Open console: `Plugins` → `Development` → `Open Console`
4. Check logs for errors

## Backend Integration

The plugin communicates with your backend at:

- `POST /api/figma/sync-tokens` - Sync design tokens
  ```json
  {
    "fileKey": "abc123",
    "tokens": {
      "colors": {...},
      "spacing": {...},
      "typography": {...}
    }
  }
  ```

## Troubleshooting

### Plugin Not Loading

- Make sure you ran `npm run build` first
- Check that `dist/code.js` exists
- Verify `manifest.json` syntax is valid
- Restart Figma Desktop

### Build Errors

- Ensure TypeScript is installed: `npm install`
- Check `tsconfig.json` settings
- Verify `@figma/plugin-typings` is installed

### API Connection Errors

- Verify backend server is running
- Check CORS settings in backend (`server.js`)
- Ensure API URL is correct in plugin UI
- Check browser console for network errors

### Tokens Not Extracting

- Make sure your Figma file has **local styles** (not library styles)
- Check style naming (e.g., "Teal Dark", "Teal Medium")
- Plugin only reads styles defined in the current file

## Next Steps

1. **Extract tokens** from your Figma design file
2. **Sync to backend** to save tokens
3. **Extend plugin** to generate React components
4. **Add more features** like style comparison, batch export, etc.

## Resources

- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [Plugin Examples](https://github.com/figma/plugin-samples)
- See `figma-plugin/README.md` for full documentation

---

_Last Updated: 2025-01-23_
_Project: LiaiZen Co-Parenting Platform_
