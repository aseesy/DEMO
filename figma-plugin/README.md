# LiaiZen Figma Plugin

Figma plugin for syncing design tokens and components with the LiaiZen codebase.

## Features

- ✅ **Extract Design Tokens** - Pull colors, spacing, typography, and other tokens from Figma
- ✅ **Sync to Backend** - Send extracted tokens to your backend API
- ✅ **Export Components** - Export selected components with their styles and properties
- ✅ **File Info** - View current Figma file information

## Setup

### 1. Install Dependencies

```bash
cd figma-plugin
npm install
```

### 2. Build the Plugin

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build
```

This will compile `src/code.ts` to `code.js` in the root of the `figma-plugin` directory.

### 3. Install Plugin in Figma

1. **Open Figma Desktop** (plugin development requires desktop app)

2. **Load Plugin**:
   - Go to `Plugins` → `Development` → `Import plugin from manifest...`
   - Select `figma-plugin/manifest.json`
   - The plugin will appear in your plugins list

3. **Run Plugin**:
   - Open a Figma file
   - Go to `Plugins` → `Development` → `LiaiZen Design Sync`
   - The plugin UI will open

### 4. Configure Backend API URL

In the plugin UI:

1. Enter your backend API URL (default: `http://localhost:3001`)
2. Click "Update API URL"
3. For production, use: `https://demo-production-6dcd.up.railway.app` or `https://coparentliaizen.com`

## Usage

### Extract Design Tokens

1. Open a Figma file with design styles (colors, text styles, etc.)
2. Click **"Extract Design Tokens"** in the plugin
3. The plugin will scan your file for:
   - **Colors**: Teal palette, semantic colors
   - **Spacing**: Common spacing values (4px, 8px, 16px, etc.)
   - **Typography**: Font families, sizes, weights
   - **Border Radius**: Common radius values
4. Preview tokens in the text area below

### Sync Tokens to Backend

1. Extract tokens first (see above)
2. Click **"Sync to Backend"**
3. Tokens will be sent to your backend API at `/api/figma/sync-tokens`
4. Backend will receive and process the tokens

### Export Component

1. Select a component or frame in Figma
2. Click **"Export Selected Component"** in the plugin
3. Component data will be extracted including:
   - Dimensions (width, height)
   - Styles (background color, border radius)
   - Typography (if text node)
   - Component properties (if component)
4. Component data is logged to console for now

## API Endpoints

The plugin communicates with these backend endpoints:

- `POST /api/figma/sync-tokens` - Sync extracted tokens to backend
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

## Development

### Project Structure

```
figma-plugin/
├── manifest.json       # Plugin manifest
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── src/
│   └── code.ts        # Plugin code (compiles to code.js)
├── ui.html            # Plugin UI
└── README.md          # This file
```

### Build Process

The TypeScript code in `src/code.ts` compiles to `code.js` in the root directory. The `manifest.json` references `code.js` as the main entry point.

**Note**: After making changes to `src/code.ts`, you must rebuild:

```bash
npm run build
```

For development, use watch mode:

```bash
npm run dev
```

### Debugging

1. Open Figma Desktop
2. Run the plugin
3. Open browser DevTools: `Plugins` → `Development` → `Open Console`
4. Check console for logs and errors

## Extending the Plugin

### Add New Token Extraction

Edit `src/code.ts` and extend the `extractDesignTokens()` function:

```typescript
// Example: Extract shadow styles
const effectStyles = figma.getLocalEffectStyles();
effectStyles.forEach(style => {
  // Extract shadow properties
});
```

### Add New Export Format

Extend `exportSelectedComponent()` to generate different code formats:

```typescript
// Example: Generate React component code
function generateReactCode(component) {
  return `
    export const ${component.name} = () => (
      <div style={{
        width: ${component.width}px,
        height: ${component.height}px,
        // ... other styles
      }}>
        {/* Component content */}
      </div>
    );
  `;
}
```

## Troubleshooting

### Plugin Not Loading

- Make sure `code.js` exists (run `npm run build`)
- Check `manifest.json` syntax is valid
- Restart Figma Desktop

### API Connection Errors

- Verify backend server is running
- Check CORS settings in backend
- Ensure API URL is correct in plugin UI
- Check browser console for network errors

### Tokens Not Extracting

- Make sure your Figma file has local styles (colors, text styles)
- Check that styles are named correctly (e.g., "Teal Dark", "Teal Medium")
- Verify styles are not in a library (plugin only reads local styles)

## Next Steps

Potential enhancements:

1. **Token Merging** - Merge extracted tokens with existing design tokens
2. **Component Code Generation** - Generate React components from Figma components
3. **Style Comparison** - Compare Figma styles with codebase tokens
4. **Batch Export** - Export multiple components at once
5. **Auto-Sync** - Automatically sync on file save

## Resources

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Figma Plugin Examples](https://github.com/figma/plugin-samples)
- [TypeScript for Figma Plugins](https://www.figma.com/plugin-docs/plugin-snippets/#typescript)

---

_Last Updated: 2025-01-23_
_Project: LiaiZen Co-Parenting Platform_
