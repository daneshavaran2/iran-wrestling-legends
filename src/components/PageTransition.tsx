import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start enter animation
    setIsVisible(false);
    
    // Small delay to ensure the animation triggers
    const showTimer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(showTimer);
  }, [location.pathname, children]);

  return (
    <div
      className={`
        w-full h-full transition-all duration-500 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-[0.99]'
        }
      `}
    >
      {displayChildren}
    </div>
  );
}
