import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Howl } from 'howler';

import scrollSound from '/assets/sounds/scroll.mp3';
import { useStore } from '~/store';

/**
 * Custom hook for managing scroll audio with better error handling and performance
 */
export function useScrollAudio(
  activeBlock: string | null,
  blockRefs: React.RefObject<Record<string, HTMLElement | null>>,
) {
  const { isSoundEnabled } = useStore();

  const scrollHowl = useMemo(() => {
    if (!scrollSound) return null;

    return new Howl({
      src: [scrollSound],
      volume: 0.2,
      preload: true,
      html5: true,
      onloaderror: (id, error) => {
        console.warn('Failed to load scroll sound:', error, id);
      },
      onplayerror: (id, error) => {
        console.warn('Failed to play scroll sound:', error, id);
      },
    });
  }, []);

  const lastPlayTime = useRef(0);
  const PLAY_THROTTLE_MS = 150;

  const playScrollSound = useCallback(() => {
    if (!scrollHowl || !isSoundEnabled) return;

    const now = Date.now();
    if (now - lastPlayTime.current < PLAY_THROTTLE_MS) {
      return;
    }

    try {
      scrollHowl.stop(); // Stop any currently playing instance
      scrollHowl.play();
      lastPlayTime.current = now;
    } catch (error) {
      console.warn('Error playing scroll sound:', error);
    }
  }, [scrollHowl, isSoundEnabled]);

  useEffect(() => {
    return () => {
      if (scrollHowl) {
        scrollHowl.stop();
        scrollHowl.unload();
      }
    };
  }, [scrollHowl]);

  useEffect(() => {
    if (!activeBlock || !blockRefs.current?.[activeBlock]) return;

    const targetElement = blockRefs.current[activeBlock];

    requestAnimationFrame(() => {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });

      setTimeout(playScrollSound, 100);
    });
  }, [activeBlock, playScrollSound, blockRefs]);

  return { playScrollSound };
}
