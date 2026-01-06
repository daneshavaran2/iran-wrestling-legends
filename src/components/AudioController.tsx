import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';

export function AudioController() {
  const { isPlaying, volume, toggle, updateVolume } = useAmbientAudio();
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div 
      className="fixed top-3 left-3 z-50 flex items-center gap-2"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* Volume Slider */}
      <div 
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${showVolume && isPlaying ? 'w-24 opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <div className="cyber-glass rounded-2xl px-3 py-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => updateVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-primary cursor-pointer"
            dir="ltr"
          />
        </div>
      </div>

      {/* Audio Toggle Button */}
      <button
        onClick={toggle}
        className={`
          cyber-button flex items-center justify-center
          w-11 h-11 md:w-12 md:h-12 rounded-2xl
          transition-all duration-300
          ${isPlaying 
            ? 'ring-2 ring-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)]' 
            : 'opacity-70 hover:opacity-100'
          }
        `}
        title={isPlaying ? 'قطع صدا' : 'پخش موسیقی'}
      >
        {isPlaying ? (
          <Volume2 className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
        ) : (
          <VolumeX className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </button>
    </div>
  );
}
