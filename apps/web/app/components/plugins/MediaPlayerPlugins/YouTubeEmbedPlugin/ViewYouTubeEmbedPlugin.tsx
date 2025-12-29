import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { extractYouTubeId } from './utils/extractYouTubeId';
import { useYouTubeEmbedInteraction } from './hooks/useYouTubeEmbedInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import { BlockActionButton } from '~/components/ui/button';
import { useStore } from '~/store';

type YouTubeEmbedPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'youtube_embed' }>;

type YouTubeEmbedInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'youtube_embed' }
>;

function isYouTubeEmbedInteraction(data: unknown): data is YouTubeEmbedInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'youtube_embed'
  );
}

export function ViewYouTubeEmbedPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const {
    settings: {
      playbackMode,
      weight,
      autoplay,
      controls,
      loop,
      muted,
      captions,
      startTime,
      endTime,
      allowSeek,
      privacyEnhanced,
    },
    content: { youtube_url },
  } = blockWithProgress.block as YouTubeEmbedPluginType;

  const { is_last_block } = blockWithProgress;
  const { mode } = useStore();

  const {
    loading,
    payload,
    handleContinue,
    updateInteractionData,
  } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Extract video ID
  const videoId = extractYouTubeId(youtube_url);

  // Extract interaction data from DB
  const initialInteractionData: YouTubeEmbedInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isYouTubeEmbedInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current data from payload if available
  const parsedPayloadData: YouTubeEmbedInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isYouTubeEmbedInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const {
    state,
    setPlayer,
    isApiReady,
    completionPercentage,
    formatTime,
    handleStateChange,
    playerRef,
  } = useYouTubeEmbedInteraction(currentInteractionData, videoId || '');

  // Store the initial duration flag
  const durationSetRef = useRef(false);

  // Memoize the player ready handler to prevent re-renders
  const handlePlayerReady = useCallback(
    (event: any) => {
      playerRef.current = event.target;
      setPlayer(event.target);

      // Update duration only once when ready
      if (!durationSetRef.current) {
        const duration = event.target.getDuration();
        if (duration > 0) {
          durationSetRef.current = true;
          // Update will happen through the state update effect
        }
      }
    },
    [playerRef, setPlayer],
  );

  // Initialize YouTube Player
  useEffect(() => {
    if (!isApiReady || !videoId || !playerContainerRef.current) return;

    const YT = window.YT;
    if (!YT || !YT.Player) return;

    // Build player vars
    const playerVars: any = {
      autoplay: autoplay ? 1 : 0,
      controls: controls ? 1 : 0,
      loop: loop ? 1 : 0,
      mute: muted ? 1 : 0,
      cc_load_policy: captions ? 1 : 0,
      start: startTime || 0,
      modestbranding: 1,
      rel: 0,
    };

    if (endTime) {
      playerVars.end = endTime;
    }

    if (loop) {
      playerVars.playlist = videoId; // Required for looping
    }

    // Use privacy-enhanced embed domain if enabled
    const host = privacyEnhanced ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';

    const newPlayer = new YT.Player(playerContainerRef.current, {
      videoId,
      host,
      playerVars,
      events: {
        onStateChange: handleStateChange,
        onReady: handlePlayerReady,
      },
    });

    return () => {
      if (newPlayer && newPlayer.destroy) {
        newPlayer.destroy();
      }
    };
  }, [
    isApiReady,
    videoId,
    autoplay,
    controls,
    loop,
    muted,
    captions,
    startTime,
    endTime,
    privacyEnhanced,
    handleStateChange,
    handlePlayerReady,
  ]);

  // Prevent seeking forward if allowSeek is false
  useEffect(() => {
    if (!allowSeek && playerRef.current) {
      const checkInterval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime > state.furthestWatchedSeconds + 1) {
            playerRef.current.seekTo(state.furthestWatchedSeconds, true);
          }
        }
      }, 500);

      return () => clearInterval(checkInterval);
    }
    return undefined;
  }, [allowSeek, state.furthestWatchedSeconds]);

  // Update interaction data when state changes
  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  if (!videoId) {
    return (
      <ViewPluginWrapper
        isComplete={false}
        playbackMode={playbackMode}
        mode={mode}
        weight={weight}
      >
        <PlayPluginWrapper>
          <div className='bg-muted flex aspect-video w-full items-center justify-center rounded-lg'>
            <p className='text-muted-foreground'>Invalid YouTube URL</p>
          </div>
        </PlayPluginWrapper>
      </ViewPluginWrapper>
    );
  }

  return (
    <ViewPluginWrapper
      isComplete={
        mode === 'preview' ? false : blockWithProgress.block_progress?.is_completed || false
      }
      playbackMode={playbackMode}
      mode={mode}
      weight={weight}
    >
      <PlayPluginWrapper>
        <div className='w-full space-y-4'>
          {/* YouTube Player Container */}
          <div
            ref={playerContainerRef}
            className='w-full rounded-lg'
            style={{ aspectRatio: '16/9' }}
          />

          {/* Analytics display */}
          <div className='text-muted-foreground flex items-center justify-between text-sm'>
            <div>
              Watched: <span className='font-medium'>{completionPercentage}%</span>
            </div>
            <div>
              Furthest:{' '}
              <span className='font-medium'>{formatTime(state.furthestWatchedSeconds)}</span>
            </div>
            <div>
              Plays: <span className='font-medium'>{state.playCount}</span>
            </div>
          </div>

          {/* Continue button - show only when not completed */}
          {!blockWithProgress.block_progress?.is_completed && (
            <BlockActionButton
              onClick={handleContinue}
              loading={loading}
              isLastBlock={is_last_block}
              disabled={mode === 'preview'}
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}
