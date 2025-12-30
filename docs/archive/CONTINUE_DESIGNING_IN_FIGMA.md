# Continue Designing in Figma - Guide

## Overview

Now that your wireframes are in Figma, you can continue developing and refining the designs based on your existing website and app. This guide shows you how to enhance the wireframes into full designs.

## Two Sync Options

### 1. Wireframes (Structure Only)

- Click **"🔄 Sync Wireframes"**
- Creates basic structure with gray boxes
- Shows component hierarchy and layout
- Good for initial planning and structure review

### 2. Design Pages (Full Styling) ✨ NEW

- Click **"🎨 Sync Design Pages (Styled)"**
- Creates fully-styled designs with:
  - Actual colors from your design tokens
  - Typography (Inter font family)
  - Spacing and layout from Tailwind classes
  - Borders, shadows, and visual effects
- Matches your existing app design
- Perfect for visual design refinement

## Workflow: Design in Code → Refine in Figma

### Step 1: Update Your Code

Make changes to your React components:

```jsx
// Update component styling
<Button variant="primary" className="bg-teal-medium hover:bg-teal-dark">
  New Button Style
</Button>
```

### Step 2: Sync to Figma

1. **Open Figma** and your file
2. **Run the plugin**: `Plugins` → `Development` → `LiaiZen Design Sync`
3. **Click "🎨 Sync Design Pages (Styled)"**
4. See your updated designs appear in Figma!

### Step 3: Refine in Figma

Now you can:

- **Add annotations** - Notes for developers
- **Adjust spacing** - Fine-tune spacing values
- **Test variations** - Try different color combinations
- **Add interactions** - Prototype user flows
- **Export assets** - Get images for documentation

### Step 4: Iterate

- Make code changes
- Sync again to see updates
- Refine in Figma
- Repeat!

## What Gets Styled

The Design Pages include styling from your code:

### Colors

- **Teal Palette**: Darkest, Dark, Medium, Light, Lightest
- **Background Colors**: White, gray-50, teal-lightest
- **Text Colors**: gray-900, gray-600, teal-dark, white
- **Semantic Colors**: Success, warning, error, info

### Typography

- **Font Family**: Inter
- **Font Sizes**: From Tailwind classes (text-sm, text-base, text-lg, etc.)
- **Font Weights**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing

- **Padding/Margins**: From Tailwind spacing classes (p-4 = 16px, p-6 = 24px, etc.)
- **Gaps**: Maintains spacing from gap classes

### Visual Effects

- **Border Radius**: Rounded corners (rounded-lg = 12px, rounded-full, etc.)
- **Shadows**: Box shadows for elevation
- **Borders**: Teal-light borders (2px width)

### Layout

- **Flex Layouts**: Row and column layouts preserved
- **Grid Layouts**: Grid structures maintained
- **Container Widths**: Max-width constraints applied

## Design Tokens Mapped

Your design tokens are automatically mapped:

| Code (Tailwind)  | Figma Color | Hex Value |
| ---------------- | ----------- | --------- |
| `bg-teal-dark`   | Teal Dark   | #275559   |
| `bg-teal-medium` | Teal Medium | #4DA8B0   |
| `bg-teal-light`  | Teal Light  | #C5E8E4   |
| `text-gray-900`  | Gray 900    | #111827   |
| `text-gray-600`  | Gray 600    | #4b5563   |

## Tips for Design Refinement

### 1. Use Design System Styles

In Figma, your design system styles are available:

- **Color Styles**: `Teal/Dark`, `Teal/Medium`, etc.
- **Text Styles**: `LiaiZen/XL/Semibold`, etc.
- **Effect Styles**: `Shadow/MD`, etc.

Use these styles when refining designs for consistency.

### 2. Maintain Component Structure

The wireframes preserve your component hierarchy:

- Keep the structure intact
- Refine styling within the structure
- Don't break the component relationships

### 3. Test Variations

Create component variants in Figma:

- Different color combinations
- Size variations
- State variations (hover, active, disabled)

### 4. Document Interactions

Add notes and annotations:

- Click interactions
- Hover states
- Animation notes
- Responsive behavior

## Example: Enhancing Button Component

### Initial Sync

1. Sync creates button wireframe with basic structure
2. Shows button element with label

### Refine in Figma

1. **Add actual styling**:
   - Background: `Teal/Dark` color style
   - Text: `LiaiZen/BASE/Semibold` text style
   - Border Radius: 9999px (full rounded)
   - Shadow: `Shadow/MD` effect style

2. **Create variants**:
   - Primary (teal-dark background)
   - Secondary (teal-medium background)
   - Tertiary (outline style)

3. **Add states**:
   - Default
   - Hover (darker background)
   - Disabled (reduced opacity)

### Sync Again

After code changes, sync again to see updates automatically!

## Next Steps

### Immediate Actions

1. **Try Design Pages**:
   - Click "🎨 Sync Design Pages (Styled)"
   - See fully-styled versions of your components

2. **Refine Wireframes**:
   - Add annotations
   - Adjust spacing
   - Create variations

3. **Create Component Library**:
   - Convert wireframes to Figma Components
   - Create variants for different states
   - Build a reusable component system

### Advanced Workflows

1. **Design Tokens Sync**:
   - Update tokens in code
   - Run "Create LiaiZen Design System" in plugin
   - All styles update automatically

2. **Component Variants**:
   - Create variants for all button types
   - Build modal variants
   - Design input field variants

3. **Prototype Interactions**:
   - Add click interactions
   - Create user flows
   - Test navigation patterns

## Troubleshooting

### Styles Not Applying

- Check if design tokens are correct in code
- Verify Tailwind classes are standard (not custom arbitrary values)
- Try syncing wireframes first, then design pages

### Colors Not Matching

- Ensure you're using design token classes (`bg-teal-dark` not `bg-[#275559]`)
- Check design tokens file: `.design-tokens-mcp/tokens.json`
- Re-sync to get latest token values

### Layout Issues

- Some complex layouts may need manual adjustment
- Check component structure in code matches Figma
- Verify Tailwind classes are being parsed correctly

## Best Practices

### ✅ Do

- Use design token classes in code
- Keep component structure consistent
- Sync regularly to see updates
- Refine in Figma while maintaining code as source of truth

### ❌ Don't

- Manually edit synced components extensively (they'll be overwritten)
- Break component hierarchy
- Use hardcoded colors that don't match tokens

## Resources

- **Design System**: `DESIGN_SYSTEM.md`
- **Design Tokens**: `DESIGN_TOKENS_USAGE.md`
- **UI Showcase**: `http://localhost:5173/ui-showcase`
- **Figma Plugin**: `figma-plugin/README.md`

---

**Ready to design?** Try the "🎨 Sync Design Pages (Styled)" button to see your fully-styled components! 🎨
