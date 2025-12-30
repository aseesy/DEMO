# Button Component Guide

## Overview

The Button component now uses **teal-medium (#4DA8B0) as the PRIMARY BRAND COLOR** for filled buttons, matching the professional mediation style from the design reference.

---

## Button Variants

### Primary Button (Teal Filled) - Main CTA

**Use for:** Main call-to-action buttons, "Book Consultation", primary actions, form submissions

```jsx
import { Button } from './components/ui';

<Button variant="primary">Book Consultation</Button>;
```

**Visual Style:**

- Background: `#4DA8B0` (teal-medium) - PRIMARY BRAND COLOR
- Text: White
- Hover: `#3d8a92` (10-15% darker)
- Border Radius: `rounded-lg` (12px)
- Shadow: `shadow-md` with `hover:shadow-lg`
- Font: Semibold (600)

**Example:**

```jsx
<Button variant="primary" size="large">
  Book Consultation
</Button>
```

---

### Outline Button (White with Gray Border) - Secondary CTA

**Use for:** "How it Works", alternative actions, secondary CTAs, less prominent actions

```jsx
<Button variant="outline">How it Works</Button>
```

**Visual Style:**

- Background: White
- Text: `#111827` (gray-900)
- Border: `#E5E7EB` (gray-200) - Light gray, subtle
- Hover: Light gray background (`gray-50`)
- Border Radius: `rounded-lg` (12px)
- Font: Semibold (600)

**Example:**

```jsx
<Button variant="outline" size="large">
  How it Works
</Button>
```

---

### Secondary Button (Dark Teal)

**Use for:** Alternative primary actions when you need contrast

```jsx
<Button variant="secondary">Secondary Action</Button>
```

**Visual Style:**

- Background: `#275559` (teal-dark)
- Text: White
- Hover: `#1f4447` (teal-darkest)

---

### Tertiary Button (Teal Outline)

**Use for:** Cancel, dismiss, less important actions

```jsx
<Button variant="tertiary">Cancel</Button>
```

**Visual Style:**

- Background: White
- Text: `#4DA8B0` (teal-medium)
- Border: `#C5E8E4` (teal-light)
- Hover: `#E6F7F5` (teal-lightest)

---

## Button Sizes

```jsx
<Button size="small">Small</Button>   // px-3 py-2 text-sm
<Button size="medium">Medium</Button> // px-4 py-3 text-base (default)
<Button size="large">Large</Button>   // px-8 py-4 text-lg
<Button size="xl">Extra Large</Button> // px-10 py-5 text-xl
```

---

## Button Props

| Prop           | Type                                                                         | Default     | Description                   |
| -------------- | ---------------------------------------------------------------------------- | ----------- | ----------------------------- |
| `variant`      | `'primary' \| 'outline' \| 'secondary' \| 'tertiary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant          |
| `size`         | `'small' \| 'medium' \| 'large' \| 'xl'`                                     | `'medium'`  | Button size                   |
| `fullWidth`    | `boolean`                                                                    | `false`     | Takes full width of container |
| `disabled`     | `boolean`                                                                    | `false`     | Disables button interaction   |
| `loading`      | `boolean`                                                                    | `false`     | Shows loading spinner         |
| `icon`         | `ReactNode`                                                                  | `null`      | Icon to display               |
| `iconPosition` | `'left' \| 'right'`                                                          | `'left'`    | Position of icon              |
| `onClick`      | `function`                                                                   | -           | Click handler                 |
| `type`         | `'button' \| 'submit' \| 'reset'`                                            | `'button'`  | HTML button type              |
| `className`    | `string`                                                                     | `''`        | Additional CSS classes        |

---

## Usage Examples

### Hero Section Buttons (Matching Image Style)

```jsx
<div className="flex flex-col sm:flex-row gap-4">
  <Button variant="primary" size="large">
    Book Consultation
  </Button>
  <Button variant="outline" size="large">
    How it Works
  </Button>
</div>
```

### Form Buttons

```jsx
<div className="flex gap-4">
  <Button variant="primary" type="submit">
    Submit
  </Button>
  <Button variant="outline" type="button" onClick={handleCancel}>
    Cancel
  </Button>
</div>
```

### Button with Icon

```jsx
<Button variant="primary" icon={<ArrowRightIcon />} iconPosition="right">
  Continue
</Button>
```

### Loading State

```jsx
<Button variant="primary" loading>
  Processing...
</Button>
```

---

## Design Principles

1. **Primary buttons** use the teal-medium (#00908B) brand color - this is the signature color
2. **Outline buttons** use white background with subtle gray border for clean, minimal look
3. **All buttons** use `rounded-lg` (12px) for professional, modern appearance
4. **Minimum height** is 44px for touch-friendly interactions
5. **Shadows** are used on primary buttons for depth and prominence
6. **Hover states** darken the background by 10-15% for clear feedback

---

## Migration Notes

**Old Pattern (Deprecated):**

```jsx
// ❌ Don't use rounded-full anymore
<Button variant="primary" className="rounded-full">...</Button>

// ❌ Don't use teal-dark for primary
<button className="bg-teal-dark">...</button>
```

**New Pattern (Recommended):**

```jsx
// ✅ Use default rounded-lg
<Button variant="primary">...</Button>

// ✅ Primary uses teal-medium automatically
<Button variant="primary">...</Button>
```

---

## Color Reference

- **Primary Brand Color**: `#00908B` (teal-medium)
- **Primary Hover**: `#3d8a92`
- **Outline Border**: `#E5E7EB` (gray-200)
- **Outline Text**: `#111827` (gray-900)
- **Outline Hover**: `#F9FAFB` (gray-50)

---

**Status**: ✅ Updated to use teal-medium as primary brand color with professional button styles
