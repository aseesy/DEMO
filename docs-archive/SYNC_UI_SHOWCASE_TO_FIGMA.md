# Sync UI Showcase Components to Figma

## Quick Guide

This guide shows you how to sync components from the UI Showcase page (`/ui-showcase`) into Figma as wireframes and design pages.

## What Gets Synced

The UI Showcase (`UIShowcase.jsx`) includes:
- **Button Component** - All variants and states
- **Modal Component** - Interactive modals
- **Input Components** - Form inputs
- **Textarea Component** - Multi-line inputs
- **Select Component** - Dropdown selects
- **Heading Component** - Typography examples
- **SectionHeader Component** - Section headers
- **Toast Component** - Notification toasts

Plus the UI Showcase page itself which demonstrates all these components in context.

## Step-by-Step Instructions

### 1. Make Sure Everything is Running

**Backend Server:**
```bash
cd chat-server
npm start
```
The server should be running on `http://localhost:3001`

**Frontend Dev Server (optional, for viewing showcase):**
```bash
cd chat-client-vite
npm run dev
```

### 2. Open Figma and Run Plugin

1. **Open Figma Desktop**
2. **Open or create a Figma file**
3. **Run the plugin:**
   - Go to `Plugins` → `Development` → `LiaiZen Design Sync`
   - The plugin panel will open

### 3. Configure Backend URL (if needed)

In the plugin UI:
- Check the API URL field (default: `http://localhost:3001`)
- If your backend is on a different URL, update it
- Click "Update API URL"

### 4. Sync Components to Figma

**Option A: Sync All Components (Recommended)**

1. Click the **"🔄 Sync Components from Code"** button
2. The plugin will:
   - Scan all components in your codebase
   - Extract UI components (Button, Modal, Input, etc.)
   - Extract the UI Showcase page
   - Generate wireframes in Figma
3. A new frame will appear: **"📐 Wireframes from Code"**
4. You'll see wireframes for all components

**Option B: View Available Components First**

1. Click **"View Available Components"**
2. See a list of all components found:
   - `Button` (ui category)
   - `Modal` (ui category)
   - `Input` (ui category)
   - `UIShowcase` (pages category)
   - etc.
3. Then click "Sync Components from Code" to create wireframes

## What Gets Created in Figma

### Wireframe Page

A frame called **"📐 Wireframes from Code"** will be created with:

1. **UI Component Wireframes:**
   - Button component structure
   - Modal component layout
   - Input component structure
   - Each component shown as a wireframe

2. **UI Showcase Page Wireframe:**
   - The entire UI Showcase page as a wireframe
   - Shows how all components are used together
   - Layout structure preserved

3. **Component Structure:**
   - JSX hierarchy maintained
   - Layout spacing from Tailwind classes
   - Component relationships shown

### Component Details

Each component wireframe includes:
- **Component Name** - Label at the top
- **Structure** - Layout and hierarchy
- **Elements** - Buttons, inputs, text elements as wireframe boxes
- **Layout** - Spacing and positioning from code

## Example: What You'll See

### Button Component Wireframe
```
┌─────────────────────────────────┐
│ Button Component                │
├─────────────────────────────────┤
│ ┌─────────┐                     │
│ │ Button  │ (Primary variant)   │
│ └─────────┘                     │
│ ┌─────────┐                     │
│ │ Button  │ (Secondary variant) │
│ └─────────┘                     │
│ ... (all variants)              │
└─────────────────────────────────┘
```

### UI Showcase Page Wireframe
```
┌─────────────────────────────────────────┐
│ UI Showcase - Design System             │
├─────────────────────────────────────────┤
│ Header Section                          │
│ ├─ Title                                │
│ └─ Navigation                           │
│                                         │
│ Foundations Section                     │
│ ├─ Colors                               │
│ ├─ Typography                           │
│ └─ Spacing                              │
│                                         │
│ Components Section                      │
│ ├─ Button Examples                      │
│ ├─ Modal Demo                           │
│ ├─ Input Examples                       │
│ └─ ... (all components)                 │
└─────────────────────────────────────────┘
```

## Customization

### Sync Specific Components Only

You can sync only the UI components (not pages):

```bash
curl -X POST http://localhost:3001/api/figma/sync-components \
  -H "Content-Type: application/json" \
  -d '{
    "componentNames": ["Button", "Modal", "Input", "Textarea", "Select", "Heading"],
    "pageType": "wireframes"
  }'
```

### Sync Just UI Showcase Page

```bash
curl -X POST http://localhost:3001/api/figma/sync-components \
  -H "Content-Type: application/json" \
  -d '{
    "componentNames": ["UIShowcase"],
    "pageType": "wireframes"
  }'
```

Then use the Figma plugin to render it.

## Troubleshooting

### No Components Found

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/api/figma/scan-components
   ```
   Should return a list of components

2. **Check component files exist:**
   - `chat-client-vite/src/components/UIShowcase.jsx`
   - `chat-client-vite/src/components/ui/Button/Button.jsx`
   - etc.

### Wireframes Not Appearing

1. **Check plugin console:**
   - In Figma: `Plugins` → `Development` → `Open Console`
   - Look for errors

2. **Check backend logs:**
   - Look for scanning errors
   - Verify file paths are correct

3. **Try syncing again:**
   - Close and reopen plugin
   - Click "Sync Components from Code" again

### Backend Connection Error

1. **Verify backend URL:**
   - Check API URL in plugin UI
   - Should be `http://localhost:3001` for local development

2. **Test backend directly:**
   ```bash
   curl http://localhost:3001/api/figma/status
   ```
   Should return `{"available": true, ...}`

## Next Steps

After syncing wireframes to Figma:

1. **Review Wireframes** - Check component structures
2. **Annotate** - Add notes or labels in Figma
3. **Refine** - Update code, sync again to see changes
4. **Create Design Pages** - Extend to generate full design pages with styling
5. **Share** - Share Figma file with team for review

## Tips

- **Sync Regularly** - After making component changes, sync again to update wireframes
- **Use Wireframes as Reference** - Keep wireframes alongside designs
- **Iterate** - Design in code → Sync to Figma → Review → Update code → Sync again
- **Component Focus** - Sync individual components to focus on specific ones

## Related Documentation

- `CODE_TO_FIGMA_SYNC.md` - Full sync system documentation
- `UI_SHOWCASE_README.md` - UI Showcase page guide
- `DESIGN_SYSTEM.md` - Design system documentation

---

**Ready to sync?** Run the plugin and click "Sync Components from Code"! 🚀

