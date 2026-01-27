import React, { memo } from 'react';
import { X, Delete, CornerDownLeft, Globe, Hash, ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VirtualKeyboardProps {
  isOpen: boolean;
  layout: 'persian' | 'english' | 'numbers';
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onLayoutChange: (layout: 'persian' | 'english' | 'numbers') => void;
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

  if (!isOpen) return null;

  const getKeys = () => {
    switch (layout) {
      case 'persian':
        return isShift ? PERSIAN_KEYS_SHIFT : PERSIAN_KEYS;
      case 'english':
        return isShift ? ENGLISH_KEYS_SHIFT : ENGLISH_KEYS;
      case 'numbers':
        return NUMBER_KEYS;
    }
  };

  const keys = getKeys();

  const handleKeyPress = (key: string) => {
    onKeyPress(key);
    if (isShift && layout !== 'numbers') {
      setIsShift(false);
    }
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
        'h-12 sm:h-14 rounded-xl font-medium text-lg transition-all duration-150',
        'bg-card/80 hover:bg-card border border-gold/20 hover:border-gold/40',
        'active:scale-95 active:bg-gold/20 shadow-lg',
        'flex items-center justify-center gap-1',
        wide ? 'min-w-[80px] px-4' : 'w-10 sm:w-12',
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
        'p-3 sm:p-4 shadow-2xl',
        'animate-slide-up'
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <KeyButton
            onClick={() => onLayoutChange('persian')}
            wide
            className={layout === 'persian' ? 'bg-gold/30 border-gold' : ''}
          >
            فارسی
          </KeyButton>
          <KeyButton
            onClick={() => onLayoutChange('english')}
            wide
            className={layout === 'english' ? 'bg-gold/30 border-gold' : ''}
          >
            EN
          </KeyButton>
          <KeyButton
            onClick={() => onLayoutChange('numbers')}
            className={layout === 'numbers' ? 'bg-gold/30 border-gold' : ''}
            icon={<Hash className="w-5 h-5" />}
          />
        </div>
        <KeyButton onClick={onClose} icon={<X className="w-5 h-5" />} />
      </div>

      {/* Keys */}
      <div className="flex flex-col gap-2 items-center">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 sm:gap-2 justify-center">
            {row.map((key) => (
              <KeyButton key={key} onClick={() => handleKeyPress(key)}>
                {key}
              </KeyButton>
            ))}
          </div>
        ))}

        {/* Bottom row */}
        <div className="flex gap-2 justify-center mt-1">
          {layout !== 'numbers' && (
            <KeyButton
              onClick={() => setIsShift(!isShift)}
              wide
              className={isShift ? 'bg-gold/30 border-gold' : ''}
              icon={<ArrowBigUp className="w-5 h-5" />}
            />
          )}
          <KeyButton onClick={() => handleKeyPress(' ')} className="!w-32 sm:!w-48">
            فاصله
          </KeyButton>
          <KeyButton onClick={onDelete} wide icon={<Delete className="w-5 h-5" />} />
          <KeyButton
            onClick={onSubmit}
            wide
            className="bg-gold/30 border-gold hover:bg-gold/50"
            icon={<CornerDownLeft className="w-5 h-5" />}
          >
            ارسال
          </KeyButton>
        </div>
      </div>
    </div>
  );
});

export default VirtualKeyboard;
