// Open kiosk mode: no auth gate. Pass-through wrapper kept for backwards compatibility.
import React from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
