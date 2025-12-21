# LiaiZen Design System

## UI Style Philosophy

**Clean & Modern for LiaiZen means:**

- **Purposeful minimalism**: Every element serves a function. No decorative clutter. White space is intentional, not empty.
- **Calming confidence**: The teal palette creates a sense of stability and trust—essential for co-parenting communication.
- **Mobile-first clarity**: Touch targets are generous (44px minimum). Text is readable without zooming. Interactions feel immediate and responsive.
- **Accessible by default**: Color contrast meets WCAG 2.1 AA. Keyboard navigation is smooth. Screen readers are considered.
- **Emotional intelligence**: The UI acknowledges this is a sensitive context. Colors are calming, not aggressive. Typography is clear, not harsh.

## Spacing Philosophy

**8px base unit system** with consistent rhythm:

- **xs (4px)**: Tight spacing for related elements (icon + text)
- **sm (8px)**: Standard gap between related items
- **md (16px)**: Default spacing for component padding, gaps between sections
- **lg (24px)**: Breathing room between major sections
- **xl (32px)**: Large section separation
- **2xl (48px)**: Mobile navigation clearance
- **3xl (64px)**: Major page sections

**Rules:**

- Use consistent spacing tokens, never arbitrary values
- Mobile gets extra padding (pb-24) to clear bottom navigation
- Modals use responsive padding: `pt-16 pb-24 md:pb-4`
- Cards use `p-4 sm:p-6` for responsive internal spacing

## Color Preferences

### Brand Colors (Teal Palette)

- **Primary Dark**: `#275559` - Headers, primary buttons, emphasis
- **Primary Hover**: `#1f4447` - Darker state for primary actions
- **Secondary**: `#00908B` - Interactive elements, links, secondary buttons
- **Secondary Hover**: `#3d8a92` - Hover state for secondary
- **Accent**: `#6dd4b0` - Success states, positive actions
- **Focus**: `#46BD92` - Focus rings, active states

### Background Colors

- **Light**: `#E6F7F5` - Subtle backgrounds, hover states
- **Lighter**: `#C5E8E4` - Borders, soft backgrounds
- **Surface**: `#F9FAFB` - Elevated surfaces (grey-50)
- **White**: `#FFFFFF` - Cards, modals, main content

### UI Colors

- **Text Primary**: `#111827` (grey-900) - Main body text
- **Text Secondary**: `#4b5563` (grey-600) - Supporting text
- **Text Tertiary**: `#9ca3af` (grey-400) - Placeholders, hints
- **Border**: `#E5E7EB` (grey-200) - Default borders
- **Border Focus**: `#275559` - Focused input borders

### Semantic Colors

- **Success**: `#10b981` - Success messages, confirmations
- **Warning**: `#f59e0b` - Warnings, cautions
- **Error**: `#ef4444` - Errors, destructive actions
- **Info**: `#3b82f6` - Informational messages

**Color Rules:**

- Always use design tokens, never hardcode hex values
- Primary actions use dark teal (`#275559`)
- Secondary actions use medium teal (`#00908B`)
- Never use pure black text—use grey-900
- Borders are subtle (grey-200), not harsh
- Hover states darken by ~10-15%

## Typography System

### Font Families

**Sans-Serif (Primary - Body & UI):**

```css
'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
```

- **Usage**: Body text, UI elements, labels, buttons, navigation
- **When to use**: All interface elements, forms, buttons, body paragraphs
- **Tailwind class**: `font-sans` (default)

**Serif (Headings & Display):**

```css
'Georgia', 'Cambria', 'Times New Roman', 'Times', serif
```

- **Usage**: Headings, display text, impactful statements, hero sections
- **When to use**: Page titles, section headers, hero headlines, emphasis
- **Tailwind class**: `font-serif`
- **Style variations**: Regular (400), italic, semibold (600), bold (700)

**Typography Hierarchy:**

- **Serif (Georgia)**: For headings and display text that needs emphasis
- **Sans-serif (Inter)**: For all body text, UI elements, and functional text

### Font Sizes

| Size     | Pixels | Rem      | Usage                                 |
| -------- | ------ | -------- | ------------------------------------- |
| **xs**   | 12px   | 0.75rem  | Labels, captions, timestamps          |
| **sm**   | 14px   | 0.875rem | Secondary text, small buttons         |
| **base** | 16px   | 1rem     | Body text, inputs (prevents iOS zoom) |
| **lg**   | 18px   | 1.125rem | Emphasized body text                  |
| **xl**   | 20px   | 1.25rem  | Section headers                       |
| **2xl**  | 24px   | 1.5rem   | Page titles                           |
| **3xl**  | 30px   | 1.875rem | Hero text                             |
| **4xl**  | 36px   | 2.25rem  | Landing page headlines                |

### Font Weights

| Weight       | Value | Usage                        | Font Family                           |
| ------------ | ----- | ---------------------------- | ------------------------------------- |
| **Normal**   | 400   | Body text, default           | Inter (sans-serif)                    |
| **Medium**   | 500   | Labels, emphasis             | Inter (sans-serif)                    |
| **Semibold** | 600   | Headings, buttons            | Inter (sans-serif) or Georgia (serif) |
| **Bold**     | 700   | Strong emphasis, page titles | Inter (sans-serif) or Georgia (serif) |

### Typography Usage Guidelines

**Font Selection:**

- ✅ **Use serif (Georgia)** for: Headings, hero text, display statements, page titles
- ✅ **Use sans-serif (Inter)** for: Body text, UI elements, buttons, forms, labels
- ❌ **Don't mix serif in body paragraphs** - Keep body text in sans-serif
- ❌ **Don't use sans-serif for headings** - Use serif for visual hierarchy

**Font Weight Guidelines:**

- Body text: Normal (400)
- Labels and emphasis: Medium (500)
- Headings: Semibold (600) - preferred over bold for softer feel
- Strong emphasis: Bold (700) - use sparingly for page titles

**Typography Rules:**

- Base font size is 16px to prevent iOS zoom on input focus
- Line height: 1.5 for body text, 1.4 for compact text
- Use `-webkit-font-smoothing: antialiased` for crisp rendering
- Never use emojis in UI text unless user-requested
- Headings use semibold (600), not bold (700) for softer feel
- Serif headings create visual contrast with sans-serif body text

**Examples:**

```jsx
// Serif heading
<h1 className="font-serif text-4xl font-semibold text-teal-dark">
  Page Title
</h1>

// Sans-serif body
<p className="font-sans text-base text-gray-900">
  Body text content goes here.
</p>

// Serif display text with italic
<div className="font-serif text-3xl italic text-gray-900">
  Impactful statement
</div>
```

## What "Clean" and "Modern" Means

### Clean

- **No visual noise**: Borders are subtle (2px, grey-200), not heavy
- **Consistent spacing**: 8px rhythm throughout
- **Purposeful shadows**: `shadow-sm` for cards, `shadow-xl` for modals, `shadow-2xl` for emphasis
- **Clear hierarchy**: Size, weight, and color create obvious information structure
- **No decorative elements**: No unnecessary icons, gradients, or patterns
- **Generous whitespace**: Content breathes, doesn't feel cramped

### Modern

- **Rounded corners**: `rounded-lg` (12px) for cards, `rounded-xl` (16px) for modals
- **Soft shadows**: Multi-layer shadows with transparency
- **Smooth transitions**: `transition-all` or `transition-colors` on interactive elements
- **Mobile-first**: Responsive by default, desktop is enhancement
- **Touch-friendly**: 44px minimum touch targets, no hover-only interactions
- **Accessible**: WCAG 2.1 AA contrast, keyboard navigation, focus indicators

## Good UI vs Bad UI

### ✅ Good UI Example

```jsx
// Clean, spacious, clear hierarchy
<div className="bg-white rounded-xl p-6 border-2 border-[#C5E8E4] shadow-sm">
  <h3 className="text-xl font-semibold text-[#00908B] mb-4">Contact Information</h3>
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-[#00908B] mb-2">Email Address</label>
      <input
        type="email"
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                   focus:outline-none focus:border-[#275559] transition-all
                   min-h-[44px] text-base"
        placeholder="your@email.com"
      />
    </div>
    <button
      className="w-full px-6 py-3 bg-[#275559] text-white rounded-lg 
                       font-semibold hover:bg-[#1f4447] transition-colors
                       min-h-[44px]"
    >
      Save Changes
    </button>
  </div>
</div>
```

**Why it's good:**

- Clear visual hierarchy (heading → label → input → button)
- Consistent spacing (space-y-4, mb-4, mb-2)
- Touch-friendly (min-h-[44px])
- Accessible (proper labels, focus states)
- Uses design tokens (colors, spacing, border radius)

### ❌ Bad UI Example

```jsx
// Cluttered, inconsistent, poor accessibility
<div style={{ background: 'white', padding: '10px', borderRadius: '5px' }}>
  <h3 style={{ color: '#00908B', marginBottom: '8px' }}>Contact</h3>
  <input type="email" placeholder="email" style={{ width: '100%', padding: '5px' }} />
  <button style={{ background: '#275559', color: 'white', padding: '8px', marginTop: '10px' }}>
    Save
  </button>
</div>
```

**Why it's bad:**

- Inline styles instead of Tailwind classes
- Inconsistent spacing (10px, 8px, 5px)
- No labels (accessibility issue)
- Small touch targets (5px padding = ~30px height)
- No focus states
- Hardcoded colors instead of tokens
- Inconsistent border radius (5px vs standard 12px)

## UX Rules and Principles

### 1. Mobile-First

- Design for mobile (320px) first, enhance for desktop
- Touch targets minimum 44px × 44px
- Input font size 16px minimum (prevents iOS zoom)
- Bottom navigation on mobile (48px height, z-50)
- Top navigation on desktop (40px height, sticky)

### 2. Accessibility

- All interactive elements keyboard accessible
- Focus indicators visible (border color change)
- Color contrast ratio ≥ 4.5:1 for text
- Semantic HTML (buttons are `<button>`, not `<div>`)
- ARIA labels where needed
- Screen reader friendly

### 3. Responsive Patterns

- Use Tailwind breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Modals: `p-4 pb-24 md:pb-4` (extra bottom padding on mobile)
- Cards: `p-4 sm:p-6` (more padding on larger screens)
- Text: `text-base sm:text-lg` (larger on desktop)
- Grids: `grid-cols-1 md:grid-cols-2` (stack on mobile)

### 4. Interaction Feedback

- Hover: Color darkens by 10-15%, subtle shadow increase
- Active: `scale(0.98)` for buttons
- Focus: Border color changes to primary teal
- Loading: Spinner with primary teal color
- Disabled: Reduced opacity (50%), no pointer events

### 5. Error Handling

- Errors in red-50 background with red-200 border
- Error text in red-700
- Inline validation with clear messages
- Never block user from fixing errors

### 6. Information Hierarchy

1. **Primary**: Page title (2xl, semibold, primary color)
2. **Secondary**: Section headers (xl, semibold, secondary color)
3. **Tertiary**: Labels, captions (sm, medium, secondary color)
4. **Body**: Main content (base, normal, grey-900)

## Component Shape Philosophy

### Corner Radius System

**Purpose**: Create visual harmony and premium feel through consistent rounding

- **`rounded-sm`** (6px): Small elements, badges, tags
- **`rounded-md`** (8px): Default for most elements
- **`rounded-lg`** (12px): Buttons, inputs, small cards
- **`rounded-xl`** (16px): Cards, containers, medium components
- **`rounded-2xl`** (24px): Modals, large cards, hero sections
- **Never `rounded-full`**: Use `rounded-2xl` for maximum rounding instead

**Rules:**

- Similar components use the same corner radius
- Larger components can use larger radii
- Never mix sharp corners with rounded corners in the same component family
- Corner radius should feel intentional, not arbitrary

### Shadow & Depth System

**Purpose**: Create subtle elevation and premium depth without harshness

- **`shadow-sm`**: Subtle elevation for cards at rest (0 1px 2px rgba(0,0,0,0.05))
- **`shadow-md`**: Medium elevation for hover states (0 4px 6px rgba(0,0,0,0.1))
- **`shadow-lg`**: Large elevation for modals (0 10px 15px rgba(0,0,0,0.1))
- **`shadow-xl`**: Extra large for prominent elements (0 20px 25px rgba(0,0,0,0.1))
- **`shadow-2xl`**: Maximum elevation (0 25px 50px rgba(0,0,0,0.25))

**Depth Philosophy:**

- Shadows should be soft and multi-layered
- Never use shadows for depth alone—combine with borders and spacing
- Hover states should subtly increase shadow depth
- Shadows should never compete with content

**Gloss & Surface Treatment:**

- Avoid gradients for depth (no skeuomorphism)
- Use subtle borders (`border-2`) for definition
- White backgrounds with soft shadows create premium feel
- Matte surfaces, not glossy

### Border System

**Purpose**: Define edges without harshness

- **`border-2`** (2px): Standard for all borders
- **Colors**: `border-teal-light` for brand elements, `border-gray-200` for neutral
- **Focus states**: `border-teal-dark` for primary focus
- **Never use `border-1`**: Too subtle, lacks definition

**Rules:**

- All borders are 2px for consistency
- Border colors should be subtle, not harsh
- Focus borders use brand color for clear feedback

## Component Patterns

### Button Visual Hierarchy

**Purpose**: Direct attention through clear visual hierarchy

**Primary Button (Most Important):**

```jsx
<button
  className="px-6 py-3 bg-teal-dark text-white rounded-lg 
                   font-semibold hover:bg-teal-darkest transition-colors
                   shadow-sm hover:shadow-md min-h-[44px]"
>
  Primary Action
</button>
```

- **Visual Weight**: Highest (darkest color, semibold, shadow)
- **Use For**: Main CTAs, critical actions, form submissions
- **Hierarchy**: Dominates the visual space

**Secondary Button (Supporting):**

```jsx
<button
  className="px-6 py-3 bg-teal-medium text-white rounded-lg 
                   font-semibold hover:bg-teal-dark transition-colors
                   shadow-sm hover:shadow-md min-h-[44px]"
>
  Secondary Action
</button>
```

- **Visual Weight**: Medium (lighter color, same weight)
- **Use For**: Alternative actions, secondary CTAs
- **Hierarchy**: Visible but quieter than primary

**Tertiary/Ghost Button (Minimal):**

```jsx
<button
  className="px-6 py-3 bg-white text-teal-medium border-2 border-teal-light 
                   rounded-lg font-semibold hover:bg-teal-lightest transition-colors
                   min-h-[44px]"
>
  Cancel
</button>
```

- **Visual Weight**: Lowest (outline style, no fill)
- **Use For**: Cancel, dismiss, less important actions
- **Hierarchy**: Present but unobtrusive

**Button Group Hierarchy:**

- Primary button should be visually dominant
- Secondary buttons should be 20-30% less visually prominent
- Tertiary buttons should be 50% less prominent
- Use spacing (`gap-3`) to separate button groups

**Rules:**

- Always `rounded-lg`, never `rounded-full`
- Minimum height 44px for touch targets
- Use semantic colors from design tokens
- Include hover and transition states
- Shadow depth increases on hover for premium feel

### Buttons

**Primary Button:**

```jsx
<button
  className="px-6 py-3 bg-[#275559] text-white rounded-lg 
                   font-semibold hover:bg-[#1f4447] transition-colors
                   min-h-[44px]"
>
  Primary Action
</button>
```

**Secondary Button:**

```jsx
<button
  className="px-6 py-3 bg-[#00908B] text-white rounded-lg 
                   font-semibold hover:bg-[#3d8a92] transition-colors
                   min-h-[44px]"
>
  Secondary Action
</button>
```

**Ghost Button:**

```jsx
<button
  className="px-6 py-3 bg-[#E6F7F5] text-[#00908B] border border-[#C5E8E4] 
                   rounded-lg font-semibold hover:bg-gray-200 transition-colors
                   min-h-[44px]"
>
  Cancel
</button>
```

**Rules:**

- Always `rounded-lg`, never `rounded-full`
- Minimum height 44px
- Use semantic colors from design tokens
- Include hover and transition states
- Follow visual hierarchy (primary > secondary > tertiary)

### Inputs

```jsx
<input
  type="text"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
             focus:outline-none focus:border-[#275559] transition-all
             min-h-[44px] text-base"
  placeholder="Enter text..."
/>
```

**Rules:**

- `border-2` (not border-1) for visibility
- `border-gray-200` default, `border-[#275559]` on focus
- `min-h-[44px]` for touch-friendly
- `text-base` (16px) prevents iOS zoom
- Always include labels for accessibility

### Cards

```jsx
<div
  className="bg-white rounded-xl p-4 sm:p-6 border-2 border-[#C5E8E4] 
                shadow-sm hover:shadow-md transition-all"
>
  {/* Content */}
</div>
```

**Rules:**

- `rounded-xl` (16px) for cards
- `border-2 border-[#C5E8E4]` for subtle definition
- `shadow-sm` default, `shadow-md` on hover
- Responsive padding: `p-4 sm:p-6`

### Shadows (Elevation System)

**Shadow Usage Guidelines:**

- **`shadow-sm`**: Subtle elevation for cards at rest
  - Use for: Cards, input fields, buttons at rest
  - Example: `<div className="bg-white rounded-xl shadow-sm">`

- **`shadow-md`**: Medium elevation for hover states
  - Use for: Card hover, button hover, interactive elements
  - Example: `<div className="shadow-sm hover:shadow-md transition-all">`

- **`shadow-lg`**: Large elevation for modals
  - Use for: Modal dialogs, dropdowns, popovers
  - Example: `<div className="bg-white rounded-2xl shadow-lg">`

- **`shadow-xl`**: Extra large elevation for prominent elements
  - Use for: Important modals, overlays, floating action buttons
  - Example: `<div className="bg-white rounded-2xl shadow-xl">`

- **`shadow-2xl`**: Maximum elevation for emphasis
  - Use for: Critical modals, important notifications
  - Example: `<div className="bg-white rounded-2xl shadow-2xl">`

**Rules:**

- Always pair with `transition-all` or `transition-shadow` for smooth changes
- Use `hover:shadow-md` for interactive elements
- Never use shadows for depth alone—use borders and spacing first
- Shadows should be subtle and not compete with content

### Modals

```jsx
<div
  className="fixed inset-0 bg-black/40 flex items-center justify-center 
                z-[100] p-4 pb-24 md:pb-4 overflow-y-auto"
>
  <div
    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl 
                  max-h-full flex flex-col border border-gray-200"
  >
    {/* Header */}
    <div
      className="border-b border-gray-100 px-6 py-5 flex items-center 
                    justify-between flex-shrink-0"
    >
      <h3 className="text-2xl font-bold text-gray-900">Modal Title</h3>
      <button className="text-2xl font-bold text-gray-500 hover:text-[#00908B]">×</button>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto px-6 py-6">{/* Scrollable content */}</div>

    {/* Footer */}
    <div
      className="px-6 py-4 border-t border-gray-200 flex justify-end 
                    flex-shrink-0"
    >
      <button
        className="px-8 py-2.5 bg-[#00908B] text-white rounded-xl 
                         font-semibold hover:bg-[#1f4447] transition-colors"
      >
        Action
      </button>
    </div>
  </div>
</div>
```

**Rules:**

- `z-[100]` for modals (above navigation z-50)
- `bg-black/40` backdrop
- `pb-24` on mobile to clear bottom nav, `md:pb-4` on desktop
- Three-section structure: header (flex-shrink-0), content (flex-1, scrollable), footer (flex-shrink-0)
- `rounded-2xl` (24px) for modals
- `shadow-2xl` for depth

## Chat Layout Patterns

### Message Bubbles

**Sent Message (User):**

```jsx
<div className="flex justify-end mb-4">
  <div className="max-w-[75%] sm:max-w-[60%]">
    <div
      className="bg-[#00908B] text-white rounded-2xl rounded-tr-sm 
                    px-4 py-3 shadow-sm"
    >
      <p className="text-sm leading-relaxed">{message.content}</p>
      <p className="text-xs opacity-75 mt-1 text-right">{formatTime(message.timestamp)}</p>
    </div>
  </div>
</div>
```

**Received Message (Other User):**

```jsx
<div className="flex justify-start mb-4">
  <div className="max-w-[75%] sm:max-w-[60%]">
    <div
      className="bg-white border-2 border-[#C5E8E4] rounded-2xl rounded-tl-sm 
                    px-4 py-3 shadow-sm"
    >
      <p className="text-sm text-gray-900 leading-relaxed">{message.content}</p>
      <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
    </div>
  </div>
</div>
```

**Rules:**

- Max width 75% on mobile, 60% on desktop
- Rounded corners with one sharp corner (indicates direction)
- Timestamp in smaller, muted text
- Consistent spacing between messages (mb-4)
- Sent messages use brand teal, received use white with teal border

### Chat Input Area

```jsx
<div className="border-t-2 border-[#C5E8E4] bg-white p-4 safe-area-inset-bottom">
  <div className="flex items-end gap-3">
    <textarea
      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl
                 focus:outline-none focus:border-[#275559] transition-all
                 min-h-[44px] max-h-32 text-base resize-none"
      placeholder="Type a message..."
      rows={1}
    />
    <button
      className="px-6 py-3 bg-[#275559] text-white rounded-xl
                       font-semibold hover:bg-[#1f4447] transition-colors
                       min-h-[44px] min-w-[44px] flex items-center justify-center"
    >
      Send
    </button>
  </div>
</div>
```

**Rules:**

- Fixed to bottom with safe area support
- Border-top separates from chat area
- Textarea grows with content (max-h-32)
- Send button always accessible
- Touch-friendly sizing

### Chat Container

```jsx
<div className="flex flex-col h-screen">
  {/* Header */}
  <div className="border-b-2 border-[#C5E8E4] bg-white px-4 py-3 flex-shrink-0">
    <h2 className="text-xl font-semibold text-[#00908B]">Chat Room</h2>
  </div>

  {/* Messages */}
  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">{/* Message bubbles */}</div>

  {/* Input */}
  <div className="border-t-2 border-[#C5E8E4] bg-white p-4 flex-shrink-0">{/* Input area */}</div>
</div>
```

**Rules:**

- Three-section layout: header (flex-shrink-0), messages (flex-1, scrollable), input (flex-shrink-0)
- Consistent border color (`border-[#C5E8E4]`)
- Proper overflow handling
- Safe area support on mobile

## Tone, Hierarchy, and Visual Rhythm

### Tone

**Visual Tone:**

- **Calming**: Teal palette reduces anxiety, creates trust
- **Professional**: Clean lines, consistent spacing, no whimsy
- **Supportive**: Soft shadows, rounded corners, generous spacing
- **Clear**: High contrast, readable fonts, obvious hierarchy

**Text Tone:**

- **Direct but warm**: "Save Changes" not "Would you like to save your changes?"
- **Action-oriented**: Button labels are verbs ("Send", "Save", "Cancel")
- **Respectful**: Acknowledges sensitive co-parenting context
- **Concise**: No unnecessary words

### Hierarchy

**Visual Hierarchy (Top to Bottom):**

1. **Page Title**: 2xl, semibold, `#00908B` - What page am I on?
2. **Section Headers**: xl, semibold, `#00908B` - What section is this?
3. **Card Titles**: lg, semibold, `#275559` - What is this card?
4. **Labels**: sm, medium, `#00908B` - What is this field?
5. **Body Text**: base, normal, `#111827` - The actual content
6. **Hints/Placeholders**: sm, normal, `#9ca3af` - Supporting info

**Spacing Hierarchy:**

- Between major sections: `mb-12` or `mb-24` (48px-96px)
- Between cards: `mb-6` or `mb-8` (24px-32px)
- Within cards: `space-y-4` or `space-y-6` (16px-24px)
- Between related items: `gap-3` or `gap-4` (12px-16px)
- Tight spacing: `gap-2` (8px)

### Visual Rhythm

**Consistent Patterns:**

- **Cards**: Always `rounded-xl`, `border-2`, `shadow-sm`
- **Buttons**: Always `rounded-lg`, `min-h-[44px]`, hover states
- **Inputs**: Always `border-2`, `rounded-lg`, `min-h-[44px]`
- **Spacing**: Always multiples of 4px (4, 8, 12, 16, 24, 32, 48, 64)

**Breathing Room:**

- Content never touches edges (minimum 16px padding)
- Sections have clear separation (borders or spacing)
- Lists have consistent gaps (`space-y-3` or `space-y-4`)
- Forms have logical grouping (related fields together)

**Repetition Creates Harmony:**

- Same border radius for similar elements
- Same spacing scale throughout
- Same color usage (primary for actions, secondary for info)
- Same shadow depth for same elevation level

## Icon Style Rules

**Purpose**: Create visual cohesion through consistent iconography

### Icon Style Guidelines

**Style**: Outline, minimal, geometric, sleek

- **Stroke width**: 2px (strokeWidth={2})
- **Style**: Outline (not filled) for consistency
- **Shape**: Geometric, minimal, clean lines
- **Size**: Consistent sizing scale (w-4 h-4, w-5 h-5, w-6 h-6)

**Icon Sizing:**

- **Small**: `w-4 h-4` (16px) - Inline with text, badges
- **Medium**: `w-5 h-5` (20px) - Buttons, cards, navigation
- **Large**: `w-6 h-6` (24px) - Headers, hero sections
- **XLarge**: `w-8 h-8` (32px) - Feature icons, illustrations

**Icon Colors:**

- **Primary**: `text-teal-medium` - Brand icons, primary actions
- **Secondary**: `text-gray-600` - Supporting icons, secondary actions
- **Tertiary**: `text-gray-400` - Decorative, less important
- **Interactive**: `text-teal-medium hover:text-teal-dark` - Hover states

**Rules:**

- Always use SVG icons, never bitmap images
- Icons should be outline style (not filled) for consistency
- Stroke width should be 2px for all icons
- Icons should align to text baselines when inline
- Never mix outline and filled icon styles
- Use consistent icon library (Heroicons recommended)

**Icon Placement:**

- Icons + text: `gap-2` (8px) spacing
- Icon buttons: Center icons with `flex items-center justify-center`
- Inline icons: Use `inline-flex` with `items-center`

## Layout Framing & Beautiful Compositions

**Purpose**: Create visually striking, intentional layouts that feel premium

### Composition Principles

**The Rule of Thirds:**

- Divide screen into 3x3 grid
- Place important elements at intersection points
- Avoid centering everything
- Create visual interest through asymmetry

**Visual Weight Distribution:**

- Primary elements: Larger, darker, higher contrast
- Secondary elements: Medium size, medium contrast
- Tertiary elements: Smaller, lighter, lower contrast
- **Question**: "Does visual weight match importance?"

**Framing Techniques:**

- **Containers**: Use cards with `rounded-xl` and `shadow-sm` to frame content
- **Sections**: Use spacing (`mb-12`, `mb-24`) to create clear sections
- **Groups**: Use borders or backgrounds to group related elements
- **Focus**: Use color, size, or spacing to create focal points

**Beautiful Layout Patterns:**

**Hero Section:**

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
  <div className="text-center space-y-6">
    <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900">Headline</h1>
    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Supporting text</p>
    <div className="flex justify-center gap-4">
      <button className="primary">CTA</button>
    </div>
  </div>
</div>
```

**Card Grid:**

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards with consistent styling */}
</div>
```

**Asymmetric Layout:**

```jsx
<div className="flex flex-col md:flex-row gap-8 items-start">
  <div className="flex-1">{/* Primary content */}</div>
  <div className="md:w-80">{/* Sidebar content */}</div>
</div>
```

**Rules:**

- Use generous spacing to create breathing room
- Align elements to consistent grid
- Create visual hierarchy through size, color, and spacing
- Use asymmetry intentionally, not accidentally
- Frame content with cards, borders, or backgrounds

## Image & Illustration Rules

**Purpose**: Make the app feel premium through high-quality visuals

### Image Guidelines

**Quality Standards:**

- **Resolution**: Minimum 2x for retina displays
- **Format**: WebP preferred, fallback to PNG/JPG
- **Optimization**: Compress without visible quality loss
- **Aspect Ratios**: Maintain consistent ratios (16:9, 4:3, 1:1)

**Image Treatment:**

- **Rounded Corners**: Use `rounded-xl` (16px) for images
- **Shadows**: Use `shadow-md` for elevated images
- **Borders**: Optional `border-2 border-gray-200` for definition
- **Overlays**: Use subtle overlays for text readability

**Image Sizing:**

- **Hero Images**: Full width, max-height constraints
- **Card Images**: Aspect ratio maintained, responsive
- **Avatar Images**: `rounded-full` or `rounded-xl` for consistency
- **Icon Images**: Square, consistent sizing

**Placeholder Strategy:**

- Use subtle gradients or solid colors
- Include loading states with skeleton screens
- Never use broken image icons

### Illustration Guidelines

**Style**: Minimal, geometric, modern

- **Color Palette**: Use brand colors (teal family)
- **Complexity**: Simple, not overly detailed
- **Purpose**: Support content, not distract
- **Consistency**: Same illustration style throughout

**Illustration Usage:**

- **Empty States**: Friendly, supportive illustrations
- **Onboarding**: Step-by-step illustrations
- **Feature Highlights**: Simple, geometric representations
- **Error States**: Calming, helpful illustrations

**Rules:**

- Illustrations should match brand aesthetic (teal, minimal, geometric)
- Use SVG format for scalability
- Keep illustrations simple and purposeful
- Never use illustrations as decoration only
- Ensure illustrations are accessible (alt text, ARIA labels)

## Additional Rules

1. **Never use `rounded-full`** - Use `rounded-lg` or `rounded-xl` instead
2. **Always use design tokens** - Never hardcode colors, use token classes
3. **Mobile-first responsive** - Design for 320px, enhance for larger screens
4. **Touch targets 44px minimum** - All interactive elements
5. **16px base font** - Prevents iOS zoom on input focus
6. **Consistent z-index** - Navigation: 50, Modals: 100, Toasts: 9999
7. **Safe area support** - Use `safe-area-inset-*` classes for mobile notches
8. **No inline styles** - Always use Tailwind classes
9. **Semantic HTML** - Use proper elements (`<button>`, `<nav>`, `<main>`)
10. **Accessibility first** - Labels, focus states, keyboard navigation, ARIA where needed
11. **Premium aesthetics** - Prioritize visual appeal, sophistication, and intentional design
12. **Icon consistency** - Use outline style, 2px stroke, geometric shapes
13. **Layout framing** - Create beautiful compositions with generous spacing and clear hierarchy
14. **Image quality** - High-resolution, optimized, consistent aspect ratios
