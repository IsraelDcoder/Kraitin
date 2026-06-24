import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  /** Prefix shown before the number, e.g. "$" */
  prefix?: string;
  /** Suffix shown after the number, e.g. "%" */
  suffix?: string;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Animation duration in ms. Default 900. */
  duration?: number;
  /** Delay before animation starts (ms). Default 0. */
  delay?: number;
  className?: string;
  /** When true, displays "—" and skips animation */
  loading?: boolean;
}

/**
 * Displays a number with a smooth count-up animation whenever the value changes.
 * Wraps in a `num-pop` entrance animation as well.
 */
export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 900,
  delay = 0,
  className,
  loading = false,
}: AnimatedNumberProps) {
  const animated = useCountUp({ end: value, decimals, duration, delay });

  if (loading) {
    return <span className={cn('inline-block h-5 w-16 rounded skeleton-shimmer', className)} />;
  }

  return (
    <span className={cn('num-pop inline-block tabular-nums', className)}>
      {prefix}{animated.toLocaleString()}{suffix}
    </span>
  );
}
