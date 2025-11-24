# Design System Migration Guide

**Complete guide for migrating components to the LiaiZen Design System**

---

## 📋 Table of Contents

1. [Before You Start](#before-you-start)
2. [Button Migration Checklist](#button-migration-checklist)
3. [Step-by-Step: Migrating Buttons](#step-by-step-migrating-buttons)
4. [Common Patterns & Solutions](#common-patterns--solutions)
5. [Modal Migration Guide](#modal-migration-guide)
6. [Input Migration Guide (Phase 3)](#input-migration-guide-phase-3)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Before You Start

### Prerequisites
- ✅ Read `DESIGN_SYSTEM.md` for component API reference
- ✅ Check `BUTTON_QUICK_REFERENCE.md` for common patterns
- ✅ Visit `/ui-showcase` to see components in action
- ✅ Ensure HMR (Hot Module Replacement) is working

### Tools You'll Need
- Code editor with search/replace
- Browser with dev server running
- Design system documentation open

### Time Estimates
- **Simple button:** 1-2 minutes
- **Complex button (icons, loading):** 3-5 minutes
- **Multiple buttons in file:** 5-10 minutes per file
- **Modal migration:** 10-15 minutes
- **Complete file review:** 15-30 minutes

---

## Button Migration Checklist

Use this checklist for each file you migrate:

### Pre-Migration
- [ ] Read the file to understand its purpose
- [ ] Count buttons to migrate (use `grep -c "<button"`)
- [ ] Identify button types (action, toggle, icon-only, etc.)
- [ ] Note any custom styling or behavior
- [ ] Check if file has loading states

### During Migration
- [ ] Add Button import at top of file
- [ ] Replace each button element
- [ ] Choose appropriate variant
- [ ] Choose appropriate size
- [ ] Handle loading states
- [ ] Preserve onClick handlers
- [ ] Preserve className overrides if needed
- [ ] Convert icons to icon prop
- [ ] Test in browser after each change

### Post-Migration
- [ ] Verify all buttons work correctly
- [ ] Check loading states function
- [ ] Test responsive behavior
- [ ] Verify accessibility (focus, keyboard)
- [ ] Remove unused button code/imports
- [ ] Clean up unused CSS classes
- [ ] Commit changes

---

## Step-by-Step: Migrating Buttons

### Step 1: Add Import

**At the top of your file, add:**
```jsx
import { Button } from './ui';
// OR for nested directories
import { Button } from '../ui';
```

**Example:**
```jsx
// Before
import React from 'react';
import { useState } from 'react';

// After
import React from 'react';
import { useState } from 'react';
import { Button } from './ui';
```

---

### Step 2: Find All Buttons

**Use grep to find buttons:**
```bash
grep -n "<button" path/to/your-file.jsx
```

**Or search in your editor:**
- VS Code: Cmd+F / Ctrl+F → search `<button`
- Count found: This tells you how many to migrate

---

### Step 3: Identify Button Type

For each button, identify what it does:

| Button Type | Typical Variant | Example |
|-------------|----------------|---------|
| Primary CTA | `primary` | Save, Submit, Get Started |
| Secondary action | `secondary` | Add, Generate, Install |
| Cancel/Back | `tertiary` | Cancel, Back, Close |
| Subtle action | `ghost` | Hide, Dismiss, × close |
| Destructive | `danger` | Delete, Remove |
| Toggle | `secondary/tertiary` | Day selector, mode toggle |

---

### Step 4: Replace Button

#### Simple Button Example

**Before:**
```jsx
<button
  onClick={handleSave}
  className="bg-teal-dark text-white px-4 py-3 rounded-lg hover:bg-teal-darkest"
>
  Save
</button>
```

**After:**
```jsx
<Button
  onClick={handleSave}
  variant="primary"
  size="medium"
>
  Save
</Button>
```

**What Changed:**
- ✅ `<button>` → `<Button>`
- ✅ Removed style classes
- ✅ Added `variant="primary"`
- ✅ Added `size="medium"`

---

#### Button with Loading State

**Before:**
```jsx
<button
  onClick={handleSave}
  disabled={isSaving}
  className="bg-teal-dark text-white px-4 py-3 rounded-lg"
>
  {isSaving ? 'Saving...' : 'Save'}
</button>
```

**After:**
```jsx
<Button
  onClick={handleSave}
  variant="primary"
  loading={isSaving}
  disabled={isSaving}
>
  Save
</Button>
```

**What Changed:**
- ✅ Added `loading={isSaving}`
- ✅ Removed conditional text (automatic)
- ✅ Spinner shows automatically

---

#### Button with Icon

**Before:**
```jsx
<button className="...">
  <svg className="w-4 h-4">...</svg>
  <span>Add Item</span>
</button>
```

**After:**
```jsx
<Button
  variant="primary"
  icon={
    <svg className="w-4 h-4">...</svg>
  }
>
  Add Item
</Button>
```

**What Changed:**
- ✅ Icon moved to `icon` prop
- ✅ Text moved to children
- ✅ Spacing handled automatically

---

#### Icon-Only Button

**Before:**
```jsx
<button
  onClick={onClose}
  className="text-gray-500 hover:text-teal-medium"
  aria-label="Close"
>
  ×
</button>
```

**After:**
```jsx
<Button
  onClick={onClose}
  variant="ghost"
  size="small"
  aria-label="Close"
>
  ×
</Button>
```

**What Changed:**
- ✅ Used `ghost` variant (subtle)
- ✅ Used `small` size
- ✅ Kept aria-label (accessibility)

---

#### Full-Width Button

**Before:**
```jsx
<button className="w-full bg-teal-dark text-white ...">
  Submit
</button>
```

**After:**
```jsx
<Button
  variant="primary"
  fullWidth
>
  Submit
</Button>
```

**What Changed:**
- ✅ Added `fullWidth` prop
- ✅ Removed `w-full` class

---

#### Toggle Button

**Before:**
```jsx
<button
  onClick={() => toggleDay(day)}
  className={`px-3 py-2 rounded ${
    selectedDays.includes(day)
      ? 'bg-teal-medium text-white'
      : 'bg-white text-teal-medium border'
  }`}
>
  {day}
</button>
```

**After:**
```jsx
<Button
  onClick={() => toggleDay(day)}
  variant={selectedDays.includes(day) ? 'secondary' : 'tertiary'}
  size="small"
>
  {day}
</Button>
```

**What Changed:**
- ✅ Variant switches based on state
- ✅ No manual class management
- ✅ Cleaner conditional logic

---

### Step 5: Handle Special Cases

#### Custom Gradient Button

**Solution:** Use className override
```jsx
<Button
  variant="primary"
  className="bg-gradient-to-br from-purple-600 to-indigo-700"
>
  Custom Style
</Button>
```

#### Button with Custom Colors

**Solution:** Use className for special cases
```jsx
<Button
  variant="primary"
  className="bg-indigo-600 hover:bg-indigo-700"
>
  Custom Color
</Button>
```

#### Button Inside Form

**Important:** Preserve `type` attribute
```jsx
<Button
  type="submit"  // ← Important!
  variant="primary"
>
  Submit Form
</Button>
```

---

### Step 6: Test Changes

After each button replacement:

1. **Visual Check:**
   - Does it look correct?
   - Is the variant appropriate?
   - Is the size right?

2. **Interaction Check:**
   - Click the button
   - Verify onClick works
   - Test loading state if present
   - Check disabled state if present

3. **Accessibility Check:**
   - Tab to button (focus visible?)
   - Press Enter/Space (activates?)
   - Screen reader friendly?

---

## Common Patterns & Solutions

### Pattern 1: Modal Footer Buttons

**Before:**
```jsx
<div className="flex gap-2">
  <button className="...">Cancel</button>
  <button className="...">Save</button>
</div>
```

**After:**
```jsx
<div className="flex gap-2">
  <Button variant="tertiary" onClick={onClose}>
    Cancel
  </Button>
  <Button variant="primary" onClick={onSave}>
    Save
  </Button>
</div>
```

**Or use Modal footer prop:**
```jsx
<Modal
  footer={
    <>
      <Button variant="tertiary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={onSave}>Save</Button>
    </>
  }
>
  Content
</Modal>
```

---

### Pattern 2: Form Submission

**Before:**
```jsx
<form onSubmit={handleSubmit}>
  {/* fields */}
  <button type="submit" disabled={!isValid}>
    Submit
  </button>
</form>
```

**After:**
```jsx
<form onSubmit={handleSubmit}>
  {/* fields */}
  <Button
    type="submit"
    variant="primary"
    disabled={!isValid}
    loading={isSubmitting}
  >
    Submit
  </Button>
</form>
```

---

### Pattern 3: Delete Confirmation

**Before:**
```jsx
<button
  onClick={() => {
    if (confirm('Are you sure?')) {
      handleDelete();
    }
  }}
  className="bg-red-600 text-white ..."
>
  Delete
</button>
```

**After:**
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

---

### Pattern 4: List of Action Buttons

**Before:**
```jsx
<div className="flex gap-2">
  <button onClick={onEdit}>Edit</button>
  <button onClick={onDelete}>Delete</button>
</div>
```

**After:**
```jsx
<div className="flex gap-2">
  <Button
    variant="ghost"
    size="small"
    onClick={onEdit}
    icon={<EditIcon />}
  />
  <Button
    variant="ghost"
    size="small"
    onClick={onDelete}
    icon={<DeleteIcon />}
  />
</div>
```

---

### Pattern 5: Google OAuth Button

**Special case with custom icon:**
```jsx
<Button
  onClick={handleGoogleLogin}
  loading={isLoading}
  disabled={isLoading}
  fullWidth
  className="bg-white border-2 border-gray-300 text-gray-700"
  icon={!isLoading && (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      {/* Google icon paths */}
    </svg>
  )}
>
  Sign in with Google
</Button>
```

---

## Modal Migration Guide

### Step 1: Add Modal Import

```jsx
import { Modal, Button } from './ui';
```

### Step 2: Replace Modal Structure

**Before:**
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2>Title</h2>
        <button onClick={onClose}>×</button>
      </div>
      <div>Content</div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onSave}>Save</button>
      </div>
    </div>
  </div>
)}
```

**After:**
```jsx
<Modal
  isOpen={showModal}
  onClose={onClose}
  title="Title"
  footer={
    <>
      <Button variant="tertiary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={onSave}>Save</Button>
    </>
  }
>
  Content
</Modal>
```

**What Changed:**
- ✅ Backdrop handled automatically
- ✅ Escape key support automatic
- ✅ Scroll lock automatic
- ✅ Accessibility built-in
- ✅ Much cleaner code

---

### Step 3: Adjust Modal Size

```jsx
<Modal
  size="small"    // max-w-md
  size="medium"   // max-w-xl (default)
  size="large"    // max-w-3xl
  // ...
>
```

---

## Input Migration Guide (Phase 3)

**Coming Soon!** This section will be populated when Phase 3 (Input component migration) begins.

**Expected Pattern:**
```jsx
// Future Input component
<Input
  type="email"
  value={email}
  onChange={setEmail}
  label="Email"
  error={emailError}
  helperText="We'll never share your email"
/>
```

---

## Testing & Verification

### Automated Checks

**1. Count remaining buttons:**
```bash
grep -c "<button" path/to/file.jsx
```
Should return `0` when complete.

**2. Check for hardcoded colors:**
```bash
grep -n "#[0-9a-fA-F]\{6\}" path/to/file.jsx
```
Should only show non-button colors.

**3. Verify Button import:**
```bash
grep "import.*Button" path/to/file.jsx
```
Should show the import.

---

### Manual Testing Checklist

For each migrated file:

- [ ] **Visual verification:**
  - All buttons render correctly
  - Sizes are appropriate
  - Colors match design tokens
  - Spacing looks good

- [ ] **Interaction testing:**
  - All buttons respond to clicks
  - Loading states work
  - Disabled states work
  - Hover/focus states work

- [ ] **Responsive testing:**
  - Test on mobile viewport
  - Test on tablet viewport
  - Test on desktop viewport
  - Touch targets are 44px+

- [ ] **Accessibility testing:**
  - Tab through all buttons
  - Press Enter/Space to activate
  - Check aria-labels on icon-only buttons
  - Verify focus indicators visible

- [ ] **Edge cases:**
  - Test with very long text
  - Test disabled + loading together
  - Test in different contexts (modals, forms, etc.)

---

### Browser Testing

**Test in at least:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Troubleshooting

### Issue: Button doesn't look right

**Possible causes:**
1. Wrong variant chosen
2. Missing size prop
3. Conflicting className

**Solutions:**
```jsx
// Try different variant
<Button variant="secondary">  // instead of primary

// Specify size explicitly
<Button size="small">  // or medium, large

// Check for conflicting classes
<Button className="...">  // Remove conflicting classes
```

---

### Issue: Loading state not working

**Check:**
```jsx
// Both props needed
<Button
  loading={isLoading}   // ← Shows spinner
  disabled={isLoading}  // ← Disables clicks
>
```

**Common mistake:**
```jsx
// ❌ Wrong - only disabling
<Button disabled={isLoading}>

// ✅ Correct - both props
<Button loading={isLoading} disabled={isLoading}>
```

---

### Issue: Icon not showing

**Check:**
```jsx
// ✅ Correct
<Button
  icon={<svg>...</svg>}
>
  Text
</Button>

// ❌ Wrong - icon inside children
<Button>
  <svg>...</svg>
  Text
</Button>
```

---

### Issue: Button too wide/narrow

**Solutions:**
```jsx
// Full width
<Button fullWidth>

// Custom width with className
<Button className="w-48">

// Flex container
<div className="flex gap-2">
  <Button className="flex-1">Button 1</Button>
  <Button className="flex-1">Button 2</Button>
</div>
```

---

### Issue: Custom styling not applying

**Solution:** Use className for overrides
```jsx
<Button
  variant="primary"
  className="bg-purple-600 hover:bg-purple-700"  // Override
>
  Custom
</Button>
```

**Note:** className merges with variant styles. For complete override, you may need `!important` or more specific selectors.

---

### Issue: Form submission not working

**Check `type` attribute:**
```jsx
// ✅ Correct
<Button type="submit">Submit</Button>

// ❌ Wrong - missing type
<Button>Submit</Button>  // defaults to type="button"
```

---

### Issue: Buttons in loop have wrong onClick

**Check closure/binding:**
```jsx
// ❌ Wrong
{items.map(item => (
  <Button onClick={() => handleClick(item.id)}>
    {item.name}
  </Button>
))}

// ✅ Correct
{items.map(item => (
  <Button
    key={item.id}  // ← Don't forget key!
    onClick={() => handleClick(item.id)}
  >
    {item.name}
  </Button>
))}
```

---

## Quick Reference

### Variant Selection

| Action Type | Variant |
|-------------|---------|
| Main CTA | `primary` |
| Secondary action | `secondary` |
| Cancel/alternative | `tertiary` |
| Subtle/hide | `ghost` |
| Destructive | `danger` |

### Size Selection

| Context | Size |
|---------|------|
| Hero CTA | `large` |
| Most buttons | `medium` |
| Modals/cards | `small` |

### Common Props Combinations

```jsx
// Primary CTA
<Button variant="primary" size="large">

// Cancel button
<Button variant="tertiary" onClick={onClose}>

// Delete button
<Button variant="danger" onClick={onDelete}>

// Loading button
<Button loading={isLoading} disabled={isLoading}>

// Icon button
<Button variant="ghost" icon={<Icon />} aria-label="...">

// Full width submit
<Button type="submit" variant="primary" fullWidth>
```

---

## Migration Progress Tracker

Use this template to track your migration:

```markdown
## File: YourComponent.jsx

- [ ] Pre-migration review complete
- [ ] Button import added
- [ ] Button 1: Primary save → `variant="primary"`
- [ ] Button 2: Cancel → `variant="tertiary"`
- [ ] Button 3: Delete → `variant="danger"`
- [ ] All buttons tested in browser
- [ ] Responsive testing complete
- [ ] Accessibility verified
- [ ] Ready to commit

**Buttons migrated:** 3/3
**Time taken:** ~10 minutes
**Issues encountered:** None
```

---

## Best Practices

### Do's ✅

1. **Migrate one file at a time** - Easier to test and verify
2. **Test after each change** - Catch issues early
3. **Choose semantic variants** - Use primary for main actions
4. **Handle loading states** - Always use loading prop
5. **Preserve accessibility** - Keep aria-labels on icon buttons
6. **Use appropriate sizes** - Match context (modal = small, hero = large)
7. **Keep onClick handlers** - Don't change behavior unnecessarily

### Don'ts ❌

1. **Don't batch too many changes** - Hard to debug if issues arise
2. **Don't skip testing** - Visual check each button after change
3. **Don't mix patterns** - Use Button for action, not navigation
4. **Don't remove working code** - Migrate incrementally
5. **Don't forget type="submit"** - Forms need this attribute
6. **Don't skip accessibility** - Icon buttons need aria-labels
7. **Don't over-customize** - Use variants unless truly special case

---

## Success Checklist

Your migration is successful when:

- ✅ All `<button>` elements replaced with `<Button>`
- ✅ All buttons work correctly (clicks, loading, disabled)
- ✅ No visual regressions (looks the same or better)
- ✅ No hardcoded teal colors (using variants instead)
- ✅ Loading states show spinner automatically
- ✅ Accessibility maintained or improved
- ✅ Code is cleaner and more readable
- ✅ File passes all testing checks
- ✅ Ready to commit and move to next file

---

## Getting Help

### Resources

1. **DESIGN_SYSTEM.md** - Complete API reference
2. **BUTTON_QUICK_REFERENCE.md** - Common patterns
3. **UI Showcase** - Visit `/ui-showcase` for live examples
4. **Migrated Files** - Check ContactsPanel.jsx, LandingPage.jsx for examples

### Common Questions

**Q: Which variant should I use?**
A: See "Variant Selection" table above. When in doubt, use `primary` for main actions, `tertiary` for cancel.

**Q: What if I need custom styling?**
A: Use className prop to override specific styles. The variant provides the base.

**Q: Do I need both loading and disabled?**
A: Yes! `loading` shows the spinner, `disabled` prevents clicks.

**Q: What about navigation buttons?**
A: Navigation tabs/menu items are different - see NAVIGATION_ANALYSIS.md. Use Button only for actions.

---

**Good luck with your migration! 🚀**

*Refer to this guide whenever you migrate a new file. The patterns become second nature after a few files.*
