# Design Tokens Usage Guide

## Overview

Design tokens are now integrated into Tailwind CSS configuration. This document explains how to use tokens consistently throughout the codebase.

## Token Integration

Design tokens from `.design-tokens-mcp/tokens.json` are automatically loaded into Tailwind config at `chat-client-vite/tailwind.config.js`.

## Color Tokens

### Teal Palette
Instead of hardcoded hex values, use Tailwind classes:

| Token | Hex Value | Tailwind Class | Usage |
|-------|-----------|----------------|-------|
| `teal.lightest` | `#E6F7F5` | `bg-teal-lightest` | Subtle backgrounds, hover states |
| `teal.light` | `#C5E8E4` | `bg-teal-light`, `border-teal-light` | Borders, soft backgrounds |
| `teal.medium` | `#4DA8B0` | `bg-teal-medium`, `text-teal-medium` | Interactive elements, links, secondary buttons |
| `teal.dark` | `#275559` | `bg-teal-dark`, `text-teal-dark` | Primary buttons, headers, emphasis |
| `teal.darkest` | `#1f4447` | `bg-teal-darkest` | Hover states on dark teal elements |

### Migration Examples

**Before (Hardcoded):**
```jsx
<button className="bg-[#275559] hover:bg-[#1f4447] text-white">
  Primary Action
</button>
```

**After (Token-based):**
```jsx
<button className="bg-teal-dark hover:bg-teal-darkest text-white">
  Primary Action
</button>
```

**Before:**
```jsx
<div className="border-2 border-[#C5E8E4] bg-[#E6F7F5]">
  Card Content
</div>
```

**After:**
```jsx
<div className="border-2 border-teal-light bg-teal-lightest">
  Card Content
</div>
```

### UI Colors

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `ui.background` | `bg-ui-background` | Main background (white) |
| `ui.surface` | `bg-ui-surface` | Elevated surfaces (grey-50) |
| `ui.border` | `border-ui-border` | Default borders (grey-200) |
| `ui.text.primary` | `text-ui-text-primary` | Main body text (grey-900) |
| `ui.text.secondary` | `text-ui-text-secondary` | Supporting text (grey-600) |
| `ui.text.tertiary` | `text-ui-text-tertiary` | Placeholders, hints (grey-400) |

### Semantic Colors

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `semantic.success` | `bg-semantic-success`, `text-semantic-success` | Success messages |
| `semantic.warning` | `bg-semantic-warning`, `text-semantic-warning` | Warnings |
| `semantic.error` | `bg-semantic-error`, `text-semantic-error` | Errors |
| `semantic.info` | `bg-semantic-info`, `text-semantic-info` | Info messages |

## Spacing Tokens

Use Tailwind spacing scale (already aligned with tokens):

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `xs` | 4px | `p-xs`, `m-xs`, `gap-xs` | Tight spacing |
| `sm` | 8px | `p-sm`, `m-sm`, `gap-sm` | Standard gap |
| `md` | 16px | `p-md`, `m-md`, `gap-md` | Default spacing |
| `lg` | 24px | `p-lg`, `m-lg`, `gap-lg` | Section spacing |
| `xl` | 32px | `p-xl`, `m-xl`, `gap-xl` | Large sections |
| `2xl` | 48px | `p-2xl`, `m-2xl`, `gap-2xl` | Mobile nav clearance |
| `3xl` | 64px | `p-3xl`, `m-3xl`, `gap-3xl` | Major sections |

**Note:** Tailwind's default spacing (0.25rem = 4px, 0.5rem = 8px, etc.) already matches our tokens, so you can use standard Tailwind classes like `p-4`, `p-8`, `p-16`, etc.

## Border Radius Tokens

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `sm` | 6px | `rounded-sm` | Small elements |
| `md` | 8px | `rounded-md` | Default |
| `lg` | 12px | `rounded-lg` | Buttons, inputs |
| `xl` | 16px | `rounded-xl` | Cards |
| `2xl` | 24px | `rounded-2xl` | Modals, large cards |
| `full` | 9999px | `rounded-full` | Circles |

## Typography Tokens

### Font Family
```jsx
// Use Inter font family (default in Tailwind config)
<div className="font-primary">Text</div>
```

### Font Sizes
| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `xs` | 12px | `text-xs` | Labels, captions |
| `sm` | 14px | `text-sm` | Secondary text |
| `base` | 16px | `text-base` | Body text, inputs |
| `lg` | 18px | `text-lg` | Emphasized body |
| `xl` | 20px | `text-xl` | Section headers |
| `2xl` | 24px | `text-2xl` | Page titles |
| `3xl` | 30px | `text-3xl` | Hero text |
| `4xl` | 36px | `text-4xl` | Landing headlines |

### Font Weights
| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `normal` | 400 | `font-normal` | Body text |
| `medium` | 500 | `font-medium` | Labels, emphasis |
| `semibold` | 600 | `font-semibold` | Headings, buttons |
| `bold` | 700 | `font-bold` | Strong emphasis |

## Shadow Tokens

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `sm` | `shadow-sm` | Subtle elevation |
| `md` | `shadow-md` | Cards |
| `lg` | `shadow-lg` | Modals |
| `xl` | `shadow-xl` | Dropdowns |
| `2xl` | `shadow-2xl` | Prominent elements |

## Z-Index Tokens

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `nav` | 50 | `z-nav` | Navigation bars |
| `modal` | 100 | `z-modal` | Modals |

## Migration Checklist

When updating components to use tokens:

- [ ] Replace `bg-[#275559]` → `bg-teal-dark`
- [ ] Replace `bg-[#4DA8B0]` → `bg-teal-medium`
- [ ] Replace `bg-[#C5E8E4]` → `bg-teal-light`
- [ ] Replace `bg-[#E6F7F5]` → `bg-teal-lightest`
- [ ] Replace `bg-[#1f4447]` → `bg-teal-darkest`
- [ ] Replace `border-[#C5E8E4]` → `border-teal-light`
- [ ] Replace `text-[#4DA8B0]` → `text-teal-medium`
- [ ] Replace `text-[#275559]` → `text-teal-dark`
- [ ] Replace hardcoded spacing with Tailwind spacing classes
- [ ] Replace hardcoded border radius with token classes
- [ ] Replace hardcoded shadows with token classes
- [ ] Use `z-nav` and `z-modal` for z-index

## Benefits

✅ **Consistency**: All components use the same token values  
✅ **Maintainability**: Change tokens once, update everywhere  
✅ **Type Safety**: Tailwind IntelliSense for token classes  
✅ **Documentation**: Token values are self-documenting  
✅ **Design System Compliance**: Enforced through Tailwind config  

## Token Updates

To update a token value:
1. Edit `.design-tokens-mcp/tokens.json`
2. Restart the dev server (Tailwind config will reload)
3. All components using that token will automatically update

## Common Patterns

### Primary Button
```jsx
<button className="bg-teal-dark hover:bg-teal-darkest text-white rounded-lg font-semibold px-6 py-3 min-h-[44px]">
  Primary Action
</button>
```

### Secondary Button
```jsx
<button className="bg-teal-medium hover:bg-teal-dark text-white rounded-lg font-semibold px-6 py-3 min-h-[44px]">
  Secondary Action
</button>
```

### Card
```jsx
<div className="bg-white rounded-xl border-2 border-teal-light shadow-sm p-6">
  Card Content
</div>
```

### Input
```jsx
<input className="w-full px-4 py-3 border-2 border-ui-border rounded-lg focus:outline-none focus:border-teal-dark text-base text-ui-text-primary min-h-[44px]" />
```

