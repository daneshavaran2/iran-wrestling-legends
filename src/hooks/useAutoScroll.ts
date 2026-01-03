import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoScrollOptions {
  speed?: number; // pixels per second
  pauseOnInteraction?: boolean;
  resumeDelay?: number; // ms to wait before resuming after interaction
  enabled?: boolean;
}

export const useAutoScroll = ({
  speed = 40,
  pauseOnInteraction = true,
  resumeDelay = 3000,
  enabled = true,
}: UseAutoScrollOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if content overflows
  const checkOverflow = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const overflow = container.scrollHeight > container.clientHeight + 10;
      setHasOverflow(overflow);
    }
  }, []);

  // Scroll animation
  const animate = useCallback((currentTime: number) => {
    if (!containerRef.current || isPaused || !enabled || !hasOverflow) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    const container = containerRef.current;
    const scrollAmount = speed * deltaTime;
    
    container.scrollTop += scrollAmount;

    // Reset to top when reaching end
    if (container.scrollTop >= container.scrollHeight - container.clientHeight - 5) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }, 2000); // Wait 2 seconds at bottom before resetting
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [speed, isPaused, enabled, hasOverflow]);

  // Handle user interaction
  const handleInteraction = useCallback(() => {
    if (!pauseOnInteraction) return;

    setIsPaused(true);
    
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, resumeDelay);
  }, [pauseOnInteraction, resumeDelay]);

  // Setup
  useEffect(() => {
    checkOverflow();
    
    // Recheck on resize
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [checkOverflow]);

  // Start animation
  useEffect(() => {
    if (enabled && hasOverflow) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, enabled, hasOverflow]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pauseOnInteraction) return;

    const events = ['touchstart', 'mousedown', 'wheel', 'scroll'];
    events.forEach(event => {
      container.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        container.removeEventListener(event, handleInteraction);
      });
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [handleInteraction, pauseOnInteraction]);

  return {
    containerRef,
    isPaused,
    hasOverflow,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
  };
};
