import { useState, useCallback, useRef } from 'react';

interface ParallaxState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

export function useParallax(intensity: number = 15) {
  const [transform, setTransform] = useState<ParallaxState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateY = ((clientX - centerX) / (rect.width / 2)) * intensity;
    const rotateX = ((centerY - clientY) / (rect.height / 2)) * intensity;

    setTransform({
      rotateX: Math.max(-intensity, Math.min(intensity, rotateX)),
      rotateY: Math.max(-intensity, Math.min(intensity, rotateY)),
      scale: 1.02,
    });
  }, [intensity]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  const style: React.CSSProperties = {
    transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
    transition: 'transform 0.15s ease-out',
    transformStyle: 'preserve-3d',
  };

  return {
    ref,
    style,
    handlers: {
      onTouchMove: handleTouchMove,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleLeave,
      onTouchEnd: handleLeave,
    },
  };
}
