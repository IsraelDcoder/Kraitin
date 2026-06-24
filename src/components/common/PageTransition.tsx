import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wraps page content in a fade+slide-up entrance animation.
 * Re-triggers whenever the route changes (keyed by pathname).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  // Use a stable key that changes per navigation so React remounts and replays the animation.
  const key = location.pathname;
  const counterRef = useRef(0);
  counterRef.current += 1;

  return (
    <div key={key} className="page-enter min-h-full">
      {children}
    </div>
  );
}
