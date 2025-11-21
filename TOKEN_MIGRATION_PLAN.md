# Design Token Migration Plan

## Status

✅ **Phase 1 Complete**: Design tokens integrated into Tailwind config  
🔄 **Phase 2 In Progress**: Migrating hardcoded values to token classes

## Current State

- **505 hardcoded color values** found across 18 files
- Design tokens are now available as Tailwind classes
- Migration guide created in `DESIGN_TOKENS_USAGE.md`

## Migration Strategy

### Priority Order

1. **High Priority** (Most visible, most used):
   - `ChatRoom.jsx` (90 instances)
   - `LandingPage.jsx` (182 instances)
   - `Navigation.jsx` (22 instances)
   - `LoginSignup.jsx` (8 instances)

2. **Medium Priority** (Components):
   - `ContactsPanel.jsx` (65 instances)
   - `ProfilePanel.jsx` (21 instances)
   - `UpdatesPanel.jsx` (11 instances)
   - `ActivityCard.jsx` (10 instances)

3. **Low Priority** (Modals, utilities):
   - All modal components
   - `Toast.jsx`
   - `PWAInstallButton.jsx`
   - `GoogleOAuthCallback.jsx`

## Token Mapping Reference

### Color Replacements

| Hardcoded | Token Class | Usage |
|-----------|-------------|-------|
| `#275559` | `teal-dark` | Primary buttons, headers |
| `#4DA8B0` | `teal-medium` | Secondary buttons, links, accents |
| `#C5E8E4` | `teal-light` | Borders |
| `#E6F7F5` | `teal-lightest` | Subtle backgrounds |
| `#1f4447` | `teal-darkest` | Hover states on dark teal |
| `#3d8a92` | Use `teal-dark` with opacity or create new token | Secondary hover |

### Example Migrations

**Before:**
```jsx
<button className="bg-[#275559] hover:bg-[#1f4447] text-white">
  Primary Action
</button>
```

**After:**
```jsx
<button className="bg-teal-dark hover:bg-teal-darkest text-white">
  Primary Action
</button>
```

**Before:**
```jsx
<div className="border-2 border-[#C5E8E4] bg-[#E6F7F5]">
  Card
</div>
```

**After:**
```jsx
<div className="border-2 border-teal-light bg-teal-lightest">
  Card
</div>
```

## Automated Migration Script

You can use find/replace with these patterns:

### Find/Replace Patterns

1. `bg-\[#275559\]` → `bg-teal-dark`
2. `bg-\[#4DA8B0\]` → `bg-teal-medium`
3. `bg-\[#C5E8E4\]` → `bg-teal-light`
4. `bg-\[#E6F7F5\]` → `bg-teal-lightest`
5. `bg-\[#1f4447\]` → `bg-teal-darkest`
6. `border-\[#C5E8E4\]` → `border-teal-light`
7. `text-\[#4DA8B0\]` → `text-teal-medium`
8. `text-\[#275559\]` → `text-teal-dark`
9. `hover:bg-\[#1f4447\]` → `hover:bg-teal-darkest`
10. `hover:bg-\[#3d8a92\]` → `hover:bg-teal-dark` (or create new token)

## Verification Checklist

After migration, verify:
- [ ] All colors use token classes
- [ ] No hardcoded hex values remain
- [ ] Hover states work correctly
- [ ] Focus states use token colors
- [ ] Visual appearance matches original
- [ ] Tailwind IntelliSense recognizes classes

## Benefits After Migration

✅ **Single Source of Truth**: Change tokens once, update everywhere  
✅ **Type Safety**: Tailwind IntelliSense for token classes  
✅ **Maintainability**: Easier to update design system  
✅ **Consistency**: Enforced through Tailwind config  
✅ **Documentation**: Token usage is self-documenting  

## Next Steps

1. Start with `ChatRoom.jsx` (highest impact)
2. Migrate `LandingPage.jsx`
3. Continue with other high-priority files
4. Verify all changes work correctly
5. Update any remaining hardcoded values

