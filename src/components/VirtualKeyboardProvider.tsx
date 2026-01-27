import React, { createContext, useContext, ReactNode } from 'react';
import VirtualKeyboard from './VirtualKeyboard';
import type { KeyboardLayout } from '@/types/keyboard';
import { useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';

interface VirtualKeyboardContextType {
  isOpen: boolean;
  layout: KeyboardLayout;
  closeKeyboard: () => void;
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | null>(null);

export function useVirtualKeyboardContext() {
  return useContext(VirtualKeyboardContext);
}

interface VirtualKeyboardProviderProps {
  children: ReactNode;
}

export function VirtualKeyboardProvider({ children }: VirtualKeyboardProviderProps) {
  const {
    isOpen,
    layout,
    insertText,
    deleteText,
    setLayout,
    closeKeyboard,
    submitInput,
  } = useVirtualKeyboard();

  return (
    <VirtualKeyboardContext.Provider value={{ isOpen, layout, closeKeyboard }}>
      {children}
      <VirtualKeyboard
        isOpen={isOpen}
        layout={layout}
        onKeyPress={insertText}
        onDelete={deleteText}
        onLayoutChange={setLayout}
        onClose={closeKeyboard}
        onSubmit={submitInput}
      />
    </VirtualKeyboardContext.Provider>
  );
}
