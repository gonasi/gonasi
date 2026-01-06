import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type Player from '@vimeo/player';

import {
  VimeoEmbedInteractionSchema,
  type VimeoEmbedInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

const schema = VimeoEmbedInteractionSchema;

export function useVimeoEmbedInteraction(
  initial: VimeoEmbedInteractionSchemaTypes | null,
  videoId: string,
) {
  const [state, setState] = useState<VimeoEmbedInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'vimeo_embed', videoId }),
  );

  const [player, setPlayer] = useState<Player | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<Player | null>(null);
  const isPlayingRef = useRef(false);

  // Calculate completion percentage based on furthest watched vs total duration
  const completionPercentage = useMemo(() => {
    if (!state.videoDuration || state.videoDuration === 0) return state.completionPercentage;

    const percentage = Math.round((state.furthestWatchedSeconds / state.videoDuration) * 100);
    return Math.min(100, Math.max(0, percentage));
  }, [state.furthestWatchedSeconds, state.videoDuration, state.completionPercentage]);

  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle play event
  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;
    setState((prev) => ({
      ...prev,
      playCount: prev.playCount + 1,
    }));

    // Start tracking progress
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (playerRef.current) {
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          const duration = await playerRef.current.getDuration();

          setState((prev) => {
            const newFurthestWatched = Math.max(prev.furthestWatchedSeconds, currentTime);
            const newPercentage =
              duration > 0 ? Math.round((newFurthestWatched / duration) * 100) : 0;

            return {
              ...prev,
              furthestWatchedSeconds: newFurthestWatched,
              completionPercentage: Math.min(100, Math.max(0, newPercentage)),
              totalWatchedSeconds: prev.totalWatchedSeconds + 0.5,
              videoDuration: duration,
            };
          });
        } catch (error) {
          console.error('Error tracking Vimeo progress:', error);
        }
      }
    }, 500); // Update every 500ms
  }, []);

  // Handle pause event
  const handlePause = useCallback(() => {
    isPlayingRef.current = false;
    setState((prev) => ({
      ...prev,
      pauseCount: prev.pauseCount + 1,
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle ended event
  const handleEnded = useCallback(async () => {
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Mark as fully watched
    if (playerRef.current) {
      try {
        const duration = await playerRef.current.getDuration();
        setState((prev) => ({
          ...prev,
          furthestWatchedSeconds: duration,
          completionPercentage: 100,
          videoDuration: duration,
        }));
      } catch (error) {
        console.error('Error updating completion on video end:', error);
      }
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    player,
    setPlayer,
    completionPercentage,
    formatTime,
    handlePlay,
    handlePause,
    handleEnded,
    playerRef,
    isPlayingRef,
  };
}

export type VimeoEmbedInteractionReturn = ReturnType<typeof useVimeoEmbedInteraction>;
