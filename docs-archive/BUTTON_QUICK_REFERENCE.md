# Button Component - Quick Reference

**Quick lookup guide for common button patterns**

---

## Import

```jsx
import { Button } from './ui';
```

---

## Common Patterns

### Primary CTA
```jsx
<Button variant="primary">Get Started</Button>
```

### Save Button
```jsx
<Button
  variant="primary"
  loading={isSaving}
  disabled={isSaving}
>
  Save
</Button>
```

### Cancel Button
```jsx
<Button variant="tertiary" onClick={onCancel}>
  Cancel
</Button>
```

### Delete Button
```jsx
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>
```

### Close Button (×)
```jsx
<Button
  variant="ghost"
  size="small"
  onClick={onClose}
  aria-label="Close"
>
  ×
</Button>
```

### Icon Button
```jsx
<Button
  variant="ghost"
  icon={<EditIcon />}
  onClick={handleEdit}
>
  Edit
</Button>
```

### Loading Button
```jsx
<Button
  loading={isLoading}
  disabled={isLoading}
>
  Submit
</Button>
```

### Full Width
```jsx
<Button variant="primary" fullWidth>
  Create Account
</Button>
```

### Toggle Button
```jsx
<Button
  variant={isActive ? 'secondary' : 'tertiary'}
  onClick={handleToggle}
>
  {label}
</Button>
```

---

## Quick Variant Guide

| Use Case | Variant |
|----------|---------|
| Main action | `primary` |
| Secondary action | `secondary` |
| Cancel/Back | `tertiary` |
| Close/Hide | `ghost` |
| Delete/Remove | `danger` |

---

## Quick Size Guide

| Context | Size |
|---------|------|
| Hero CTA | `large` |
| Most buttons | `medium` |
| Modal footer | `small` |
| Cards | `small` |

---

## Props Cheatsheet

```jsx
<Button
  variant="primary|secondary|tertiary|ghost|danger"
  size="small|medium|large"
  fullWidth={boolean}
  disabled={boolean}
  loading={boolean}
  icon={<ReactNode>}
  iconPosition="left|right"
  onClick={function}
  type="button|submit|reset"
  className="additional-classes"
>
  Button Text
</Button>
```

---

## Modal Footer Pattern

```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  footer={
    <>
      <Button variant="tertiary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSave}>
        Save
      </Button>
    </>
  }
>
  Content
</Modal>
```

---

## Form Pattern

```jsx
<form onSubmit={handleSubmit}>
  {/* fields */}
  <div className="flex gap-2">
    <Button type="button" variant="tertiary" onClick={onCancel}>
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
```

---

## Accessibility Checklist

- ✅ Use `aria-label` for icon-only buttons
- ✅ Set `loading={true}` for async actions
- ✅ Set `disabled={true}` when unavailable
- ✅ Use semantic `type` (button, submit, reset)
- ✅ Minimum 44px touch target (automatic)

---

**See DESIGN_SYSTEM.md for full documentation**
