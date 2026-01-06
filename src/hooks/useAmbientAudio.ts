import { useState, useEffect, useRef, useCallback } from 'react';

// Web Audio API for generating ambient museum sounds
export function useAmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isInitializedRef = useRef(false);

  // Create ambient drone sound
  const createAmbientSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume * 0.15;
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Deep drone frequencies for epic atmosphere
    const frequencies = [
      { freq: 55, type: 'sine' as OscillatorType, gain: 0.3 },      // A1 - deep bass
      { freq: 82.41, type: 'sine' as OscillatorType, gain: 0.25 },  // E2
      { freq: 110, type: 'sine' as OscillatorType, gain: 0.2 },     // A2
      { freq: 146.83, type: 'triangle' as OscillatorType, gain: 0.1 }, // D3
      { freq: 220, type: 'sine' as OscillatorType, gain: 0.08 },    // A3 - harmonic
    ];

    const oscillators: OscillatorNode[] = [];

    frequencies.forEach(({ freq, type, gain: oscGain }) => {
      const osc = ctx.createOscillator();
      const oscGainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      // Add subtle pitch modulation for organic feel
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + Math.random() * 0.1; // Very slow modulation
      lfoGain.gain.value = freq * 0.003; // Very subtle
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      
      oscGainNode.gain.value = oscGain;
      osc.connect(oscGainNode);
      oscGainNode.connect(masterGain);
      
      osc.start();
      oscillators.push(osc);
    });

    // Add filtered noise for texture
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 200;
    noiseFilter.Q.value = 1;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();

    oscillatorsRef.current = oscillators;
  }, [volume]);

  const start = useCallback(() => {
    if (isInitializedRef.current && audioContextRef.current?.state === 'running') {
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (!isInitializedRef.current) {
        createAmbientSound();
        isInitializedRef.current = true;
      }

      setIsPlaying(true);
      localStorage.setItem('museum-audio-playing', 'true');
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  }, [createAmbientSound]);

  const stop = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
    setIsPlaying(false);
    localStorage.setItem('museum-audio-playing', 'false');
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume * 0.15;
    }
    localStorage.setItem('museum-audio-volume', String(newVolume));
  }, []);

  // Load saved preferences
  useEffect(() => {
    const savedVolume = localStorage.getItem('museum-audio-volume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    volume,
    toggle,
    start,
    stop,
    updateVolume,
  };
}
