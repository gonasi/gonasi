import { useCallback, useMemo, useState } from 'react';

import {
  AudioPlayerInteractionSchema,
  type AudioPlayerInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

const schema = AudioPlayerInteractionSchema;

export function useAudioPlayerInteraction(
  initial: AudioPlayerInteractionSchemaTypes | null,
  audioRef: React.RefObject<HTMLAudioElement>,
) {
  const defaultState: AudioPlayerInteractionSchemaTypes = schema.parse({
    plugin_type: 'audio_player',
  });

  const [state, setState] = useState<AudioPlayerInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'audio_player' }),
  );

  // Calculate completion percentage based on furthest listened vs total duration
  const completionPercentage = useMemo(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || audio.duration === 0) return state.completionPercentage;

    const percentage = Math.round((state.furthestListenedSeconds / audio.duration) * 100);
    return Math.min(100, Math.max(0, percentage));
  }, [state.furthestListenedSeconds, audioRef, state.completionPercentage]);

  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle time update (fires continuously during playback)
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const currentTime = audio.currentTime;

    setState((prev) => {
      const newFurthestListened = Math.max(prev.furthestListenedSeconds, currentTime);
      const newPercentage = Math.round((newFurthestListened / audio.duration) * 100);

      return {
        ...prev,
        furthestListenedSeconds: newFurthestListened,
        completionPercentage: Math.min(100, Math.max(0, newPercentage)),
        totalListenedSeconds: prev.totalListenedSeconds + 0.25, // Approximate increment
      };
    });
  }, [audioRef]);

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

export type AudioPlayerInteractionReturn = ReturnType<typeof useAudioPlayerInteraction>;
