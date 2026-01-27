import { useRef, useCallback } from 'react';

export function useKeyboardSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playClick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Resume context if suspended (required for autoplay policies)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create oscillator for click sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Configure sound: 800Hz sine wave
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);

      // Configure volume envelope: quick attack, fast decay
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Play sound
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (error) {
      // Silently fail if audio is not available
      console.debug('Audio click failed:', error);
    }
  }, [getAudioContext]);

  return { playClick };
}
