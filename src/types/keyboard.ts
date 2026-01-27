/**
 * Keyboard layout types for virtual keyboard
 */
export const keyboardLayouts = [
  'persian',
  'english',
  'arabic',
  'numbers',
] as const;

export type KeyboardLayout = (typeof keyboardLayouts)[number];
