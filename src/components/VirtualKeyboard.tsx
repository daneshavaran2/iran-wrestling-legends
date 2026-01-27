import React, { memo } from 'react';
import { X, Delete, CornerDownLeft, Hash, ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardSound } from '@/hooks/useKeyboardSound';
import type { KeyboardLayout } from '@/types/keyboard';

interface VirtualKeyboardProps {
  isOpen: boolean;
  layout: KeyboardLayout;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onLayoutChange: (layout: KeyboardLayout) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const PERSIAN_KEYS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
  ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'چ'],
];

const PERSIAN_KEYS_SHIFT = [
  ['ً', 'ٌ', 'ٍ', 'ریال', 'ؤ', 'إ', 'أ', 'ء', 'ة', 'ژ', 'آ'],
  ['َ', 'ُ', 'ِ', 'ـ', 'ٔ', 'آ', 'ة', '»', '«', ':', '؛'],
  ['ّ', 'ْ', '،', '.', '؟', '!', '٪', '÷', '×'],
];

const ARABIC_KEYS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ'],
];

const ARABIC_KEYS_SHIFT = [
  ['ً', 'ٌ', 'ٍ', 'ّ', 'َ', 'ُ', 'ِ', 'ْ', 'آ', 'أ', 'إ'],
  ['ذ', 'ـ', '»', '«', '،', '؟', '!', '؛', ':', 'ذ', 'د'],
  ['ۀ', '"', "'", '.', '٪', '×', '÷', '-', '+'],
];

const ENGLISH_KEYS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const ENGLISH_KEYS_SHIFT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const NUMBER_KEYS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'],
  ['!', '"', "'", ':', ';', '/', '?', ',', '.'],
];

const VirtualKeyboard = memo(function VirtualKeyboard({
  isOpen,
  layout,
  onKeyPress,
  onDelete,
  onLayoutChange,
  onClose,
  onSubmit,
}: VirtualKeyboardProps) {
  const [isShift, setIsShift] = React.useState(false);
  const { playClick } = useKeyboardSound();

  if (!isOpen) return null;

  const getKeys = () => {
    switch (layout) {
      case 'persian':
        return isShift ? PERSIAN_KEYS_SHIFT : PERSIAN_KEYS;
      case 'arabic':
        return isShift ? ARABIC_KEYS_SHIFT : ARABIC_KEYS;
      case 'english':
        return isShift ? ENGLISH_KEYS_SHIFT : ENGLISH_KEYS;
      case 'numbers':
        return NUMBER_KEYS;
    }
  };

  const keys = getKeys();

  const handleKeyPress = (key: string) => {
    playClick();
    onKeyPress(key);
    if (isShift && layout !== 'numbers') {
      setIsShift(false);
    }
  };

  const handleAction = (action: () => void) => {
    playClick();
    action();
  };

  const KeyButton = ({ children, className, onClick, wide, icon }: {
    children?: React.ReactNode;
    className?: string;
    onClick: () => void;
    wide?: boolean;
    icon?: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        // Optimized sizes for 55" kiosk displays
        'h-14 md:h-16 lg:h-20 rounded-xl font-medium text-xl lg:text-2xl transition-all duration-150',
        'bg-card/80 hover:bg-card border border-gold/20 hover:border-gold/40',
        'active:scale-95 active:bg-gold/20 shadow-lg',
        'flex items-center justify-center gap-1',
        wide ? 'min-w-[100px] lg:min-w-[130px] px-4' : 'w-12 md:w-14 lg:w-16',
        className
      )}
    >
      {icon}
      {children}
    </button>
  );

  return (
    <div
      id="virtual-keyboard"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[9999]',
        'bg-background/95 backdrop-blur-xl border-t border-gold/30',
        'p-4 md:p-6 lg:p-8 shadow-2xl',
        'animate-slide-up'
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex gap-2 md:gap-3 lg:gap-4">
          <KeyButton
            onClick={() => handleAction(() => onLayoutChange('persian'))}
            wide
            className={layout === 'persian' ? 'bg-gold/30 border-gold' : ''}
          >
            فارسی
          </KeyButton>
          <KeyButton
            onClick={() => handleAction(() => onLayoutChange('arabic'))}
            wide
            className={layout === 'arabic' ? 'bg-gold/30 border-gold' : ''}
          >
            عربی
          </KeyButton>
          <KeyButton
            onClick={() => handleAction(() => onLayoutChange('english'))}
            wide
            className={layout === 'english' ? 'bg-gold/30 border-gold' : ''}
          >
            EN
          </KeyButton>
          <KeyButton
            onClick={() => handleAction(() => onLayoutChange('numbers'))}
            className={layout === 'numbers' ? 'bg-gold/30 border-gold' : ''}
            icon={<Hash className="w-5 h-5 lg:w-6 lg:h-6" />}
          />
        </div>
        <KeyButton onClick={() => handleAction(onClose)} icon={<X className="w-5 h-5 lg:w-6 lg:h-6" />} />
      </div>

      {/* Keys */}
      <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 items-center">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 md:gap-3 lg:gap-4 justify-center">
            {row.map((key) => (
              <KeyButton key={key} onClick={() => handleKeyPress(key)}>
                {key}
              </KeyButton>
            ))}
          </div>
        ))}

        {/* Bottom row */}
        <div className="flex gap-2 md:gap-3 lg:gap-4 justify-center mt-1">
          {layout !== 'numbers' && (
            <KeyButton
              onClick={() => handleAction(() => setIsShift(!isShift))}
              wide
              className={isShift ? 'bg-gold/30 border-gold' : ''}
              icon={<ArrowBigUp className="w-5 h-5 lg:w-6 lg:h-6" />}
            />
          )}
          <KeyButton 
            onClick={() => handleKeyPress(' ')} 
            className="!w-32 sm:!w-48 md:!w-56 lg:!w-64"
          >
            فاصله
          </KeyButton>
          <KeyButton 
            onClick={() => handleAction(onDelete)} 
            wide 
            icon={<Delete className="w-5 h-5 lg:w-6 lg:h-6" />} 
          />
          <KeyButton
            onClick={() => handleAction(onSubmit)}
            wide
            className="bg-gold/30 border-gold hover:bg-gold/50"
            icon={<CornerDownLeft className="w-5 h-5 lg:w-6 lg:h-6" />}
          >
            ارسال
          </KeyButton>
        </div>
      </div>
    </div>
  );
});

export default VirtualKeyboard;
