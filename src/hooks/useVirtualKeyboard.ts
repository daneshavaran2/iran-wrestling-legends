import { useState, useCallback, useEffect, useRef } from 'react';

interface VirtualKeyboardState {
  isOpen: boolean;
  targetInput: HTMLInputElement | HTMLTextAreaElement | null;
  layout: 'persian' | 'english' | 'numbers';
}

export function useVirtualKeyboard() {
  const [state, setState] = useState<VirtualKeyboardState>({
    isOpen: false,
    targetInput: null,
    layout: 'persian',
  });
  
  const isKioskMode = useRef(false);

  // Check if kiosk mode is active
  useEffect(() => {
    const checkKioskMode = () => {
      isKioskMode.current = document.body.classList.contains('kiosk-mode');
    };
    
    checkKioskMode();
    
    const observer = new MutationObserver(checkKioskMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Listen for focus events on inputs
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (!isKioskMode.current) return;
      
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement || 
        target instanceof HTMLTextAreaElement
      ) {
        // Skip password fields for security - use native keyboard
        if (target.type === 'password') return;
        
        setState(prev => ({
          ...prev,
          isOpen: true,
          targetInput: target,
        }));
      }
    };

    const handleBlur = (e: FocusEvent) => {
      // Delay to allow button clicks on keyboard
      setTimeout(() => {
        const activeElement = document.activeElement;
        const keyboard = document.getElementById('virtual-keyboard');
        
        if (keyboard?.contains(activeElement)) {
          // Keep keyboard open if clicking on keyboard
          return;
        }
        
        if (
          !(activeElement instanceof HTMLInputElement) && 
          !(activeElement instanceof HTMLTextAreaElement)
        ) {
          setState(prev => ({
            ...prev,
            isOpen: false,
            targetInput: null,
          }));
        }
      }, 100);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const insertText = useCallback((text: string) => {
    const input = state.targetInput;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const currentValue = input.value;

    const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
    
    // Trigger React's onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, newValue);
    }

    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);

    // Update cursor position
    const newPosition = start + text.length;
    requestAnimationFrame(() => {
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });
  }, [state.targetInput]);

  const deleteText = useCallback(() => {
    const input = state.targetInput;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const currentValue = input.value;

    let newValue: string;
    let newPosition: number;

    if (start !== end) {
      // Delete selected text
      newValue = currentValue.slice(0, start) + currentValue.slice(end);
      newPosition = start;
    } else if (start > 0) {
      // Delete one character before cursor
      newValue = currentValue.slice(0, start - 1) + currentValue.slice(start);
      newPosition = start - 1;
    } else {
      return;
    }

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, newValue);
    }

    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);

    requestAnimationFrame(() => {
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });
  }, [state.targetInput]);

  const setLayout = useCallback((layout: 'persian' | 'english' | 'numbers') => {
    setState(prev => ({ ...prev, layout }));
  }, []);

  const closeKeyboard = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, targetInput: null }));
  }, []);

  const submitInput = useCallback(() => {
    const input = state.targetInput;
    if (!input) return;

    // Trigger Enter key
    const enterEvent = new KeyboardEvent('keypress', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
    });
    input.dispatchEvent(enterEvent);

    // Also try form submission
    const form = input.closest('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }

    closeKeyboard();
  }, [state.targetInput, closeKeyboard]);

  return {
    isOpen: state.isOpen,
    layout: state.layout,
    insertText,
    deleteText,
    setLayout,
    closeKeyboard,
    submitInput,
  };
}
