

# Comprehensive Fix Plan for Build Error, Admin Setup, and Font Issues

## Current Status Analysis

| Issue | Root Cause | Status |
|-------|------------|--------|
| Preview Generation Error | Likely transient build cache issue | Under investigation |
| Admin Setup Duplicate Key | `makeAdmin()` uses INSERT without checking if role exists | Confirmed |
| Font Loading | Fonts are correctly configured | Working |
| Virtual Keyboard Types | Fixed - single type declaration | Fixed |

---

## Part 1: Fix Admin Setup Duplicate Key Error (BUG 1)

### Problem
The `makeAdmin()` function in `AuthContext.tsx` performs a direct INSERT without checking if the role already exists:

```typescript
// Current problematic code (lines 168-174)
const { error } = await supabase
  .from('user_roles')
  .insert({
    user_id: user.id,
    role: 'admin',
  });
```

This causes `duplicate key value violates unique constraint "user_roles_user_id_role_key"` error on repeated attempts.

### Solution

**File: `src/contexts/AuthContext.tsx`**

Replace the `makeAdmin` function with a safe upsert pattern:

```typescript
const makeAdmin = async () => {
  if (!user) {
    return { error: new Error('کاربر وارد نشده است') };
  }

  try {
    // First check if role already exists
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing role:', checkError);
      return { error: new Error('خطا در بررسی نقش کاربر') };
    }

    // If role already exists, just return success
    if (existingRole) {
      setIsAdmin(true);
      setHasAnyAdmin(true);
      return { error: null };
    }

    // Insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin',
      });

    if (insertError) {
      // Handle duplicate key gracefully
      if (insertError.code === '23505') {
        setIsAdmin(true);
        setHasAnyAdmin(true);
        return { error: null };
      }
      console.error('Error making admin:', insertError);
      return { error: new Error('خطا در ایجاد نقش مدیر') };
    }

    setIsAdmin(true);
    setHasAnyAdmin(true);
    return { error: null };
  } catch (err) {
    return { error: new Error('خطای غیرمنتظره در سیستم') };
  }
};
```

### Additional UI Improvements for `AdminSetupPage.tsx`

1. Add double-click prevention with button disabled state
2. Show user-friendly messages instead of raw Postgres errors
3. Handle the "already admin" case gracefully

---

## Part 2: Fix Preview Build Error (CRITICAL)

### Problem
The error "An error occurred when trying to generate preview" is a generic build failure. Based on my analysis:

- `src/types/keyboard.ts` is now correct (single type declaration)
- `src/index.css` structure is valid
- Font files exist in `public/fonts/`

### Solution

The `/* Build trigger */` comment added to `index.css` may be causing the issue if there's trailing content or invisible characters. Let me propose a clean rebuild:

**File: `src/index.css`** - Remove the trigger comment and ensure clean file start:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Vazirmatn Local Font */
@font-face {
  font-family: 'Vazirmatn';
  src: url('/fonts/Vazirmatn-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
/* ... rest of file unchanged ... */
```

---

## Part 3: Verify Font Configuration (No Changes Needed)

### Current Status: WORKING

The fonts are correctly configured:

| File | Location | Status |
|------|----------|--------|
| `Vazirmatn-Light.woff2` | `public/fonts/` | Present |
| `Vazirmatn-Regular.woff2` | `public/fonts/` | Present |
| `Vazirmatn-Medium.woff2` | `public/fonts/` | Present |
| `Vazirmatn-Bold.woff2` | `public/fonts/` | Present |

**Note**: This is a Vite + React project, NOT Next.js. The `next/font/local` approach from your prompt is not applicable here. The current `@font-face` declarations in `src/index.css` are the correct approach for Vite.

### Verification in index.css (lines 7-37)
```css
@font-face {
  font-family: 'Vazirmatn';
  src: url('/fonts/Vazirmatn-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
/* ... 3 more weights defined ... */
```

### Verification in tailwind.config.ts (line 17)
```typescript
fontFamily: {
  vazir: ['Vazirmatn', 'system-ui', 'sans-serif'],
},
```

### Verification in index.css (line 148)
```css
html {
  direction: rtl;
  font-family: 'Vazirmatn', system-ui, sans-serif;
}
```

---

## Part 4: Fix React Ref Warnings (Optional)

If there are ref warnings appearing in WrestlerCard and LazyImage, we need to:

1. Use `forwardRef` for components that receive refs
2. Pass refs correctly through component hierarchies

---

## Implementation Order

| Step | File | Action |
|------|------|--------|
| 1 | `src/index.css` | Remove `/* Build trigger */` comment (line 4) |
| 2 | `src/contexts/AuthContext.tsx` | Replace `makeAdmin()` with safe check-then-insert pattern |
| 3 | `src/pages/admin/AdminSetupPage.tsx` | Add better error handling and user-friendly messages |
| 4 | Test | Verify build succeeds and admin setup works |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Remove line 4 comment |
| `src/contexts/AuthContext.tsx` | Replace `makeAdmin` function (lines 163-186) |
| `src/pages/admin/AdminSetupPage.tsx` | Better error messages and button state |

---

## Testing Checklist

After implementation:

- [ ] Preview builds successfully
- [ ] Navigate to `/admin/login` - virtual keyboard appears
- [ ] Test all 4 keyboard layouts (Persian, Arabic, English, Numbers)
- [ ] Sign up and navigate to `/admin/setup`
- [ ] Click "فعال‌سازی مدیریت" - should succeed
- [ ] Click again - should NOT show duplicate key error
- [ ] Verify Vazirmatn font renders correctly in RTL
- [ ] Check console for ref warnings

