import { useState, useEffect } from 'react';

interface NetworkCondition {
  type: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  effectiveType: string;
  downlink: number;
  rtt: number;
  isOnline: boolean;
}

// Extend Navigator type for Network Information API
interface NetworkInformation {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export function useNetworkCondition(): NetworkCondition {
  const [condition, setCondition] = useState<NetworkCondition>({
    type: navigator.onLine ? 'good' : 'offline',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const updateCondition = () => {
      if (!navigator.onLine) {
        setCondition({
          type: 'offline',
          effectiveType: 'none',
          downlink: 0,
          rtt: 0,
          isOnline: false,
        });
        return;
      }
      
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      if (connection) {
        let type: NetworkCondition['type'];
        
        switch (connection.effectiveType) {
          case '4g':
            type = connection.rtt < 100 ? 'excellent' : 'good';
            break;
          case '3g':
            type = 'fair';
            break;
          case '2g':
          case 'slow-2g':
            type = 'poor';
            break;
          default:
            type = 'good';
        }
        
        setCondition({
          type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          isOnline: true,
        });
      } else {
        // Fallback when Network Information API is not available
        setCondition(prev => ({
          ...prev,
          type: 'good',
          isOnline: true,
        }));
      }
    };

    updateCondition();
    
    // Listen for online/offline events
    window.addEventListener('online', updateCondition);
    window.addEventListener('offline', updateCondition);
    
    // Listen for connection change events
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateCondition);
    }
    
    return () => {
      window.removeEventListener('online', updateCondition);
      window.removeEventListener('offline', updateCondition);
      
      if (connection) {
        connection.removeEventListener('change', updateCondition);
      }
    };
  }, []);

  return condition;
}

// Helper to get network quality label in Persian
export function getNetworkQualityLabel(type: NetworkCondition['type']): string {
  switch (type) {
    case 'excellent': return 'عالی';
    case 'good': return 'خوب';
    case 'fair': return 'متوسط';
    case 'poor': return 'ضعیف';
    case 'offline': return 'آفلاین';
  }
}

// Helper to get network quality color class
export function getNetworkQualityColor(type: NetworkCondition['type']): string {
  switch (type) {
    case 'excellent': return 'text-green-500';
    case 'good': return 'text-emerald-500';
    case 'fair': return 'text-amber-500';
    case 'poor': return 'text-orange-500';
    case 'offline': return 'text-red-500';
  }
}
