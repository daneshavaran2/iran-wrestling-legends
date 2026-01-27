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
