import { type JSX, useEffect, useRef } from 'react';

import { useStore } from '~/store';

export default function GoScrollPlayPositioningPlugin(): JSX.Element | null {
  const { nodeProgress } = useStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run effect when nodeProgress changes and is not empty
    if (!nodeProgress || Object.keys(nodeProgress).length === 0) return;

    // Get the last UUID from nodeProgress
    const keys = Object.keys(nodeProgress);
    const lastUuid = keys[keys.length - 1];

    // Clear any existing timeout to prevent multiple scroll attempts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Function to scroll to element
    const scrollToElement = () => {
      const elementToScrollTo = document.querySelector(`[data-uuid="${lastUuid}"]`);

      if (elementToScrollTo) {
        elementToScrollTo.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    };

    // Set a slight delay to ensure DOM has updated
    timeoutRef.current = setTimeout(scrollToElement, 200);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodeProgress]); // Only re-run when nodeProgress changes

  return null;
}
