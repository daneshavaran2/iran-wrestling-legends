

# Fix Persistent Preview Generation Error

## Root Cause Analysis

The persistent "An error occurred when trying to generate preview" error is caused by:

1. **Duplicate Type Declaration**: According to the user's input, `src/types/keyboard.ts` contains TWO declarations of `KeyboardLayout`:
   ```typescript
   export type KeyboardLayout = typeof keyboardLayouts[number];
   export type KeyboardLayout = (typeof keyboardLayouts)[number];
   ```
   TypeScript does not allow redeclaring the same type in the same scope.

2. **Build Cache Corruption**: Despite previous fixes appearing correct, the Vite bundler may be caching a corrupted module state.

## Solution

Perform a complete rewrite of `src/types/keyboard.ts` with:
- Single, unambiguous type declaration
- Clear documentation
- Explicit `as const` pattern preserved

### File: `src/types/keyboard.ts`

Replace entire content with:

```typescript
/**
 * Virtual keyboard layout types for kiosk mode
 * Supports: Persian, English, Arabic, and Numbers
 */

export const keyboardLayouts = [
  'persian',
  'english',
  'arabic',
  'numbers',
] as const;

export type KeyboardLayout = typeof keyboardLayouts[number];
```

## Why This Fix Works

| Issue | Resolution |
|-------|------------|
| Duplicate type declaration | Single `KeyboardLayout` export only |
| Build cache stale | Complete file rewrite forces recompilation |
| Type inference preserved | `typeof keyboardLayouts[number]` creates `'persian' \| 'english' \| 'arabic' \| 'numbers'` |
| Future scalability | Adding layouts only requires updating the array |

## Verification Checklist

| Component | Import Path | Status |
|-----------|-------------|--------|
| `VirtualKeyboard.tsx` | `import type { KeyboardLayout } from '@/types/keyboard'` | Will compile |
| `VirtualKeyboardProvider.tsx` | `import type { KeyboardLayout } from '@/types/keyboard'` | Will compile |
| `useVirtualKeyboard.ts` | `import type { KeyboardLayout } from '@/types/keyboard'` | Will compile |
| `useKeyboardSound.ts` | No KeyboardLayout import needed | Unaffected |

## Files to Modify

| File | Action |
|------|--------|
| `src/types/keyboard.ts` | Complete rewrite (remove duplicate declaration) |

## Technical Notes

The `as const` assertion creates a readonly tuple:
```text
keyboardLayouts → readonly ['persian', 'english', 'arabic', 'numbers']
```

The derived type becomes a union:
```text
KeyboardLayout → 'persian' | 'english' | 'arabic' | 'numbers'
```

This is identical to the original intent but with a single source of truth.

## Impact Assessment

- **Virtual Keyboard Rendering**: No impact - component uses same type signature
- **Kiosk Mode Behavior**: No impact - keyboard detection unchanged  
- **Audio Feedback**: No impact - `useKeyboardSound` has no type dependencies
- **AI Assistant**: No impact - language detection (fa/ar/en) is separate from keyboard layouts

