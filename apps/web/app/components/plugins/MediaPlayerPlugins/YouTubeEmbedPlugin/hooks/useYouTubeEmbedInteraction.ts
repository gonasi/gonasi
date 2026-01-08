import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  YoutubeEmbedInteractionSchema,
  type YoutubeEmbedInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

const schema = YoutubeEmbedInteractionSchema;

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubeEmbedInteraction(
  initial: YoutubeEmbedInteractionSchemaTypes | null,
  videoId: string,
) {
  const [state, setState] = useState<YoutubeEmbedInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'youtube_embed', videoId }),
  );

  const [player, setPlayer] = useState<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    // Load the API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    // API ready callback
    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

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

  // Handle player state change - memoized to prevent re-renders
  const handleStateChange = useCallback((event: any) => {
    const playerState = event.data;
    const YT = window.YT;

    if (!YT) return;

    // Playing
    if (playerState === YT.PlayerState.PLAYING) {
      setState((prev) => ({
        ...prev,
        playCount: prev.playCount + 1,
      }));

      // Start tracking progress
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();

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
        }
      }, 500); // Update every 500ms
    }

    // Paused
    if (playerState === YT.PlayerState.PAUSED) {
      setState((prev) => ({
        ...prev,
        pauseCount: prev.pauseCount + 1,
      }));

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Ended
    if (playerState === YT.PlayerState.ENDED) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Mark as fully watched
      const duration = playerRef.current?.getDuration() || 0;
      setState((prev) => ({
        ...prev,
        furthestWatchedSeconds: duration,
        completionPercentage: 100,
        videoDuration: duration,
      }));
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
    isApiReady,
    completionPercentage,
    formatTime,
    handleStateChange,
    playerRef,
  };
}

export type YouTubeEmbedInteractionReturn = ReturnType<typeof useYouTubeEmbedInteraction>;
