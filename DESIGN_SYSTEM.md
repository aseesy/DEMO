# LiaiZen Design System

**Last Updated:** November 21, 2025
**Status:** Phase 2 Complete (Button Component)
**Version:** 2.0

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Components](#components)
   - [Button](#button)
   - [Modal](#modal)
   - [Input](#input-coming-soon)
4. [Usage Guidelines](#usage-guidelines)
5. [Migration Guides](#migration-guides)
6. [Component Patterns](#component-patterns)

---

## Overview

The LiaiZen Design System is a comprehensive collection of reusable components, design tokens, and patterns that ensure consistency, accessibility, and maintainability across the co-parenting platform.

### Goals
- ✅ **Consistency:** Same components look and behave identically everywhere
- ✅ **Maintainability:** Change once, update everywhere
- ✅ **Accessibility:** WCAG 2.1 AA compliance built-in
- ✅ **Design Tokens:** Centralized color, spacing, typography management
- ✅ **Developer Experience:** Fast, intuitive component API

### Current Status
- **Phase 1:** ✅ Foundation components (Button, Modal, Input) created
- **Phase 2:** ✅ Button migration complete (9 files, 33 buttons)
- **Phase 3:** 🔜 Input component migration (planned)

---

## Design Tokens

Design tokens are the centralized source of truth for all design decisions (colors, spacing, typography, etc.).

### Location
- **Token Definition:** `.design-tokens-mcp/tokens.json`
- **Tailwind Config:** `chat-client-vite/tailwind.config.js`

### Color Tokens

#### Brand Colors (Teal)
```js
// Primary teal colors
teal-darkest: #1f4447   // Dark teal for hover states
teal-dark: #275559      // Primary dark teal
teal-medium: #00908B    // Primary teal
teal-light: #C5E8E4     // Light teal for backgrounds
teal-lightest: #E6F7F5  // Very light teal for subtle backgrounds
```

#### Usage in Code
```jsx
// In Tailwind classes
className="bg-teal-dark text-white hover:bg-teal-darkest"

// In Button component
<Button variant="primary">   {/* Uses teal-dark */}
<Button variant="secondary"> {/* Uses teal-medium */}
```

#### Semantic Tokens
```js
// Success
success: #46BD92 / #6dd4b0

// Danger/Error
danger: red-600 (#dc2626)

// Warning
warning: yellow-500

// Info
info: blue-500
```

---

## Components

### Button

The Button component is a flexible, accessible action button with multiple variants, sizes, and states.

#### Import
```jsx
import { Button } from './ui';
// OR
import { Button } from '../ui';
```

#### Basic Usage
```jsx
<Button variant="primary" size="medium" onClick={handleClick}>
  Click Me
</Button>
```

#### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `fullWidth` | `boolean` | `false` | Takes full width of container |
| `disabled` | `boolean` | `false` | Disables button interaction |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `icon` | `ReactNode` | `null` | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position of icon |
| `onClick` | `function` | - | Click handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `className` | `string` | `''` | Additional CSS classes |

#### Variants

##### Primary
Primary call-to-action buttons for main actions.
```jsx
<Button variant="primary">Save</Button>
```
- **Background:** teal-dark (#275559)
- **Text:** white
- **Hover:** teal-darkest (#1f4447)
- **Use For:** Main CTAs, submit actions, primary saves

##### Secondary
Secondary actions and features.
```jsx
<Button variant="secondary">Add Contact</Button>
```
- **Background:** teal-medium (#00908B)
- **Text:** white
- **Hover:** teal-dark (#275559)
- **Use For:** Secondary actions, AI features, alternative CTAs

##### Tertiary
Alternative actions with border style.
```jsx
<Button variant="tertiary">Cancel</Button>
```
- **Background:** transparent
- **Border:** 2px teal-dark
- **Text:** teal-dark
- **Hover:** teal-lightest background
- **Use For:** Cancel, alternative actions, less emphasis

##### Ghost
Minimal style for subtle actions.
```jsx
<Button variant="ghost">Close</Button>
```
- **Background:** transparent
- **Text:** teal-dark
- **Hover:** teal-lightest background
- **Use For:** Close buttons, hide, dismiss, icon-only actions

##### Danger
Destructive actions.
```jsx
<Button variant="danger">Delete</Button>
```
- **Background:** red-600
- **Text:** white
- **Hover:** red-700
- **Use For:** Delete, remove, destructive actions

#### Sizes

##### Small
```jsx
<Button size="small">Small Button</Button>
```
- **Padding:** px-3 py-2
- **Text:** text-sm
- **Use For:** Compact interfaces, modal footers, cards

##### Medium (Default)
```jsx
<Button size="medium">Medium Button</Button>
```
- **Padding:** px-4 py-3
- **Text:** text-base
- **Use For:** Most buttons, forms, general actions

##### Large
```jsx
<Button size="large">Large Button</Button>
```
- **Padding:** px-6 py-4
- **Text:** text-lg
- **Use For:** Hero CTAs, important actions, landing pages

#### States

##### Loading
Shows spinner and "Loading..." text automatically.
```jsx
<Button loading={isLoading} disabled={isLoading}>
  Save
</Button>
```
- **Displays:** Spinner + "Loading..." text
- **Behavior:** Automatically disabled while loading
- **Use For:** Async actions (save, submit, API calls)

##### Disabled
```jsx
<Button disabled>
  Disabled Button
</Button>
```
- **Appearance:** Gray background, reduced opacity
- **Behavior:** No click events, cursor not-allowed
- **Use For:** Unavailable actions, form validation

##### With Icon
```jsx
<Button
  icon={<PlusIcon />}
  iconPosition="left"
>
  Add Item
</Button>
```
- **Icon Position:** left (default) or right
- **Spacing:** Automatic gap-2 between icon and text
- **Use For:** Actions with visual indicators

#### Examples

##### Save Button with Loading
```jsx
<Button
  variant="primary"
  loading={isSaving}
  disabled={isSaving || !isValid}
  onClick={handleSave}
>
  Save Changes
</Button>
```

##### Delete Button with Confirmation
```jsx
<Button
  variant="danger"
  onClick={() => {
    if (confirm('Are you sure?')) {
      handleDelete();
    }
  }}
>
  Delete
</Button>
```

##### Icon Button
```jsx
<Button
  variant="ghost"
  size="small"
  icon={<EditIcon />}
  aria-label="Edit"
/>
```

##### Full-Width Submit Button
```jsx
<Button
  type="submit"
  variant="primary"
  fullWidth
  loading={isSubmitting}
>
  Create Account
</Button>
```

##### Custom Styled Button
```jsx
<Button
  variant="primary"
  className="bg-gradient-to-br from-purple-600 to-indigo-700"
>
  Custom Gradient
</Button>
```

##### Toggle Button Pattern
```jsx
{daysOfWeek.map(day => (
  <Button
    key={day}
    variant={selectedDays.includes(day) ? 'secondary' : 'tertiary'}
    onClick={() => toggleDay(day)}
  >
    {day}
  </Button>
))}
```

#### Accessibility

All buttons include:
- ✅ **Focus Ring:** 2px teal-medium ring with offset
- ✅ **Touch Target:** Minimum 44px height (mobile-friendly)
- ✅ **ARIA Attributes:** aria-busy when loading
- ✅ **Keyboard Support:** Full keyboard navigation
- ✅ **Screen Reader:** Proper button semantics

#### Don't Use Button For

❌ **Navigation:** Use router Link or anchor tags
❌ **Navigation Tabs:** Use specialized tab components
❌ **Menu Items:** Use MenuItem components with role="menuitem"
❌ **Links:** Use anchor tags with proper href

---

### Modal

The Modal component provides accessible dialog overlays with backdrop, escape key support, and scroll locking.

#### Import
```jsx
import { Modal } from './ui';
```

#### Basic Usage
```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Edit Profile"
>
  <p>Modal content here...</p>
</Modal>
```

#### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls modal visibility |
| `onClose` | `function` | - | Called when modal should close |
| `title` | `string \| ReactNode` | - | Modal title (can be custom JSX) |
| `subtitle` | `string` | - | Optional subtitle |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Modal width |
| `footer` | `ReactNode` | - | Custom footer content |
| `showCloseButton` | `boolean` | `true` | Show X close button |
| `children` | `ReactNode` | - | Modal content |

#### Sizes

```jsx
// Small (max-w-md)
<Modal size="small" isOpen={isOpen} onClose={onClose} title="Confirm">
  <p>Are you sure?</p>
</Modal>

// Medium (max-w-xl) - Default
<Modal size="medium" isOpen={isOpen} onClose={onClose} title="Edit">
  <form>...</form>
</Modal>

// Large (max-w-3xl)
<Modal size="large" isOpen={isOpen} onClose={onClose} title="Details">
  <div>Large content...</div>
</Modal>
```

#### With Custom Footer
```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Delete"
  footer={
    <>
      <Button variant="tertiary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>This action cannot be undone.</p>
</Modal>
```

#### Custom Title (with Icon)
```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={
    <div className="flex items-center gap-2">
      <span className="text-2xl">🎉</span>
      <span>Congratulations!</span>
    </div>
  }
>
  <p>You've completed your profile!</p>
</Modal>
```

#### Accessibility

Modals include:
- ✅ **role="dialog":** Proper ARIA role
- ✅ **aria-modal="true":** Modal semantics
- ✅ **Escape Key:** Closes modal on Esc
- ✅ **Scroll Lock:** Body scroll locked when open
- ✅ **Focus Management:** Focus trapped within modal
- ✅ **z-index:** 100 (above all content)
- ✅ **Mobile Safe:** pb-24 padding for mobile bottom nav

---

### Input (Coming Soon)

Input component for forms with validation, error states, and accessibility.

**Status:** Phase 3 (Planned)

**Planned Features:**
- Text, email, password, search variants
- Error states with messages
- Helper text
- Icons (prefix/suffix)
- Character counter
- iOS-safe (16px font to prevent zoom)

---

## Usage Guidelines

### When to Use Button Component

✅ **DO Use For:**
- Action buttons (Save, Submit, Delete, Cancel)
- CTA buttons (Get Started, Sign Up, Subscribe)
- Modal action buttons (OK, Confirm, Close)
- Form submission buttons
- Icon buttons (Edit, Delete, Close)
- Toggle buttons (with variant switching)

❌ **DON'T Use For:**
- Navigation links (use Link or <a>)
- Navigation tabs (use specialized components)
- Menu items (use role="menuitem")
- Text links in paragraphs (use <a>)

### Variant Selection Guide

| Action Type | Variant | Example |
|-------------|---------|---------|
| Primary CTA | `primary` | Save, Submit, Get Started |
| Secondary action | `secondary` | Add Contact, Generate, Install |
| Cancel/Alternative | `tertiary` | Cancel, Back, Skip |
| Subtle action | `ghost` | Close, Hide, Dismiss, Edit icon |
| Destructive | `danger` | Delete, Remove, Logout |

### Size Selection Guide

| Context | Size | Example |
|---------|------|---------|
| Modal footer | `small` | Cancel, Save buttons in modals |
| Forms | `medium` | Submit, Reset buttons |
| Hero CTAs | `large` | Get Started, Sign Up on landing page |
| Cards | `small` | Edit, Delete in activity cards |
| Mobile bottom nav | `small` | Compact buttons for mobile |

---

## Migration Guides

### Migrating Existing Buttons

#### Step 1: Add Import
```jsx
import { Button } from './ui';
```

#### Step 2: Replace Button Element

**Before:**
```jsx
<button
  onClick={handleSave}
  disabled={isSaving}
  className="bg-teal-dark text-white px-4 py-3 rounded-lg hover:bg-teal-darkest"
>
  {isSaving ? 'Saving...' : 'Save'}
</button>
```

**After:**
```jsx
<Button
  onClick={handleSave}
  variant="primary"
  size="medium"
  loading={isSaving}
  disabled={isSaving}
>
  Save
</Button>
```

#### Step 3: Convert Loading State

**Before:**
```jsx
{isLoading ? (
  <span className="flex items-center gap-2">
    <Spinner />
    Loading...
  </span>
) : (
  'Submit'
)}
```

**After:**
```jsx
<Button loading={isLoading}>Submit</Button>
```

#### Step 4: Convert Icon

**Before:**
```jsx
<button className="...">
  <PlusIcon className="w-4 h-4" />
  <span>Add Item</span>
</button>
```

**After:**
```jsx
<Button icon={<PlusIcon className="w-4 h-4" />}>
  Add Item
</Button>
```

---

## Component Patterns

### Form Submission

```jsx
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="tertiary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting || !isValid}
        >
          Submit
        </Button>
      </div>
    </form>
  );
}
```

### Modal with Actions

```jsx
function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      footer={
        <>
          <Button
            variant="tertiary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </>
      }
    >
      <p>Are you sure you want to delete "{itemName}"? This cannot be undone.</p>
    </Modal>
  );
}
```

### Icon-Only Button

```jsx
function EditButton({ onClick }) {
  return (
    <Button
      variant="ghost"
      size="small"
      onClick={onClick}
      aria-label="Edit"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
    />
  );
}
```

### Toggle Group

```jsx
function ModeToggle() {
  const [mode, setMode] = useState('manual');

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={mode === 'manual' ? 'tertiary' : 'ghost'}
        onClick={() => setMode('manual')}
        className={mode === 'manual' ? 'bg-white shadow-sm' : ''}
      >
        Manual
      </Button>
      <Button
        variant={mode === 'ai' ? 'tertiary' : 'ghost'}
        onClick={() => setMode('ai')}
        className={mode === 'ai' ? 'bg-white shadow-sm' : ''}
      >
        AI-Assisted
      </Button>
    </div>
  );
}
```

### Loading Button with Custom Text

```jsx
function SubmitButton({ isLoading, hasChanges }) {
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={isLoading || !hasChanges}
      loading={isLoading}
    >
      {isLoading ? 'Saving Changes...' : 'Save Changes'}
    </Button>
  );
}
```

---

## Best Practices

### Do's ✅

1. **Use Semantic Variants**
   ```jsx
   <Button variant="primary">Save</Button>
   <Button variant="danger">Delete</Button>
   ```

2. **Always Handle Loading States**
   ```jsx
   <Button loading={isLoading} disabled={isLoading}>Submit</Button>
   ```

3. **Use aria-label for Icon-Only Buttons**
   ```jsx
   <Button icon={<CloseIcon />} aria-label="Close" />
   ```

4. **Disable During Async Operations**
   ```jsx
   <Button disabled={isLoading || !isValid}>Submit</Button>
   ```

5. **Use Appropriate Sizes**
   ```jsx
   <Button size="large">Hero CTA</Button>
   <Button size="small">Modal Footer</Button>
   ```

### Don'ts ❌

1. **Don't Mix Button Styles**
   ```jsx
   ❌ <Button variant="primary" className="bg-blue-500">
   ✅ <Button variant="primary">
   ```

2. **Don't Use for Navigation**
   ```jsx
   ❌ <Button onClick={() => navigate('/home')}>Home</Button>
   ✅ <Link to="/home">Home</Link>
   ```

3. **Don't Skip Loading States**
   ```jsx
   ❌ <Button onClick={asyncAction}>Save</Button>
   ✅ <Button loading={isSaving} onClick={asyncAction}>Save</Button>
   ```

4. **Don't Use Too Many Variants**
   ```jsx
   ❌ Primary + Secondary + Tertiary all in same context
   ✅ Primary + Tertiary (clear hierarchy)
   ```

---

## Component File Structure

```
chat-client-vite/src/components/ui/
├── Button/
│   ├── Button.jsx          # Button component
│   └── index.js            # Re-export
├── Modal/
│   ├── Modal.jsx           # Modal component
│   └── index.js            # Re-export
├── Input/
│   ├── Input.jsx           # Input component (Phase 3)
│   └── index.js            # Re-export
└── index.js                # Barrel export for all components
```

---

## Resources

- **Token Definition:** `.design-tokens-mcp/tokens.json`
- **Tailwind Config:** `chat-client-vite/tailwind.config.js`
- **Button Component:** `chat-client-vite/src/components/ui/Button/Button.jsx`
- **Modal Component:** `chat-client-vite/src/components/ui/Modal/Modal.jsx`
- **Phase 2 Report:** `PHASE_2_COMPLETION_REPORT.md`

---

## Changelog

### Version 2.0 (November 21, 2025)
- ✅ Phase 2 Complete: Button component migration (9 files, 33 buttons)
- ✅ Created comprehensive design system documentation
- ✅ Established component patterns and usage guidelines

### Version 1.0 (Phase 1)
- Created Button, Modal, Input foundation components
- Defined design tokens in Tailwind config
- Established component architecture

---

**Maintained by:** Claude (AI Assistant)
**Next Phase:** Input Component Migration (Phase 3)
