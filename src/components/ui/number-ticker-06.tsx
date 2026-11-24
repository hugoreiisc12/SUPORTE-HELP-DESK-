import { useEffect, useState } from 'react';
import NumberFlow, { type Value } from '@number-flow/react';

export type NumberTickerProps = {
  value: Value;
  decimals?: number;
  minimumIntegerDigits?: number;
  animateOnMount?: boolean;
  className?: string;
};

export function NumberTicker({
  value,
  decimals = 0,
  minimumIntegerDigits = 1,
  animateOnMount = true,
  className,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState<Value>(() =>
    animateOnMount ? 0 : value
  );

  useEffect(() => {
    if (!animateOnMount) {
      setDisplayValue(value);
      return;
    }

    const timer = window.setTimeout(() => {
      setDisplayValue(value);
    }, 90);

    return () => window.clearTimeout(timer);
  }, [value, animateOnMount]);

  return (
    <NumberFlow
      value={displayValue}
      format={{
        notation: 'standard',
        compactDisplay: 'short',
        minimumIntegerDigits,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }}
      transformTiming={{ duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      spinTiming={{ duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      opacityTiming={{ duration: 350, easing: 'ease-out' }}
      className={className}
    />
  );
}

export default NumberTicker;
