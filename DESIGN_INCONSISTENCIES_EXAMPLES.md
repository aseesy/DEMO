# Design System Inconsistencies - Visual Examples

## Color Usage Inconsistencies

### Primary Button Styling - Same Intent, Different Implementation

**Example 1: LoginSignup.jsx (Line 119)**
```jsx
className="w-full mt-2 bg-[#275559] text-white py-3 rounded-lg 
           font-semibold text-base shadow-sm hover:bg-[#1f4447] 
           transition-colors disabled:bg-gray-400"
```
Properties: Dark teal, full width, py-3, text-base

**Example 2: LandingPage.jsx (Line ~450)**
```jsx
className="px-8 sm:px-10 py-3 sm:py-4 bg-[#275559] text-white 
           rounded-lg font-semibold text-base sm:text-lg 
           hover:bg-[#1f4447] transition-colors shadow-sm"
```
Properties: Dark teal, responsive padding/text, py-3/py-4, shadow-sm

**Example 3: ContactsPanel.jsx (Line ~520)**
```jsx
className="flex-1 bg-[#4DA8B0] text-white py-2.5 sm:py-2 rounded-lg 
           font-semibold text-sm hover:bg-[#1f4447] 
           disabled:bg-gray-400 transition-colors"
```
Properties: MEDIUM teal (not dark!), py-2.5, text-sm, no shadow

**Issues:**
- Inconsistent color choice (#275559 vs #4DA8B0)
- Inconsistent padding (py-3 vs py-2.5)
- Inconsistent text size (text-base vs text-sm)
- Inconsistent shadow (some have, some don't)
- All hardcoded - should be `bg-teal-dark` or `bg-teal-medium`

---

## Modal Structure Duplication

### All 6 Modals Share This Pattern (~50 lines each)

**Pattern Template:**
```jsx
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 pb-24 md:pb-4 overflow-y-auto">
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-full my-auto">
    {/* Header - Always visible */}
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
      <h3 className="text-base sm:text-lg font-semibold">
        {title}
      </h3>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        ×
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      {children}
    </div>

    {/* Footer */}
    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
      {/* Buttons */}
    </div>
  </div>
</div>
```

**Files Using This Pattern:**
1. TaskFormModal.jsx - 13,728 bytes
2. AddActivityModal.jsx - 16,416 bytes
3. FlaggingModal.jsx - 3,402 bytes
4. ContactSuggestionModal.jsx - 2,621 bytes
5. ProfileTaskModal.jsx - 1,565 bytes
6. WelcomeModal.jsx - 1,595 bytes

**Opportunity:** Extract to single `<Modal>` component

---

## Form Input Inconsistencies

### Text Input Styling - Same Purpose, Different Approaches

**Input A: LoginSignup.jsx (Line 92-98)**
```jsx
<input
  type="email"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
             focus:outline-none focus:border-[#275559] transition-all 
             text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
  placeholder="you@example.com"
/>
```
Properties: px-4 py-3, border-gray-200 → border-[#275559] on focus, min-h-[44px]

**Input B: ProfilePanel.jsx (Line 64-75)**
```jsx
<input
  type="text"
  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 
             rounded-lg focus:outline-none focus:border-[#4DA8B0] 
             transition-all text-gray-900 text-sm min-h-[44px]"
  placeholder="First name"
/>
```
Properties: px-3 py-2.5, border-gray-200 → border-[#4DA8B0] on focus, min-h-[44px]

**Input C: ContactsPanel.jsx (Line ~200)**
```jsx
<input
  type="text"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
             focus:outline-none focus:border-[#4DA8B0] transition-all 
             text-gray-900 text-base placeholder-gray-400 min-h-[44px]"
/>
```
Properties: px-4 py-3, border-gray-200 → border-[#4DA8B0] on focus, min-h-[44px]

**Issues:**
- Different padding (px-4 py-3 vs px-3 py-2.5)
- Different focus colors (#275559 vs #4DA8B0)
- Responsive modifier in one but not others (sm:py-2)
- Text size inconsistent (text-base vs text-sm)
- All hardcoded - should use `<Input>` component

---

## Spacing Scale Misuse

### Gap Usage - No Clear Pattern

**Example 1: Tight spacing**
```jsx
<div className="flex gap-2">        {/* 8px - from token sm */}
  {/* items */}
</div>
```

**Example 2: Medium spacing**
```jsx
<div className="flex gap-3">        {/* 12px - NOT in token system! */}
  {/* items */}
</div>
```

**Example 3: Large spacing**
```jsx
<div className="flex gap-4">        {/* 16px - from token md */}
  {/* items */}
</div>
```

**Example 4: Extra large spacing**
```jsx
<div className="flex gap-6">        {/* 24px - from token lg */}
  {/* items */}
</div>
```

**Token System defines:**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

**Problem:** `gap-3` (12px) is used but not defined in tokens. Developers are inventing spacing values.

---

## Hardcoded Color Hotspots

### Top 5 Most Repeated Hardcoded Colors

**1. #4DA8B0 (Teal Medium) - 45+ instances**
```
Files: LandingPage.jsx, LoginSignup.jsx, ProfilePanel.jsx, 
        ContactsPanel.jsx, ActivityCard.jsx, modals/*.jsx, Toast.jsx
Should be: bg-teal-medium, text-teal-medium
```

**2. #275559 (Teal Dark) - 18+ instances**
```
Files: LoginSignup.jsx, LandingPage.jsx, modals/*.jsx, Navigation.jsx
Should be: bg-teal-dark, text-teal-dark
```

**3. #1f4447 (Teal Darkest) - 12+ instances**
```
Files: LoginSignup.jsx, LandingPage.jsx, modals/*.jsx, ContactsPanel.jsx
Should be: hover:bg-teal-darkest
```

**4. #E6F7F5 (Teal Lightest) - 8+ instances**
```
Files: LandingPage.jsx, ProfilePanel.jsx, Toast.jsx
Should be: bg-teal-lightest
```

**5. #C5E8E4 (Teal Light) - 5+ instances**
```
Files: LandingPage.jsx, ActivityCard.jsx
Should be: border-teal-light, bg-teal-light
```

---

## Brand Color Inconsistency

### Additional Undocumented Colors

These colors are used but not in the design token system:

**#6dd4b0** (Appears to be Teal variant)
- Used in: LandingPage.jsx (3 instances)
- Context: Icon backgrounds in feature cards
- Should be: Either in token system or mapped to existing color

**#3d8a92** (Appears to be Teal hover)
- Used in: ProfilePanel.jsx, modals/TaskFormModal.jsx
- Context: Hover states, button gradients
- Should be: Equivalent to `teal-darkest` but darker
- Note: Already have `teal-darkest` (#1f4447) - redundant?

**#D4F0EC** (Light teal variant)
- Used in: ActivityCard.jsx (1 instance)
- Context: Cost badge background
- Should be: `bg-teal-light` or new semantic token

**#A8D9D3** (Another teal shade)
- Used in: LandingPage.jsx (1 instance)
- Context: Border color
- Should be: Between `teal-light` and `teal-medium`

---

## Component Duplication Details

### Button Pattern Duplication Matrix

| File | Primary | Secondary | Danger | Icon | Total |
|------|---------|-----------|--------|------|-------|
| LoginSignup.jsx | 2 | 1 | 0 | 0 | 3 |
| LandingPage.jsx | 10 | 2 | 0 | 0 | 12 |
| ContactsPanel.jsx | 4 | 1 | 1 | 3 | 9 |
| ProfilePanel.jsx | 2 | 0 | 0 | 1 | 3 |
| TaskFormModal.jsx | 2 | 1 | 0 | 1 | 4 |
| AddActivityModal.jsx | 2 | 1 | 0 | 0 | 3 |
| Navigation.jsx | 0 | 0 | 1 | 5 | 6 |
| Others | 2 | 1 | 0 | 2 | 5 |
| **TOTAL** | **24** | **7** | **2** | **12** | **45** |

**Result:** 45 button elements that should be 3-5 reusable components

---

## Spacing Inconsistency Examples

### Same Container Type, Different Spacing

**Card A: ProfilePanel.jsx (Personal Info section)**
```jsx
<div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 
               border-2 border-gray-200 shadow-sm">
  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
```
Properties: p-3 sm:p-4 md:p-6, gap-2 sm:gap-3, mb-3 sm:mb-4

**Card B: ContactsPanel.jsx (Contact form section)**
```jsx
<div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-gray-200">
  <div className="space-y-4">
```
Properties: p-3 sm:p-4, space-y-4 (not responsive!)

**Card C: ActivityCard.jsx**
```jsx
<div className="bg-white rounded-lg border-2 border-[#C5E8E4] 
               p-3 sm:p-4 hover:border-[#4DA8B0] transition-all">
  <div className="flex items-start justify-between gap-2 mb-2">
```
Properties: p-3 sm:p-4, gap-2, mb-2 (very tight!)

**Issues:**
- Inconsistent responsive design (some have md:, some don't)
- Different spacing for similar components
- Different gap/space-y usage patterns
- No clear "spacing system"

---

## Token Definition vs Reality

### What Should Be vs What Is

**Example 1: Shadow**
```
Token defines: shadow-sm, shadow-md, shadow-lg, shadow-xl
Reality: Uses shadow-2xl (not in tokens), hardcoded box-shadow values
Example: box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15)
```

**Example 2: Z-Index**
```
Token defines: z-50 (nav), z-100 (modal)
Reality: Uses z-[100], hardcoded style={{ zIndex: ... }}
Example: className="z-[100]" (redundant - token exists!)
```

**Example 3: Border Radius**
```
Token defines: sm (6px), md (8px), lg (12px), xl (16px), 2xl (24px), full
Reality: Uses rounded-lg, rounded-xl, rounded-2xl, rounded-full
Analysis: Actually uses tokens correctly here! ✓
```

**Example 4: Spacing**
```
Token defines: xs (4px), sm (8px), md (16px), lg (24px), xl (32px)
Reality: Uses p-2, p-3, p-4, p-5, p-6, p-8 + gap-1,2,3,4,5,6
Analysis: Extends beyond tokens, especially gap-3 (12px) which isn't defined
```

---

## Recommendations by Priority

### CRITICAL (Fix First)

1. **Stop using hardcoded colors immediately**
   - Audit all `bg-[#...]` and `text-[#...]` instances
   - Replace with token classes (bg-teal-dark, text-teal-medium)
   - Estimated instances: 120+

2. **Extract Button component**
   - Create: `components/ui/Button.jsx`
   - Consolidate: 45+ button instances
   - Time estimate: 2-3 hours
   - Impact: Massive consistency improvement

3. **Extract Modal wrapper**
   - Create: `components/ui/Modal.jsx`
   - Consolidate: 6 modal duplicates
   - Time estimate: 2 hours
   - Impact: Eliminates 150+ lines of duplication

### HIGH PRIORITY

4. **Extract Form Input component**
   - Create: `components/ui/Input.jsx`
   - Consolidate: 30+ input instances
   - Time estimate: 3-4 hours

5. **Document and standardize spacing**
   - Define clear spacing scale for gaps, padding, margins
   - Update Tailwind config if needed
   - Create spacing guidelines
   - Time estimate: 2 hours

6. **Add undocumented colors to token system**
   - Document #6dd4b0, #3d8a92, #D4F0EC, etc.
   - Or map to existing tokens
   - Update colors.json
   - Time estimate: 1 hour

### MEDIUM PRIORITY

7. **Extract Card component**
   - Create: `components/ui/Card.jsx`
   - Consolidate: 15+ card patterns
   - Time estimate: 2 hours

8. **Standardize heading hierarchy**
   - No semantic h1, h2, h3 usage found
   - Create typography component or guidelines
   - Time estimate: 2 hours

9. **Remove unused CSS**
   - Delete App.css (legacy Vite template)
   - Clean up unused styles in index.css
   - Time estimate: 30 minutes

---

End of Examples Document
