# Code-to-Figma Sync Guide

## Overview

This system automatically syncs your React components from your codebase to Figma, creating wireframes and design pages automatically. You design in code, and it appears in Figma!

## Features

✅ **Automatic Component Scanning** - Scans React components and extracts structure, props, styles, and tokens
✅ **Wireframe Generation** - Creates wireframes in Figma from component structure
✅ **Design Page Generation** - Generates styled design pages with actual colors and typography
✅ **Real-time Sync** - Sync components to Figma with one click
✅ **Component Explorer** - View all available components from your codebase

## How It Works

1. **Component Scanner** (`chat-server/componentScanner.js`)
   - Scans React component files
   - Extracts JSX structure, props, Tailwind classes
   - Identifies design tokens used
   - Maps component hierarchy

2. **Figma Generator** (`chat-server/figmaGenerator.js`)
   - Converts component structure to Figma format
   - Generates wireframe layouts
   - Applies styling from Tailwind classes
   - Creates Figma elements programmatically

3. **Backend API** (`chat-server/server.js`)
   - `/api/figma/scan-components` - Scan and list all components
   - `/api/figma/sync-components` - Sync components to Figma
   - `/api/figma/generate-structure` - Generate Figma structure
   - `/api/figma/component/:name` - Get specific component details

4. **Figma Plugin** (`figma-plugin/`)
   - Receives component data from backend
   - Creates Figma frames and elements
   - Renders wireframes and design pages
   - Updates Figma file automatically

## Setup

### 1. Build Figma Plugin

```bash
cd figma-plugin
npm install
npm run build
```

### 2. Install Plugin in Figma

1. Open Figma Desktop
2. Go to `Plugins` → `Development` → `Import plugin from manifest...`
3. Select `figma-plugin/manifest.json`
4. Plugin appears in your plugins list

### 3. Configure Backend API URL

In the Figma plugin UI:

- Enter your backend API URL (default: `http://localhost:3001`)
- Click "Update API URL"
- For production: `https://demo-production-6dcd.up.railway.app`

### 4. Make Sure Backend is Running

```bash
cd chat-server
npm start
```

The backend must be running for the plugin to fetch component data.

## Usage

### Sync All Components

1. **Open Figma** and create or open a file
2. **Run the plugin**: `Plugins` → `Development` → `LiaiZen Design Sync`
3. **Click "Sync Components from Code"** button
4. Plugin will:
   - Scan your codebase for React components
   - Extract component structure and styles
   - Create wireframes in Figma automatically
   - Display a new page: "📐 Wireframes from Code"

### View Available Components

1. **Click "View Available Components"** in the plugin
2. See a list of all components found in your codebase
3. Each component shows its name and category (ui, pages, modals)

### Sync Specific Components

You can also use the API directly:

```bash
# Sync all components
curl -X POST http://localhost:3001/api/figma/sync-components \
  -H "Content-Type: application/json" \
  -d '{"pageType": "wireframes"}'

# Sync specific components
curl -X POST http://localhost:3001/api/figma/sync-components \
  -H "Content-Type: application/json" \
  -d '{
    "componentNames": ["Button", "Modal", "Input"],
    "pageType": "wireframes"
  }'
```

## API Endpoints

### Scan Components

```
GET /api/figma/scan-components
```

Returns list of all components found in codebase.

**Response:**

```json
{
  "success": true,
  "count": 15,
  "components": [
    {
      "name": "Button",
      "category": "ui",
      "filename": "Button.jsx",
      "props": [...],
      "tokens": {...},
      "children": ["Icon"]
    }
  ]
}
```

### Sync Components

```
POST /api/figma/sync-components
```

Syncs components to Figma (plugin must be running).

**Request:**

```json
{
  "componentNames": ["Button", "Modal"], // Optional: specific components
  "pageType": "wireframes", // "wireframes" or "design"
  "fileKey": "abc123" // Optional: specific Figma file
}
```

**Response:**

```json
{
  "success": true,
  "message": "Generated structure for 15 components. Use Figma plugin to render.",
  "data": {
    "command": "create-structure",
    "structure": {...},
    "components": [...]
  }
}
```

### Get Component Details

```
GET /api/figma/component/:componentName
```

Get detailed information about a specific component including wireframe.

**Response:**

```json
{
  "success": true,
  "component": {
    "name": "Button",
    "category": "ui",
    "props": [...],
    "structure": {...},
    "styles": {...},
    "tokens": {...}
  },
  "wireframe": {...}
}
```

## What Gets Created in Figma

### Wireframe Page

A new page called "📐 Wireframes from Code" is created with:

- **Component Frames** - Each component gets its own frame
- **Structure Layout** - JSX hierarchy is preserved
- **Element Labels** - Components, buttons, inputs are labeled
- **Layout Spacing** - Maintains spacing from Tailwind classes
- **Wireframe Style** - Gray boxes representing UI elements

### Design Page (Coming Soon)

Styled design pages with:

- Actual colors from design tokens
- Typography from Tailwind classes
- Proper spacing and layout
- Interactive element styling

## Workflow

### Design in Code → See in Figma

1. **Design/Modify Components** in your codebase
   - Update JSX structure
   - Change Tailwind classes
   - Add/remove props

2. **Sync to Figma** using the plugin
   - Click "Sync Components from Code"
   - Wireframes update automatically

3. **Review in Figma**
   - Check wireframe structure
   - Annotate if needed
   - Share with team

### Recommended Workflow

1. **Development**: Build components in code
2. **Sync**: Use plugin to create wireframes
3. **Review**: Check wireframes in Figma
4. **Iterate**: Update code, sync again
5. **Design**: Refine in Figma or code

## Component Categories

Components are organized by category:

- **UI Components** (`ui/`) - Reusable UI elements (Button, Input, Modal, etc.)
- **Page Components** - Full page layouts (LandingPage, LoginSignup, etc.)
- **Modals** (`modals/`) - Modal/dialog components

## Limitations & Notes

### Current Limitations

1. **Read-only File Updates**: Figma REST API doesn't allow writing to files directly. The plugin creates elements when running.
2. **Basic Wireframes**: Currently generates basic wireframes. Full design pages coming soon.
3. **Component Detection**: Only scans `.jsx` and `.js` files in `components/` directory.
4. **Style Mapping**: Not all Tailwind classes are mapped yet. Common classes work.

### What Works Well

✅ Component structure detection
✅ Basic layout generation
✅ Tailwind color mapping (teal palette)
✅ Component hierarchy
✅ Props detection

### Coming Soon

🔜 Full design page generation with styling
🔜 Component variant support
🔜 Better Tailwind class mapping
🔜 Automatic sync on file save
🔜 Component documentation generation

## Troubleshooting

### Plugin Can't Connect to Backend

- **Check backend is running**: `curl http://localhost:3001/api/figma/status`
- **Verify API URL** in plugin UI
- **Check CORS** settings in `server.js`
- **Restart Figma** if connection issues persist

### No Components Found

- **Verify components exist**: Check `chat-client-vite/src/components/`
- **Check file extensions**: Only `.jsx` and `.js` files are scanned
- **View backend logs**: Check for scanning errors
- **Try manual scan**: `curl http://localhost:3001/api/figma/scan-components`

### Wireframes Not Appearing

- **Check plugin console**: `Plugins` → `Development` → `Open Console`
- **Verify file is open**: Plugin needs an active Figma file
- **Check page name**: Wireframes appear in "📐 Wireframes from Code" page
- **Try syncing again**: Click sync button again

### Component Structure Incorrect

- **Check component JSX**: Make sure return statement is properly formatted
- **Verify imports**: Component scanner needs to find component exports
- **Check Tailwind classes**: Ensure classes are in `className` attributes

## Examples

### Button Component

Scanned from `ui/Button/Button.jsx`:

- **Structure**: `<button>` element with text content
- **Props**: `variant`, `size`, `fullWidth`, `disabled`, `loading`, etc.
- **Styles**: Tailwind classes like `bg-teal-dark`, `rounded-full`, `px-4 py-3`
- **Tokens**: Teal colors, spacing tokens

Creates in Figma:

- Frame labeled "Button"
- Rectangle with rounded corners
- Background color from teal palette
- Text label showing button text

### Landing Page

Scanned from `LandingPage.jsx`:

- **Structure**: Complex layout with header, sections, footer
- **Children**: Button, Heading, SectionHeader components
- **Layout**: Flex column layout
- **Styles**: Multiple Tailwind classes

Creates in Figma:

- Large frame representing the page
- Nested frames for sections
- Wireframe representation of layout
- Labeled elements

## Resources

- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Component Scanner Source](../chat-server/componentScanner.js)
- [Figma Generator Source](../chat-server/figmaGenerator.js)
- [Figma Plugin Source](../figma-plugin/src/code.ts)

---

_Last Updated: 2025-01-23_
_Project: LiaiZen Co-Parenting Platform_
