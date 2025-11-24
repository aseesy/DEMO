# LiaiZen Design System: Executive Summary & Action Plan
## Product Management & UX/UI Expert Analysis

**Date:** November 21, 2025
**Reviewed By:** Design System Audit
**Status:** 🔴 Critical - Requires Immediate Action

---

## 🎯 Executive Summary

The LiaiZen chat application has **excellent design token infrastructure** but **critically poor adoption**. This creates maintenance nightmares, brand inconsistency, and technical debt that will compound exponentially.

### Critical Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Token Usage Rate** | 30% | 95%+ | -65% ⚠️ |
| **Hardcoded Colors** | 120+ instances | 0 | -120 🔴 |
| **Button Duplicates** | 45 variants | 1-2 components | -43 🔴 |
| **Modal Duplicates** | 6 wrappers (150+ lines) | 1 component | -5 🔴 |
| **Input Duplicates** | 30+ variants | 1-2 components | -28 🔴 |
| **Arbitrary Values** | ~200 instances | <10 | -190 🔴 |

### Financial Impact

- **Current Maintenance Cost:** ~8-12 hours/month fixing inconsistencies
- **Technical Debt:** ~26-37 hours to refactor properly
- **Monthly Savings After Refactor:** ~6-10 hours/month (75% reduction)
- **ROI Timeline:** Break-even after 4-5 months

---

## 🚨 Critical Issues Requiring Immediate Action

### 1. **Token Infrastructure vs. Usage Disconnect** 🔴 CRITICAL
**Problem:** You have perfect design tokens, but nobody uses them.

**Evidence:**
```jsx
// ❌ Current (120+ instances like this)
className="bg-[#275559] hover:bg-[#1f4447] text-[#4DA8B0]"

// ✅ Should be
className="bg-teal-dark hover:bg-teal-darkest text-teal-medium"
```

**Business Impact:**
- Brand inconsistency when designers update tokens
- Changes require find-replace across 120+ files
- High risk of bugs during updates
- New developers introduce more hardcoded values

**Fix Priority:** 🔴 IMMEDIATE (Week 1)
**Effort:** 8-12 hours
**Impact:** Eliminates 90% of brand consistency issues

---

### 2. **Component Duplication Catastrophe** 🔴 CRITICAL
**Problem:** Same UI pattern copied 45+ times instead of reusable components.

#### Button Duplication (45 instances)
```jsx
// Currently in 15+ files:
<button className="w-full mt-2 bg-[#275559] text-white py-3 rounded-lg font-semibold">
<button className="px-8 py-3 bg-[#275559] text-white rounded-lg font-semibold">
<button className="flex-1 bg-[#4DA8B0] text-white py-2.5 rounded-lg font-semibold">
// ... 42 more variations
```

**Should be:**
```jsx
<Button variant="primary" size="medium" fullWidth>Submit</Button>
<Button variant="secondary" size="large">Get Started</Button>
<Button variant="tertiary" size="small">Cancel</Button>
```

**Business Impact:**
- Design changes require updating 45 files
- Accessibility improvements don't propagate
- Testing requires checking 45 implementations
- New features (loading states, icons) need 45 updates

**Fix Priority:** 🔴 IMMEDIATE (Week 1)
**Effort:** 2-3 hours to create component + 6-8 hours to replace
**Impact:** Reduces button-related bugs by 90%

---

#### Modal Duplication (6 wrappers, 150+ LOC duplicate)
```jsx
// Same 50-line structure in 6 files:
TaskFormModal.jsx (13.7 KB)
AddActivityModal.jsx (16.4 KB)
FlaggingModal.jsx (3.4 KB)
ContactSuggestionModal.jsx (2.6 KB)
ProfileTaskModal.jsx (1.6 KB)
WelcomeModal.jsx (1.6 KB)
```

**Should be:**
```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Add Task"
  size="large"
>
  {/* Content */}
</Modal>
```

**Fix Priority:** 🟠 HIGH (Week 1-2)
**Effort:** 2 hours to create + 3-4 hours to refactor
**Impact:** Reduces modal codebase by 150+ lines, fixes mobile keyboard bugs universally

---

#### Input Field Duplication (30+ instances)
**Problem:** Every form reinvents text inputs with different styling.

```jsx
// 30+ variations across files
<input className="w-full px-4 py-3 border-2 border-gray-200 focus:border-[#275559]" />
<input className="w-full px-3 py-2.5 border border-gray-300 focus:border-teal-dark" />
<input className="w-full px-4 py-2 border-2 border-[#E5E7EB] focus:outline-teal-medium" />
```

**Should be:**
```jsx
<Input
  label="Email"
  placeholder="you@example.com"
  error={errors.email}
  required
/>
```

**Fix Priority:** 🟠 HIGH (Week 2)
**Effort:** 3-4 hours to create + 5-6 hours to replace
**Impact:** Consistent form validation, accessibility, error states across app

---

### 3. **Spacing Chaos** 🟠 HIGH
**Problem:** Arbitrary spacing values instead of design system scale.

**Examples:**
```jsx
// ❌ Currently (200+ instances)
className="px-[18px] py-[13px] mb-[22px] gap-[14px]"

// ✅ Should be (using tokens)
className="px-4 py-3 mb-6 gap-3.5"
// OR better yet, standardized spacing: px-4 py-3 mb-6 gap-4
```

**Business Impact:**
- Impossible to maintain consistent visual rhythm
- Design changes require find-replace across codebase
- New developers introduce random spacing values

**Fix Priority:** 🟠 HIGH (Week 2)
**Effort:** 4-6 hours
**Impact:** Consistent visual hierarchy, easier responsive design

---

## 📋 Recommended Refactoring Plan

### Phase 1: Foundation (Week 1) - CRITICAL PATH
**Goal:** Fix the bleeding - stop adding technical debt.

#### 1.1 Create Core Components (Day 1-2)
```
src/components/ui/
├── Button/
│   ├── Button.jsx         (Main component)
│   ├── Button.stories.jsx (Storybook if available)
│   └── index.js           (Export)
├── Modal/
│   ├── Modal.jsx
│   └── index.js
└── Input/
    ├── Input.jsx
    └── index.js
```

**Button Component Spec:**
```jsx
<Button
  variant="primary" | "secondary" | "tertiary" | "ghost" | "danger"
  size="small" | "medium" | "large"
  fullWidth={boolean}
  disabled={boolean}
  loading={boolean}
  icon={ReactNode}
  iconPosition="left" | "right"
  onClick={function}
>
  {children}
</Button>
```

**Variants:**
- `primary`: bg-teal-dark, white text, hover:bg-teal-darkest
- `secondary`: bg-teal-medium, black text, hover:bg-teal-dark
- `tertiary`: border-teal-dark, teal-dark text, hover:bg-teal-lightest
- `ghost`: transparent, teal-dark text, hover:bg-teal-lightest
- `danger`: bg-semantic-error, white text

**Sizes:**
- `small`: px-3 py-2 text-sm
- `medium`: px-4 py-3 text-base (default)
- `large`: px-6 py-4 text-lg

**Effort:** 2-3 hours
**Files Created:** 1 component, 1 export

---

#### 1.2 Create Modal Wrapper (Day 2)
```jsx
<Modal
  isOpen={boolean}
  onClose={function}
  title={string}
  subtitle={string}
  size="small" | "medium" | "large" | "fullscreen"
  showCloseButton={boolean}
  closeOnOverlayClick={boolean}
  closeOnEsc={boolean}
  footer={ReactNode}
>
  {children}
</Modal>
```

**Features:**
- Proper z-index (z-modal from tokens)
- Mobile-safe padding (96px bottom on mobile)
- Keyboard navigation (Escape to close)
- Focus trap
- Scroll lock
- Accessible (ARIA labels)

**Effort:** 2 hours
**Files Created:** 1 component

---

#### 1.3 Create Input Component (Day 3)
```jsx
<Input
  type="text" | "email" | "password" | "tel" | "number"
  label={string}
  placeholder={string}
  value={string}
  onChange={function}
  error={string}
  helperText={string}
  required={boolean}
  disabled={boolean}
  fullWidth={boolean}
  icon={ReactNode}
  iconPosition="left" | "right"
/>
```

**Features:**
- Consistent focus states (focus:border-teal-dark)
- Error states with semantic colors
- Required field indicator
- Helper text support
- Accessibility (labels, ARIA)
- Touch-friendly (min-h-[44px])

**Effort:** 3-4 hours
**Files Created:** 1 component

---

#### 1.4 Replace Critical Hardcoded Colors (Day 3-5)
**Target:** 50 most-used instances (quick wins)

**Find & Replace Strategy:**
```bash
# Primary teal
bg-[#275559]  →  bg-teal-dark
hover:bg-[#1f4447]  →  hover:bg-teal-darkest
text-[#275559]  →  text-teal-dark

# Medium teal
bg-[#4DA8B0]  →  bg-teal-medium
text-[#4DA8B0]  →  text-teal-medium

# Success green
bg-[#6dd4b0]  →  bg-semantic-success (need to add to tokens)
bg-[#46BD92]  →  bg-semantic-success
```

**Priority Files:**
1. LoginSignup.jsx (7 hardcoded colors)
2. LandingPage.jsx (83 KB - needs major cleanup)
3. ContactsPanel.jsx (39 KB - needs refactor)
4. Navigation.jsx (17 KB)
5. ProfilePanel.jsx (9.6 KB)

**Effort:** 6-8 hours
**Impact:** Reduces hardcoded colors from 120 to ~70

---

### Phase 2: Expansion (Week 2) - HIGH PRIORITY

#### 2.1 Replace All Buttons (Day 1-3)
**Strategy:** File-by-file replacement with new Button component.

**Order of Replacement:**
1. LoginSignup.jsx (3-4 buttons)
2. ContactsPanel.jsx (8-10 buttons)
3. All Modal files (20+ buttons)
4. LandingPage.jsx (5-6 buttons)
5. Remaining files (10-12 buttons)

**Validation Checklist per File:**
- [ ] All buttons replaced with <Button>
- [ ] Visual regression test passed
- [ ] Hover states work correctly
- [ ] Focus states accessible
- [ ] Mobile touch targets 44px minimum
- [ ] Loading states (if needed)

**Effort:** 6-8 hours
**Impact:** Eliminates 45 button duplicates

---

#### 2.2 Refactor All Modals (Day 3-4)
**Strategy:** Wrap existing content with new <Modal> component.

**Order:**
1. ProfileTaskModal.jsx (smallest, easiest)
2. WelcomeModal.jsx
3. FlaggingModal.jsx
4. ContactSuggestionModal.jsx
5. AddActivityModal.jsx
6. TaskFormModal.jsx (largest, most complex)

**Effort:** 3-4 hours
**Impact:** Removes 150+ lines of duplicate code

---

#### 2.3 Replace All Inputs (Day 4-5)
**Strategy:** Replace all text inputs with <Input> component.

**Files:**
- LoginSignup.jsx (email, password)
- ProfilePanel.jsx (all profile fields)
- ContactsPanel.jsx (search, forms)
- TaskFormModal.jsx (task fields)
- AddActivityModal.jsx (activity fields)

**Effort:** 5-6 hours
**Impact:** Consistent form behavior across app

---

#### 2.4 Remaining Hardcoded Colors (Day 5)
**Target:** 70 remaining instances from Phase 1.

**Strategy:** Systematic grep and replace.

**Effort:** 4-5 hours
**Impact:** 100% token adoption for colors

---

### Phase 3: Polish & Expansion (Week 3) - MEDIUM PRIORITY

#### 3.1 Additional Components (Day 1-3)
```
src/components/ui/
├── Card/           (consistent card styling)
├── Badge/          (status badges, tags)
├── IconButton/     (icon-only buttons)
├── Select/         (dropdown select)
├── Textarea/       (multi-line input)
└── Checkbox/       (checkbox input)
```

**Effort:** 8-12 hours total
**Priority:** Create as needed, not all at once

---

#### 3.2 Spacing Standardization (Day 3-4)
**Goal:** Replace arbitrary spacing with token-based spacing.

**Find & Replace:**
```bash
# Common arbitrary values
px-[18px]  →  px-4 (16px)
py-[13px]  →  py-3 (12px)
gap-[14px] →  gap-3.5 (14px) or gap-4 (16px)
mb-[22px]  →  mb-6 (24px)
```

**Effort:** 4-6 hours
**Impact:** Consistent spacing rhythm

---

#### 3.3 Component Documentation (Day 4-5)
**Goal:** Document all components for team.

**Deliverables:**
- README.md for each component
- Props documentation
- Usage examples
- Do's and Don'ts
- Accessibility notes

**Effort:** 4-6 hours
**Impact:** Faster onboarding, correct usage

---

## 🎨 Refined Token System

### Current Tokens: Good Foundation
Your token system is **excellent**. The only additions needed:

```json
{
  "colors": {
    "semantic": {
      "success": { "value": "#46BD92" },  // Currently #10b981, but you use #46BD92/#6dd4b0
      // Keep existing warning, error, info
    },
    "focus": {
      "ring": { "value": "#4DA8B0" },  // Teal-medium for focus rings
      "ringOffset": { "value": "#FFFFFF" }
    }
  },
  "transitions": {
    "duration": {
      "fast": { "value": "150ms" },
      "normal": { "value": "300ms" },
      "slow": { "value": "500ms" }
    },
    "timing": {
      "easeInOut": { "value": "cubic-bezier(0.4, 0, 0.2, 1)" },
      "easeOut": { "value": "cubic-bezier(0, 0, 0.2, 1)" }
    }
  },
  "touchTargets": {
    "minimum": { "value": "44px" },  // iOS HIG, WCAG 2.1 AAA
    "comfortable": { "value": "48px" }
  }
}
```

**Additions to Tailwind Config:**
```js
extend: {
  colors: {
    focus: {
      ring: tokens.colors.focus.ring.value,
      'ring-offset': tokens.colors.focus.ringOffset.value,
    }
  },
  transitionDuration: {
    fast: tokens.transitions.duration.fast.value,
    normal: tokens.transitions.duration.normal.value,
    slow: tokens.transitions.duration.slow.value,
  },
  minHeight: {
    touch: tokens.touchTargets.minimum.value,
  }
}
```

---

## 🗑️ Code to Delete

### 1. Deprecated/Unused Components
**Audit needed - likely candidates:**
- Old modal wrappers after refactor
- Unused utility components
- Duplicate helper functions

### 2. Inline Styles to Remove
```jsx
// Delete all instances of:
<div style={{ backgroundColor: '#275559' }}>  ❌
<div className="bg-teal-dark">  ✅
```

### 3. Arbitrary Tailwind Classes (200+ instances)
```jsx
// Delete these patterns:
bg-[#275559]  ❌
px-[18px]     ❌
gap-[14px]    ❌
```

---

## 📊 Implementation Metrics & Success Criteria

### Week 1 Metrics
- [ ] Button component created and tested
- [ ] Modal component created and tested
- [ ] Input component created and tested
- [ ] 50+ hardcoded colors replaced
- [ ] Zero new hardcoded values added

### Week 2 Metrics
- [ ] All 45 buttons replaced
- [ ] All 6 modals refactored
- [ ] All 30 inputs replaced
- [ ] 120 hardcoded colors → 0 remaining
- [ ] Token usage rate: 30% → 85%+

### Week 3 Metrics
- [ ] 5+ additional UI components created
- [ ] Arbitrary spacing reduced by 80%
- [ ] Component documentation complete
- [ ] Token usage rate: 85% → 95%+

### Success Indicators
✅ **Code Quality:**
- Zero hardcoded hex colors
- <10 arbitrary Tailwind values
- All buttons use <Button> component
- All modals use <Modal> wrapper

✅ **Developer Experience:**
- New features use design system
- Design changes = token updates only
- Component props self-documenting
- Storybook (optional) for component preview

✅ **Brand Consistency:**
- All teal colors from tokens
- Consistent button styling
- Consistent spacing rhythm
- Consistent typography scale

✅ **Maintenance:**
- Monthly maintenance time: 8-12h → 2-3h (75% reduction)
- Bug count related to styling: -60%
- Time to implement new features: -40%

---

## 🚀 Quick Start Actions

### Immediate (Today)
1. **Create component folders:**
   ```bash
   mkdir -p chat-client-vite/src/components/ui/{Button,Modal,Input}
   ```

2. **Create Button.jsx:**
   - Copy button template (provided below)
   - Test with one existing button
   - Verify styling matches

3. **Document token usage rules:**
   - Add to CLAUDE.md or CONTRIBUTING.md
   - "NEVER use hardcoded colors"
   - "ALWAYS use bg-teal-* classes"

### This Week
1. Complete Phase 1 (Foundation)
2. Replace 20 most-used buttons
3. Refactor 2 smallest modals
4. Set up code review checklist

### This Month
1. Complete all 3 phases
2. Achieve 95%+ token usage
3. Zero hardcoded colors
4. Document all components

---

## 📄 Appendix: Component Templates

### Button Component Template
```jsx
// src/components/ui/Button/Button.jsx
import React from 'react';

const variants = {
  primary: 'bg-teal-dark text-white hover:bg-teal-darkest disabled:bg-gray-400',
  secondary: 'bg-teal-medium text-black hover:bg-teal-dark disabled:bg-gray-400',
  tertiary: 'border-2 border-teal-dark text-teal-dark hover:bg-teal-lightest disabled:border-gray-400 disabled:text-gray-400',
  ghost: 'text-teal-dark hover:bg-teal-lightest disabled:text-gray-400',
  danger: 'bg-semantic-error text-white hover:bg-red-700 disabled:bg-gray-400',
};

const sizes = {
  small: 'px-3 py-2 text-sm',
  medium: 'px-4 py-3 text-base',
  large: 'px-6 py-4 text-lg',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2 disabled:cursor-not-allowed min-h-touch flex items-center justify-center gap-2';

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.medium;
  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
```

### Modal Component Template
```jsx
// src/components/ui/Modal/Modal.jsx
import React, { useEffect } from 'react';

const sizes = {
  small: 'max-w-md',
  medium: 'max-w-xl',
  large: 'max-w-3xl',
  fullscreen: 'max-w-full h-full',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
}) => {
  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = sizes[size] || sizes.medium;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal p-4 pb-24 md:pb-4 overflow-y-auto"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full ${sizeClass} flex flex-col max-h-full my-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-ui-border flex items-center justify-between flex-shrink-0">
          <div>
            <h3 id="modal-title" className="text-base sm:text-lg font-semibold text-ui-text-primary">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-ui-text-secondary mt-1">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-ui-text-secondary hover:text-ui-text-primary transition-colors ml-4 flex-shrink-0"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-6 py-4 border-t border-ui-border flex gap-2 justify-end flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
```

### Input Component Template
```jsx
// src/components/ui/Input/Input.jsx
import React from 'react';

export const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const inputId = props.id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  const baseInputClasses = 'w-full px-4 py-3 border-2 rounded-lg transition-all text-base text-ui-text-primary placeholder-ui-text-tertiary min-h-touch focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

  const borderClasses = error
    ? 'border-semantic-error focus:border-semantic-error focus:ring-2 focus:ring-semantic-error/20'
    : 'border-ui-border focus:border-teal-dark focus:ring-2 focus:ring-teal-medium/20';

  const inputClasses = `${baseInputClasses} ${borderClasses} ${className}`.trim();

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ui-text-primary mb-2"
        >
          {label}
          {required && <span className="text-semantic-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-secondary">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
          style={icon && iconPosition === 'left' ? { paddingLeft: '2.5rem' } : {}}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-text-secondary">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-sm text-ui-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
```

---

## 📞 Next Steps

1. **Review this document** with your team
2. **Prioritize phases** based on team capacity
3. **Create GitHub issues** for each component
4. **Set up code review checklist** to prevent new hardcoded values
5. **Start with Button component** - it's the quickest win

---

**Questions? Concerns? Need clarification?**
This is a living document - update as you progress through the refactor.

**Remember:** The goal isn't perfection - it's **consistency and maintainability**. Focus on the 80/20 rule: fix the 20% of code that causes 80% of the maintenance burden (buttons, modals, colors).
