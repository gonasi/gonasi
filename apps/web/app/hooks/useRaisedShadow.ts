import { useEffect } from 'react';
import type { MotionValue } from 'framer-motion';
import { animate, useMotionValue } from 'framer-motion';

const inactiveShadow = '0px 0px 0px rgba(0, 0, 0, 0.1)';
const activeShadow = '2px 4px 6px rgba(0, 0, 0, 0.15)';

interface UseRaisedShadowOptions {
  borderRadius?: string;
}

export function useRaisedShadow(value: MotionValue<number>, options: UseRaisedShadowOptions = {}) {
  const boxShadow = useMotionValue(inactiveShadow);
  const borderRadius = useMotionValue(options.borderRadius ?? '0px');

  useEffect(() => {
    let isActive = false;

    // Explicitly ignore deprecation warning using ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const unsubscribe = value.onChange((latest) => {
      const wasActive = isActive;
      if (latest !== 0) {
        isActive = true;
        if (isActive !== wasActive) {
          animate(boxShadow, activeShadow);
        }
      } else {
        isActive = false;
        if (isActive !== wasActive) {
          animate(boxShadow, inactiveShadow);
        }
      }
    });

    return () => unsubscribe();
  }, [value, boxShadow]);

  return { boxShadow, borderRadius };
}
