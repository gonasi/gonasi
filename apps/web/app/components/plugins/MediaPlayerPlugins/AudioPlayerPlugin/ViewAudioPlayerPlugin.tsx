import { useEffect, useMemo, useRef } from 'react';
import { useFetcher } from 'react-router';
import { Volume2 } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useAudioPlayerInteraction } from './hooks/useAudioPlayerInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import { Spinner } from '~/components/loaders';
import { BlockActionButton } from '~/components/ui/button';
import { useStore } from '~/store';

type AudioPlayerPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'audio_player' }>;

type AudioPlayerInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'audio_player' }
>;

function isAudioPlayerInteraction(data: unknown): data is AudioPlayerInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'audio_player'
  );
}

export function ViewAudioPlayerPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    settings: { playbackMode, weight, autoplay, loop, allowSeek, playbackSpeed, showTimestamp },
    content: { audio_id, cover_image_id },
  } = blockWithProgress.block as AudioPlayerPluginType;

  const { is_last_block } = blockWithProgress;
  const { mode } = useStore();

  const { loading, payload, handleContinue, updateInteractionData } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Extract interaction data from DB
  const initialInteractionData: AudioPlayerInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isAudioPlayerInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current data from payload if available
  const parsedPayloadData: AudioPlayerInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isAudioPlayerInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const { state, completionPercentage, formatTime, handleTimeUpdate, handlePlay, handlePause } =
    useAudioPlayerInteraction(currentInteractionData, audioRef);

  // Fetch audio file
  const audioFetcher = useFetcher<{ success: boolean; data: any }>();

  useEffect(() => {
    if (audio_id) {
      audioFetcher.load(`/api/files/${audio_id}/signed-url?mode=${mode}`);
    }
  }, [audio_id, mode]);

  const audioFile = audioFetcher.data?.data;
  const isLoadingAudio = audioFetcher.state === 'loading';

  // Prevent seeking forward if allowSeek is false
  useEffect(() => {
    if (!allowSeek && audioRef.current) {
      const audio = audioRef.current;

      const handleSeeking = () => {
        if (audio.currentTime > state.furthestListenedSeconds) {
          audio.currentTime = state.furthestListenedSeconds;
        }
      };

      audio.addEventListener('seeking', handleSeeking);
      return () => audio.removeEventListener('seeking', handleSeeking);
    }
  }, [allowSeek, state.furthestListenedSeconds]);

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
          {isLoadingAudio ? (
            <div className='bg-muted flex w-full items-center justify-center rounded-lg p-8'>
              <Spinner />
            </div>
          ) : audioFile ? (
            <>
              <div className='bg-card border-border w-full rounded-lg border p-6'>
                <div className='mb-4 flex items-center gap-2'>
                  <Volume2 size={20} className='text-primary' />
                  <span className='text-foreground text-sm font-medium'>{audioFile.name}</span>
                </div>
                <audio
                  ref={audioRef}
                  src={audioFile.signed_url}
                  autoPlay={autoplay}
                  loop={loop}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  controls
                  className='w-full'
                  preload='metadata'
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>

              {/* Analytics display */}
              {showTimestamp && (
                <div className='text-muted-foreground flex items-center justify-between text-sm'>
                  <div>
                    Listened: <span className='font-medium'>{completionPercentage}%</span>
                  </div>
                  <div>
                    Furthest:{' '}
                    <span className='font-medium'>{formatTime(state.furthestListenedSeconds)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className='bg-muted flex w-full items-center justify-center rounded-lg p-8'>
              <p className='text-muted-foreground'>Failed to load audio</p>
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
