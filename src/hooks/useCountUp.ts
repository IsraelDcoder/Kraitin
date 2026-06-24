import { useEffect, useRef, useState } from 'react';

interface CountUpOptions {
  start?: number;
  end: number;
  duration?: number;    // ms
  delay?: number;       // ms before starting
  decimals?: number;
}

/**
 * Animates a number from `start` to `end` over `duration` ms.
 * Re-runs whenever `end` changes.
 */
export function useCountUp({ start = 0, end, duration = 900, delay = 0, decimals = 0 }: CountUpOptions) {
  const [value, setValue] = useState(start);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      const startVal = start;
      const range = end - startVal;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startVal + range * eased;
        setValue(parseFloat(current.toFixed(decimals)));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setValue(end);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [end, start, duration, delay, decimals]);

  return value;
}
