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
    setIsVisible(false);
    setDisplayChildren(children);
    
    // Minimal delay for animation trigger
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(showTimer);
  }, [location.pathname, children]);

  return (
    <div
      className={`
        w-full h-full transition-opacity duration-200 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {displayChildren}
    </div>
  );
}
