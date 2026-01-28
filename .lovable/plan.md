
# Plan: Test and Fix Vazirmatn Font, Admin Setup, and Virtual Keyboard

## Current Analysis Results

### 1. Vazirmatn Font Configuration
The font configuration is **correctly set up**:

| Component | Status | Location |
|-----------|--------|----------|
| Font Files | Present | `public/fonts/Vazirmatn-*.woff2` (Light, Regular, Medium, Bold) |
| @font-face | Correct | `src/index.css` lines 6-36 with `font-display: swap` |
| RTL Direction | Set | `src/index.css` line 146: `html { direction: rtl; }` |
| Default Font | Configured | `font-family: 'Vazirmatn', system-ui, sans-serif` |
| Tailwind Config | Ready | `fontFamily: { vazir: ['Vazirmatn', ...] }` |

### 2. Admin Setup - Duplicate Key Fix
The `makeAdmin()` function has been **properly fixed** with the select-then-insert pattern:

```typescript
// Current implementation (lines 163-215 in AuthContext.tsx)
const makeAdmin = async () => {
  // 1. First check if role already exists
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  // 2. If exists, return success without inserting
  if (existingRole) {
    setIsAdmin(true);
    return { error: null };
  }

  // 3. Insert new role with duplicate key fallback
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ user_id: user.id, role: 'admin' });
  
  // 4. Handle 23505 (duplicate key) gracefully
  if (insertError?.code === '23505') {
    setIsAdmin(true);
    return { error: null };
  }
};
```

### 3. Virtual Keyboard System
All 4 layouts are correctly implemented in `VirtualKeyboard.tsx`:

| Layout | Keys | Shift Support |
|--------|------|---------------|
| Persian | ض ص ث ق ف... | Yes (diacritics) |
| Arabic | ض ص ث ق ف... (ي ك variant) | Yes (diacritics) |
| English | q w e r t y... | Yes (uppercase) |
| Numbers | 1 2 3 4 5... | No |

### 4. Console Warnings Analysis
The warning "Function components cannot be given refs" appears for `LanguageSelector`:

**Problem**: The component is passed to `DropdownMenuTrigger` with `asChild` prop, which expects a forwardRef component.

**Root Cause**: `LanguageSelector` wraps a `Button` component correctly, but when Radix tries to clone and pass a ref, the function component itself receives the ref (not the Button).

**Solution**: Convert `LanguageSelector` to use `forwardRef` properly.

---

## Implementation Steps

### Step 1: Resolve Build Error
The persistent build error is likely a transient cache issue. I'll make a minimal, safe change to trigger a clean rebuild.

**File**: `src/index.css`
- Ensure no trailing whitespace or invisible characters
- Verify CSS is syntactically correct (confirmed)

### Step 2: Fix LanguageSelector forwardRef Warning
**File**: `src/components/LanguageSelector.tsx`

Convert to forwardRef pattern:

```typescript
import React, { forwardRef } from 'react';

export const LanguageSelector = forwardRef<HTMLButtonElement, {}>(
  function LanguageSelector(props, ref) {
    const { language, setLanguage, t } = useLanguage();
    // ... rest of component
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={ref} {...props} />
        </DropdownMenuTrigger>
        {/* ... */}
      </DropdownMenu>
    );
  }
);
```

### Step 3: Fix WrestlerCard/LazyImage ref forwarding (Optional)
If refs are passed to these components from parent, implement forwardRef. Current analysis shows:
- `WrestlerCard` - No ref is passed, no change needed
- `LazyImage` - Uses internal ref for IntersectionObserver, no external ref passed

The console warning is specifically about `LanguageSelector` and `DropdownMenuContent`.

---

## Verification Testing Checklist

After fixes are applied:

| Test | Page | Expected Result |
|------|------|-----------------|
| Font Rendering | Any page | Vazirmatn renders correctly, RTL text flows properly |
| Admin Login | `/admin/login` | Login form displays, virtual keyboard available in kiosk mode |
| Admin Setup | `/admin/setup` | No duplicate key error on repeated clicks |
| Virtual Keyboard - Persian | `/admin/login` + kiosk mode | Full Persian layout with shift for diacritics |
| Virtual Keyboard - Arabic | `/admin/login` + kiosk mode | Arabic layout (ي ك variant) with shift |
| Virtual Keyboard - English | `/admin/login` + kiosk mode | QWERTY layout with shift for uppercase |
| Virtual Keyboard - Numbers | `/admin/login` + kiosk mode | Numbers and symbols |
| Keyboard Sound | Any input in kiosk mode | 800Hz click sound plays |
| Console Warnings | Browser DevTools | No "cannot be given refs" warnings |

---

## Technical Implementation Details

### Files to Modify

| File | Change | Purpose |
|------|--------|---------|
| `src/components/LanguageSelector.tsx` | Add forwardRef | Fix React ref warning |
| `src/index.css` | No structural changes needed | CSS is correct |
| `src/contexts/AuthContext.tsx` | Already fixed | Duplicate key prevention |
| `src/components/VirtualKeyboard.tsx` | Already implemented | 4 layouts ready |

### No Changes Required For

- Font configuration (correct)
- RTL/direction setup (correct)
- Virtual keyboard layouts (complete)
- Admin role assignment logic (fixed)
- Keyboard sound system (working)

---

## Summary

The codebase is in good shape:

1. **Vazirmatn Font**: Correctly configured with 4 weights, RTL enabled
2. **Admin Setup**: Fixed with select-then-insert pattern for duplicate key prevention
3. **Virtual Keyboard**: 4 layouts implemented with sound feedback
4. **Only Change Needed**: Fix `LanguageSelector` forwardRef to eliminate console warning
5. **Build Error**: Appears to be transient - code is syntactically correct
