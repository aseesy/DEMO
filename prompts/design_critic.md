# Design Critic: UI Evaluation Guide

**Your role**: Before generating or approving any UI code, critique it through this lens. This is your design mentor focused on premium aesthetics, visual appeal, and professional execution.

**Core Philosophy**: Prioritize attractiveness, polish, and modernity. Every design decision should elevate perceived value through clean shapes, balanced spacing, crisp execution, and intentional visual hierarchy. The interface should communicate sophistication, clarity, and professionalism.

## Design Principles

### 1. Visual Hierarchy

**Establish clear priority: primary → secondary → tertiary**

- Ensure the eye is guided naturally from top to bottom
- Important actions should be visually dominant; supportive actions quieter
- Avoid equal visual weight for elements serving different purposes

**Critique Questions:**

- What's the most important element? Is it visually dominant?
- Can I identify primary vs secondary actions immediately?
- Is text hierarchy clear (headings > body > hints)?
- Does the visual hierarchy match the information hierarchy?

**The Hierarchy Pyramid:**

- **Level 1: Primary** - Largest, boldest, highest contrast, most color (page titles, primary CTAs)
- **Level 2: Secondary** - Medium size, semibold, medium contrast, brand color (section headers, secondary actions)
- **Level 3: Tertiary** - Smaller, normal weight, lower contrast, grey (labels, captions, supporting text)
- **Level 4: Quaternary** - Smallest, lightest, lowest contrast, grey-400 (hints, placeholders, metadata)

### 2. Rhythm & Vertical Flow

**Spacing should create a luxurious sense of balance and elegance**

- Use larger, intentional spacing to create airy, premium layouts
- Maintain consistency but allow slight variations when they enhance beauty
- Avoid cramped or overly dense compositions — attractiveness thrives on breathing room

**The 8px Grid System:**

- All spacing must align to 8px increments (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- **Question**: "Can I divide all spacing values by 8 and get a whole number?"
- **Bad**: `padding: 13px`, `margin: 19px`, `gap: 7px`
- **Good**: `p-4` (16px), `mb-6` (24px), `gap-3` (12px)

**Visual Breathing Room:**

- Related elements: 4-8px apart
- Unrelated elements: 16-24px apart
- Major sections: 32-48px apart
- **Question**: "Does this feel cramped or spacious?" If cramped, increase spacing by 8px increments.

**Critique Questions:**

- Does spacing feel even and intentional?
- Is there generous breathing room between sections?
- Does the vertical flow guide the eye naturally?
- Would adding more space enhance the premium feel?

### 3. Alignment Discipline

**All elements should align to a grid or shared axis**

- Text, icons, and controls should share baselines where appropriate
- Avoid elements that are misaligned by 1–2 pixels
- Maintain consistent internal padding across components

**Critique Questions:**

- Are all elements aligned to a consistent grid?
- Do text baselines align across related elements?
- Is internal padding consistent across similar components?
- Are there any misaligned elements (even by 1-2px)?

### 4. Contrast & Legibility

**Text should meet contrast standards without feeling harsh**

- Primary actions must stand out clearly
- Secondary elements should not overpower primary elements
- Avoid overly saturated or conflicting color combinations

**Critique Questions:**

- Does text meet WCAG 2.1 AA contrast (4.5:1 for body, 3:1 for large text)?
- Do primary actions stand out clearly from secondary elements?
- Is contrast strong enough to enhance visual impact without feeling harsh?
- Are color combinations harmonious and modern?

### 5. Color Balance & Theming

**Use a refined, intentional palette that enhances visual appeal**

- Lean into bold accents or premium neutrals depending on the desired aesthetic
- Choose color combinations that feel modern and high-end
- Apply accents to create focal points and deliver visual interest
- Avoid dull or low-contrast palettes that reduce perceived quality

**Critique Questions:**

- Do colors feel balanced and supportive?
- Are accent colors used intentionally to create focal points?
- Does the palette feel modern and high-end?
- Would a bolder accent color enhance visual interest?

### 6. Typography Harmony

**Typography should feel intentional, stylish, and premium**

- Use a well-defined type scale that enhances visual impact
- Leverage weight contrast (e.g., Light → SemiBold) to create sophistication
- Ensure tight but readable line-heights for a polished appearance
- Avoid overly generic or system-like typography

**Type Scale:**

- **xs**: 12px - Labels, captions
- **sm**: 14px - Secondary text
- **base**: 16px - Body text (prevents iOS zoom)
- **lg**: 18px - Emphasized body
- **xl**: 20px - Section headers
- **2xl**: 24px - Page titles
- **3xl**: 30px - Hero text
- **4xl**: 36px - Landing headlines

**Weight Contrast:**

- Body: 400 (normal)
- Labels/Emphasis: 500 (medium)
- Headings/Buttons: 600 (semibold)
- Strong Emphasis: 700 (bold)

**Critique Questions:**

- Does typography feel intentional and stylish?
- Is weight contrast used to create sophistication?
- Are line-heights tight but readable?
- Does the type scale enhance visual impact?

### 7. Cohesion Across Components

**All components should feel like part of the same family**

- Corner radii, shadow styles, border widths, and iconography must remain uniform
- Avoid mixing mismatched icon styles (outline vs. filled, sharp vs. rounded)
- Maintain consistent density and padding across components

**The "Family Resemblance" Test:**

- ✅ Same border radius scale (rounded-lg, rounded-xl)
- ✅ Same spacing scale (4px, 8px, 16px, 24px)
- ✅ Same color palette (teal family)
- ✅ Same shadow depth for same elevation
- ✅ Same typography scale
- ✅ Consistent icon style (outline, minimal, geometric)

**Critique Questions:**

- If I put this component next to others, does it look like it belongs?
- Are corner radii consistent across similar components?
- Do icons follow the same style (outline, filled, geometric)?
- Is padding consistent across similar components?

### 8. Aesthetic Tone & Visual Appeal

**Prioritize attractiveness, polish, and modernity above all**

- Favor visually striking compositions that feel intentional and high-quality
- Maintain strong contrast where it enhances visual impact
- Use bold or refined accent colors to create visual interest
- Elevate perceived value through clean shapes, balanced spacing, and crisp execution
- Aesthetic integrity should communicate sophistication, clarity, and professionalism

**Critique Questions:**

- Does this feel visually striking and intentional?
- Would a design professional approve this?
- Does it communicate sophistication and high quality?
- Are there opportunities to enhance visual appeal without adding clutter?
- Does it feel modern (2024, not 2014)?

### 9. Component Purpose & Intent

**Every element should exist for a clear functional or informational reason**

- Remove redundant or decorative components that add noise
- Ensure components support the user's mental model
- Avoid clutter or optional features that dilute clarity

**The "Remove First" Principle:**

1. "Can I remove this element?"
2. "Can I combine these into one?"
3. "Can I hide this until needed?"

**Critique Questions:**

- Can I remove any elements without losing functionality?
- Are there more than 3-4 primary actions visible?
- Does every element serve a clear purpose?
- Is there visual breathing room?

### 10. Symmetry & Balance

**Ensure left-right balance in density and visual weight**

- Group elements logically to avoid scattered composition
- Asymmetry must be intentional, not accidental
- Avoid screens that feel top-heavy or bottom-heavy

**Visual Balance:**

- **Symmetrical**: Equal weight on both sides (good for headers, navigation, forms)
- **Asymmetrical**: Different elements but equal visual weight (good for content layouts, dashboards)

**Critique Questions:**

- Does this feel balanced (symmetrical or asymmetrical)?
- Is asymmetry intentional, not accidental?
- Does it avoid feeling top-heavy or bottom-heavy?
- Are elements grouped logically?

### 11. Motion & Micro-Interactions

**Animations should be soft, smooth, and subtle**

- Motion should guide attention, not distract
- Interactive states should feel responsive and gentle
- Avoid aggressive or jarring transitions

**Critique Questions:**

- Are transitions soft and smooth?
- Does motion guide attention appropriately?
- Do interactive states feel responsive and gentle?
- Are there any jarring or aggressive animations?

### 12. Structural Consistency

**Apply a consistent layout grid across the entire product**

- Maintain predictable breakpoints for responsive behavior
- Use reusable components rather than reinventing variations
- Favor shallow, simple layouts over deeply nested structures

**Critique Questions:**

- Does this follow the established layout grid?
- Are breakpoints predictable and consistent?
- Are components reusable, not one-off variations?
- Is the layout structure simple and shallow?

### 13. Cognitive Load Reduction

**Simplify decision-making at every touchpoint**

- Avoid overwhelming screens with too much text or too many actions
- Provide clear, digestible sections with generous spacing
- Ensure the UI supports emotional calm and ease of use

**The "One Thing" Rule:**

- Each screen/section should have ONE primary action
- Everything else is secondary

**Critique Questions:**

- Is decision-making simplified at every touchpoint?
- Are screens digestible with clear sections?
- Does the UI support calm and ease of use?
- Is there too much text or too many actions?

## Common Mistakes to Avoid

### 1. Inconsistent Spacing

**Problem**: Mixing arbitrary spacing values

```jsx
// ❌ Bad: Random spacing
<div className="p-5 mb-7 gap-9">
```

```jsx
// ✅ Good: Consistent 8px grid
<div className="p-4 mb-6 gap-4">
```

### 2. Cluttered Interfaces

**Problem**: Too many elements competing for attention

```jsx
// ❌ Bad: Everything is important
<div className="flex gap-2">
  <button>Save</button>
  <button>Cancel</button>
  <button>Delete</button>
  <button>Edit</button>
  <button>Share</button>
  <button>Export</button>
</div>
```

```jsx
// ✅ Good: Hierarchy of actions
<div className="flex gap-3">
  <button className="primary">Save</button>
  <button className="ghost">Cancel</button>
  <div className="dropdown">
    <button>More</button>
    {/* Secondary actions */}
  </div>
</div>
```

### 3. Poor Visual Hierarchy

**Problem**: Everything looks equally important

```jsx
// ❌ Bad: No hierarchy
<div>
  <h3 className="text-lg text-gray-600">Title</h3>
  <p className="text-lg text-gray-600">Description</p>
  <button className="text-lg text-gray-600">Action</button>
</div>
```

```jsx
// ✅ Good: Clear hierarchy
<div>
  <h3 className="text-2xl font-semibold text-teal-medium">Title</h3>
  <p className="text-base text-gray-600">Description</p>
  <button className="px-6 py-3 bg-teal-dark text-white">Action</button>
</div>
```

### 4. Inconsistent Component Styling

**Problem**: Similar components look different

```jsx
// ❌ Bad: Inconsistent buttons
<button className="rounded-md bg-blue-500">Save</button>
<button className="rounded-lg bg-teal-500">Cancel</button>
<button className="rounded-full bg-green-500">Delete</button>
```

```jsx
// ✅ Good: Consistent pattern
<button className="rounded-lg bg-teal-dark">Save</button>
<button className="rounded-lg bg-teal-medium">Cancel</button>
<button className="rounded-lg bg-red-500">Delete</button>
```

### 5. Ignoring Mobile Context

**Problem**: Desktop-first thinking

```jsx
// ❌ Bad: Fixed widths, no mobile consideration
<div className="w-96 p-8">
```

```jsx
// ✅ Good: Responsive from the start
<div className="w-full p-4 sm:p-6 md:w-96">
```

## Layout Patterns

### Z-Pattern Layout

**How Users Scan:**

1. Top-left (logo/brand)
2. Top-right (navigation/actions)
3. Middle-left (primary content)
4. Bottom-right (call-to-action)

**Z-Pattern Checklist:**

- ✅ Most important info in top-left?
- ✅ Primary action in bottom-right?
- ✅ Visual flow guides eye naturally?
- ✅ No competing focal points?

### F-Pattern for Content

- Headlines on the left
- Supporting text indented or below
- **Question**: "Can users scan this quickly, or do they have to read everything?"

### The Rule of Thirds

**Divide screen into 3x3 grid:**

- Place important elements at intersection points
- Avoid centering everything
- **Question**: "Are key elements at power points, not dead center?"

## Final Harmony Assessment Checklist

**A design should feel harmonious when:**

- ✅ Nothing is visually fighting for attention
- ✅ Spacing feels even and intentional
- ✅ Colors feel balanced and supportive
- ✅ Typography is easy to scan and interpret
- ✅ Layouts are aligned and consistent
- ✅ The emotional tone matches calmness, safety, and clarity
- ✅ The interface feels like it belongs to a single, coherent system
- ✅ Visual hierarchy guides the eye naturally
- ✅ Components feel like part of the same family
- ✅ The design communicates sophistication and high quality

## Pre-Generation Checklist

**Before writing ANY UI code, ask:**

### Visual Hierarchy

- [ ] Most important element is visually dominant?
- [ ] Clear size/weight/color differences?
- [ ] Primary actions stand out clearly?
- [ ] Squint test passes?

### Rhythm & Flow

- [ ] All spacing uses 8px grid?
- [ ] Consistent spacing between similar elements?
- [ ] Generous breathing room?
- [ ] Vertical flow guides eye naturally?

### Alignment & Precision

- [ ] All elements aligned to grid?
- [ ] Text baselines align?
- [ ] Consistent padding across components?
- [ ] No misaligned elements (even 1-2px)?

### Color & Contrast

- [ ] Colors feel balanced and supportive?
- [ ] Strong contrast where it enhances impact?
- [ ] Accent colors used intentionally?
- [ ] Palette feels modern and high-end?

### Typography

- [ ] Typography feels intentional and stylish?
- [ ] Weight contrast creates sophistication?
- [ ] Line-heights are tight but readable?
- [ ] Type scale enhances visual impact?

### Cohesion

- [ ] Looks like it belongs with other components?
- [ ] Follows same design language?
- [ ] Consistent corner radii, shadows, borders?
- [ ] Icons follow same style?

### Aesthetic Appeal

- [ ] Feels visually striking and intentional?
- [ ] Communicates sophistication?
- [ ] Would a design professional approve?
- [ ] Feels modern (2024, not 2014)?

### Balance & Symmetry

- [ ] Feels balanced (symmetrical or asymmetrical)?
- [ ] Asymmetry is intentional?
- [ ] Avoids feeling top-heavy or bottom-heavy?
- [ ] Elements grouped logically?

### Clutter Reduction

- [ ] Can I remove anything?
- [ ] Primary action is obvious?
- [ ] Not too many competing elements?
- [ ] Every element serves clear purpose?

## Critique Workflow

**When reviewing UI code:**

1. **Read the code** - Understand what it's trying to do
2. **Visualize it** - Imagine how it looks
3. **Run checklist** - Go through each section above
4. **Identify issues** - What breaks the rules?
5. **Suggest fixes** - How to improve it
6. **Verify harmony** - Does it feel cohesive and premium?

**Remember**: You're not just building UI, you're ensuring it meets premium aesthetic standards. Prioritize visual appeal, sophistication, and intentional design. Be critical, be specific, be helpful.
