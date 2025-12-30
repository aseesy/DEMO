# Quick Start Guide - Design System Refactoring

**Start Here:** Ready-to-execute commands for immediate implementation

---

## 🎯 Option 1: Guided Setup (Recommended)

Let Claude Code create the components for you using the implementation plan.

**Command:**

```
Ask Claude: "Create the Button component following IMPLEMENTATION_PLAN.md Step 1.2"
```

---

## 🚀 Option 2: Manual Setup (5 minutes)

### Step 1: Create Folder Structure

```bash
cd /Users/athenasees/Desktop/chat/chat-client-vite/src/components

# Create UI component folders
mkdir -p ui/Button ui/Modal ui/Input

# Create placeholder files
touch ui/Button/Button.jsx ui/Button/index.js
touch ui/Modal/Modal.jsx ui/Modal/index.js
touch ui/Input/Input.jsx ui/Input/index.js
touch ui/index.js
```

### Step 2: Copy Button Component

Open `chat-client-vite/src/components/ui/Button/Button.jsx` and paste this code:

```jsx
import React from 'react';

const variants = {
  primary: 'bg-teal-dark text-white hover:bg-teal-darkest disabled:bg-gray-400',
  secondary: 'bg-teal-medium text-white hover:bg-teal-dark disabled:bg-gray-400',
  tertiary:
    'border-2 border-teal-dark text-teal-dark hover:bg-teal-lightest disabled:border-gray-400 disabled:text-gray-400',
  ghost: 'text-teal-dark hover:bg-teal-lightest disabled:text-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400',
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
  const baseClasses =
    'font-semibold rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2';

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.medium;
  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses =
    `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
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

### Step 3: Create Button Export

Open `chat-client-vite/src/components/ui/Button/index.js`:

```js
export { Button } from './Button';
export default Button;
```

### Step 4: Test Button Component

Open `chat-client-vite/src/components/LoginSignup.jsx` and add at top:

```jsx
import { Button } from './ui/Button';
```

Find the first button (around line 119) and replace with:

```jsx
<Button
  variant="primary"
  size="medium"
  fullWidth
  onClick={handleSubmit}
  disabled={loading}
  loading={loading}
>
  {isLogin ? 'Sign In' : 'Create Account'}
</Button>
```

### Step 5: Verify in Browser

```bash
# If servers aren't running:
npm run dev

# Open browser to:
http://localhost:5173/signin
```

**Check:**

- [ ] Button renders correctly
- [ ] Colors match original (teal dark background)
- [ ] Hover effect works (darker teal)
- [ ] Loading state shows spinner
- [ ] Button is touch-friendly (44px minimum)

---

## 🎨 Quick Color Reference

When replacing hardcoded colors:

| Old (Hardcoded)    | New (Token)              | Usage                          |
| ------------------ | ------------------------ | ------------------------------ |
| `bg-[#275559]`     | `bg-teal-dark`           | Primary buttons, emphasis      |
| `bg-[#1f4447]`     | `bg-teal-darkest`        | Hover states                   |
| `bg-[#4DA8B0]`     | `bg-teal-medium`         | Secondary buttons, interactive |
| `bg-[#E6F7F5]`     | `bg-teal-lightest`       | Subtle backgrounds             |
| `bg-[#C5E8E4]`     | `bg-teal-light`          | Borders, soft backgrounds      |
| `border-[#E5E7EB]` | `border-ui-border`       | Default borders                |
| `text-[#111827]`   | `text-ui-text-primary`   | Primary text                   |
| `text-[#4b5563]`   | `text-ui-text-secondary` | Secondary text                 |

---

## 🔍 Find Hardcoded Colors

Find all hardcoded colors in your codebase:

```bash
cd /Users/athenasees/Desktop/chat/chat-client-vite/src

# Count hardcoded background colors
grep -r "bg-\[#" . --include="*.jsx" --include="*.js" | wc -l

# See actual instances
grep -r "bg-\[#" . --include="*.jsx" --include="*.js"

# Count hardcoded text colors
grep -r "text-\[#" . --include="*.jsx" --include="*.js" | wc -l

# Count hardcoded border colors
grep -r "border-\[#" . --include="*.jsx" --include="*.js" | wc -l
```

---

## 📝 Next Steps

After completing the Button component:

1. **Create Modal Component** (IMPLEMENTATION_PLAN.md Step 1.3)
2. **Create Input Component** (IMPLEMENTATION_PLAN.md Step 1.4)
3. **Replace 50 Hardcoded Colors** (IMPLEMENTATION_PLAN.md Step 1.6)

---

## 💡 Tips

**Use Find & Replace (VSCode):**

- Mac: `Cmd + Shift + H`
- Windows/Linux: `Ctrl + Shift + H`
- Select "Replace in Files"
- Set filter: `**/*.{jsx,js}`

**Common Replacements:**

```
Find: bg-[#275559]
Replace: bg-teal-dark

Find: hover:bg-[#1f4447]
Replace: hover:bg-teal-darkest

Find: text-[#275559]
Replace: text-teal-dark
```

---

## 🆘 Troubleshooting

**"Cannot find module './ui/Button'"**

- Check import path matches your file structure
- Use `import { Button } from '../ui/Button'` (adjust `../` based on depth)

**Button doesn't render / white screen**

- Check browser console for errors
- Verify Tailwind classes are recognized
- Check `tailwind.config.js` has token definitions

**Colors don't match**

- Verify `tailwind.config.js` loads design tokens
- Check token values in `.design-tokens-mcp/tokens.json`
- Run `npm run build` to rebuild

**Hot reload not working**

```bash
npm run kill-ports
npm run dev
```

---

## 📚 Documentation

- **Full Plan:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Audit Details:** [DESIGN_SYSTEM_AUDIT.md](DESIGN_SYSTEM_AUDIT.md)
- **Examples:** [DESIGN_INCONSISTENCIES_EXAMPLES.md](DESIGN_INCONSISTENCIES_EXAMPLES.md)
- **Executive Summary:** [DESIGN_SYSTEM_EXECUTIVE_SUMMARY.md](DESIGN_SYSTEM_EXECUTIVE_SUMMARY.md)

---

**Ready to start? Run the commands above or ask Claude Code for help!**
