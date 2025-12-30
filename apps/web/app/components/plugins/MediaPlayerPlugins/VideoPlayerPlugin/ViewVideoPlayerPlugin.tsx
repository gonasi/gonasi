import { useEffect, useMemo, useRef } from 'react';
import { useFetcher } from 'react-router';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useVideoPlayerInteraction } from './hooks/useVideoPlayerInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import { Spinner } from '~/components/loaders';
import { BlockActionButton } from '~/components/ui/button';
import { useStore } from '~/store';

type VideoPlayerPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'video_player' }>;

type VideoPlayerInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'video_player' }
>;

function isVideoPlayerInteraction(data: unknown): data is VideoPlayerInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'video_player'
  );
}

export function ViewVideoPlayerPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    settings: { playbackMode, weight, autoplay, controls, loop, muted, allowSeek, playbackSpeed },
    content: { video_id, poster_image_id },
  } = blockWithProgress.block as VideoPlayerPluginType;

  const { is_last_block } = blockWithProgress;
  const { mode } = useStore();

  const { loading, payload, handleContinue, updateInteractionData } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Extract interaction data from DB
  const initialInteractionData: VideoPlayerInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isVideoPlayerInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current data from payload if available
  const parsedPayloadData: VideoPlayerInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isVideoPlayerInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const { state, completionPercentage, formatTime, handleTimeUpdate, handlePlay, handlePause } =
    useVideoPlayerInteraction(currentInteractionData, videoRef);

  // Fetch video file
  const videoFetcher = useFetcher<{ success: boolean; data: any }>();

  useEffect(() => {
    if (video_id) {
      videoFetcher.load(`/api/files/${video_id}/signed-url?mode=${mode}`);
    }
  }, [video_id, mode]);

  const videoFile = videoFetcher.data?.data;
  const isLoadingVideo = videoFetcher.state === 'loading';

  // Prevent seeking forward if allowSeek is false
  useEffect(() => {
    if (!allowSeek && videoRef.current) {
      const video = videoRef.current;

      const handleSeeking = () => {
        if (video.currentTime > state.furthestWatchedSeconds) {
          video.currentTime = state.furthestWatchedSeconds;
        }
      };

      video.addEventListener('seeking', handleSeeking);
      return () => video.removeEventListener('seeking', handleSeeking);
    }
  }, [allowSeek, state.furthestWatchedSeconds]);

  // Hide playback speed controls if disabled
  useEffect(() => {
    if (!playbackSpeed && videoRef.current) {
      // Note: This is a CSS-based approach since we can't directly disable playback speed in HTML5 video
      // The controls will still show, but we can hide the speed option via CSS or use a custom player
      // For now, we'll just leave this as a future enhancement
    }
  }, [playbackSpeed]);

  // Update interaction data when state changes
  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

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
          {isLoadingVideo ? (
            <div className='bg-muted flex aspect-video w-full items-center justify-center rounded-lg'>
              <Spinner />
            </div>
          ) : videoFile ? (
            <>
              <video
                ref={videoRef}
                src={videoFile.signed_url}
                poster={poster_image_id ? undefined : undefined} // TODO: Fetch poster image if needed
                controls={controls}
                autoPlay={autoplay}
                loop={loop}
                muted={muted}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                className='w-full rounded-lg'
                style={{ aspectRatio: '16/9' }}
                preload='metadata'
              >
                Your browser does not support the video tag.
              </video>

              {/* Analytics display */}
              <div className='text-muted-foreground flex items-center justify-between text-sm'>
                <div>
                  Watched: <span className='font-medium'>{completionPercentage}%</span>
                </div>
                <div>
                  Furthest:{' '}
                  <span className='font-medium'>{formatTime(state.furthestWatchedSeconds)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className='bg-muted flex aspect-video w-full items-center justify-center rounded-lg'>
              <p className='text-muted-foreground'>Failed to load video</p>
            </div>
          )}

          {/* Continue button - always available */}
          {mode === 'play' && (
            <BlockActionButton
              onClick={handleContinue}
              loading={loading}
              isLastBlock={is_last_block}
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}
