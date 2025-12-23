import { useCallback, useMemo, useState } from 'react';

import {
  VideoPlayerInteractionSchema,
  type VideoPlayerInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

const schema = VideoPlayerInteractionSchema;

export function useVideoPlayerInteraction(
  initial: VideoPlayerInteractionSchemaTypes | null,
  videoRef: React.RefObject<HTMLVideoElement>,
) {
  const defaultState: VideoPlayerInteractionSchemaTypes = schema.parse({
    plugin_type: 'video_player',
  });

  const [state, setState] = useState<VideoPlayerInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'video_player' }),
  );

  // Calculate completion percentage based on furthest watched vs total duration
  const completionPercentage = useMemo(() => {
    const video = videoRef.current;
    if (!video || !video.duration || video.duration === 0) return state.completionPercentage;

    const percentage = Math.round((state.furthestWatchedSeconds / video.duration) * 100);
    return Math.min(100, Math.max(0, percentage));
  }, [state.furthestWatchedSeconds, videoRef, state.completionPercentage]);

  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle time update (fires continuously during playback)
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const currentTime = video.currentTime;

    setState((prev) => {
      const newFurthestWatched = Math.max(prev.furthestWatchedSeconds, currentTime);
      const newPercentage = Math.round((newFurthestWatched / video.duration) * 100);

      return {
        ...prev,
        furthestWatchedSeconds: newFurthestWatched,
        completionPercentage: Math.min(100, Math.max(0, newPercentage)),
        totalWatchedSeconds: prev.totalWatchedSeconds + 0.25, // Approximate increment
      };
    });
  }, [videoRef]);

  const handlePlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playCount: prev.playCount + 1,
    }));
  }, []);

  const handlePause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pauseCount: prev.pauseCount + 1,
    }));
  }, []);

  return {
    state,
    completionPercentage,
    formatTime,
    handleTimeUpdate,
    handlePlay,
    handlePause,
  };
}

export type VideoPlayerInteractionReturn = ReturnType<typeof useVideoPlayerInteraction>;
