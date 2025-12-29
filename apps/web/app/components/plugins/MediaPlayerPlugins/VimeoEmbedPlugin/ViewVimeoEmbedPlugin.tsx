import { useEffect, useMemo, useRef } from 'react';
import Player from '@vimeo/player';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useVimeoEmbedInteraction } from './hooks/useVimeoEmbedInteraction';
import { extractVimeoId, getVimeoEmbedUrl } from './utils/extractVimeoId';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import { BlockActionButton } from '~/components/ui/button';
import { useStore } from '~/store';

type VimeoEmbedPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'vimeo_embed' }>;

type VimeoEmbedInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'vimeo_embed' }
>;

function isVimeoEmbedInteraction(data: unknown): data is VimeoEmbedInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'vimeo_embed'
  );
}

export function ViewVimeoEmbedPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const {
    settings: {
      playbackMode,
      weight,
      autoplay,
      controls,
      loop,
      muted,
      title,
      byline,
      portrait,
      color,
      startTime,
      allowSeek,
      dnt,
    },
    content: { vimeo_url },
  } = blockWithProgress.block as VimeoEmbedPluginType;

  const { is_last_block } = blockWithProgress;
  const { mode } = useStore();

  const { loading, payload, handleContinue, updateInteractionData } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Extract video ID
  const videoId = extractVimeoId(vimeo_url);

  // Extract interaction data from DB
  const initialInteractionData: VimeoEmbedInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isVimeoEmbedInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current data from payload if available
  const parsedPayloadData: VimeoEmbedInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isVimeoEmbedInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const {
    state,
    setPlayer,
    handlePlay,
    handlePause,
    handleEnded,
    playerRef,
    isPlayingRef,
  } = useVimeoEmbedInteraction(currentInteractionData, videoId || '');

  // Store the initial duration flag
  const durationSetRef = useRef(false);

  // Initialize Vimeo Player
  useEffect(() => {
    if (!videoId || !playerContainerRef.current) return;

    // Build embed URL with options
    const embedUrl = getVimeoEmbedUrl(videoId, {
      autoplay,
      loop,
      muted,
      controls,
      title,
      byline,
      portrait,
      color,
      dnt,
    });

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');

    // Clear container and append iframe
    playerContainerRef.current.innerHTML = '';
    playerContainerRef.current.appendChild(iframe);

    // Initialize Vimeo Player
    const vimeoPlayer = new Player(iframe);

    // Set player ref
    playerRef.current = vimeoPlayer;
    setPlayer(vimeoPlayer);

    // Set start time if specified
    if (startTime > 0) {
      vimeoPlayer.setCurrentTime(startTime).catch((error) => {
        console.error('Error setting start time:', error);
      });
    }

    // Get and set duration
    vimeoPlayer
      .getDuration()
      .then((duration) => {
        if (!durationSetRef.current && duration > 0) {
          durationSetRef.current = true;
        }
      })
      .catch((error) => {
        console.error('Error getting duration:', error);
      });

    // Add event listeners
    vimeoPlayer.on('play', handlePlay);
    vimeoPlayer.on('pause', handlePause);
    vimeoPlayer.on('ended', handleEnded);

    // Cleanup
    return () => {
      vimeoPlayer.off('play', handlePlay);
      vimeoPlayer.off('pause', handlePause);
      vimeoPlayer.off('ended', handleEnded);
      vimeoPlayer.destroy();
    };
  }, [
    videoId,
    autoplay,
    controls,
    loop,
    muted,
    title,
    byline,
    portrait,
    color,
    startTime,
    dnt,
    handlePlay,
    handlePause,
    handleEnded,
    playerRef,
    setPlayer,
  ]);

  // Prevent seeking forward if allowSeek is false
  useEffect(() => {
    if (!allowSeek && playerRef.current && isPlayingRef.current) {
      const checkInterval = setInterval(() => {
        if (playerRef.current) {
          playerRef.current
            .getCurrentTime()
            .then((currentTime) => {
              if (currentTime > state.furthestWatchedSeconds + 1) {
                playerRef.current
                  ?.setCurrentTime(state.furthestWatchedSeconds)
                  .catch((error) => {
                    console.error('Error preventing seek:', error);
                  });
              }
            })
            .catch((error) => {
              console.error('Error getting current time:', error);
            });
        }
      }, 500);

      return () => clearInterval(checkInterval);
    }
    return undefined;
  }, [allowSeek, playerRef, state.furthestWatchedSeconds, isPlayingRef]);

  // Update interaction data when state changes
  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  if (!videoId) {
    return (
      <ViewPluginWrapper isComplete={false} playbackMode={playbackMode} mode={mode} weight={weight}>
        <PlayPluginWrapper>
          <div className='bg-muted flex aspect-video w-full items-center justify-center rounded-lg'>
            <p className='text-muted-foreground'>Invalid Vimeo URL</p>
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
      <div className='w-full space-y-4 py-4'>
        {/* Vimeo Player Container */}
        <div
          ref={playerContainerRef}
          className='w-full rounded-lg'
          style={{ aspectRatio: '16/9' }}
        />

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
    </ViewPluginWrapper>
  );
}
