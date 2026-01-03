import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const IDLE_TIMEOUT = 90 * 1000; // 90 seconds

export function useKioskMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenTriggeredRef = useRef(false);

  // Auto fullscreen on first user interaction
  const enterFullscreen = useCallback(() => {
    if (fullscreenTriggeredRef.current) return;
    if (location.pathname.startsWith('/admin')) return;
    
    fullscreenTriggeredRef.current = true;
    
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Fullscreen request failed:', err);
      });
    }
  }, [location.pathname]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't apply kiosk mode to admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      // Only navigate if not on home page
      if (location.pathname !== '/') {
        navigate('/');
      }
    }, IDLE_TIMEOUT);
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Don't apply kiosk restrictions to admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      enterFullscreen();
      resetTimer();
    };

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        return false;
      }
      handleActivity();
    };

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Add kiosk security listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Add kiosk-mode class to body for CSS restrictions
    document.body.classList.add('kiosk-mode');

    resetTimer();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('kiosk-mode');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer, location.pathname]);

  return { resetTimer };
}
