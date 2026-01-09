import { useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { ChevronLeft, ChevronRight, Eye, Play, Settings, X } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useImageFocusQuizInteraction } from './hooks/useImageFocusQuizInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import { BlockActionButton, Button, OutlineButton } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

type ImageFocusQuizPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'image_focus_quiz' }>;

type ImageFocusQuizInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'image_focus_quiz' }
>;

function isImageFocusQuizInteraction(data: unknown): data is ImageFocusQuizInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'image_focus_quiz'
  );
}

enum PlaybackPhase {
  INITIAL_DISPLAY = 'initial_display',
  REGION_FOCUSED = 'region_focused',
  ANSWER_REVEALED = 'answer_revealed',
  BETWEEN_REGIONS = 'between_regions',
  COMPLETE = 'complete',
}

export function ViewImageFocusQuizPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const {
    settings: {
      playbackMode,
      weight,
      revealMode,
      defaultRevealDelay,
      blurIntensity,
      dimIntensity,
      betweenRegionsDuration,
      autoAdvance,
      autoAdvanceDelay,
      randomization,
      animationDuration,
    },
    content: { imageId, regions, initialDisplayDuration },
  } = blockWithProgress.block as ImageFocusQuizPluginType;

  const { is_last_block } = blockWithProgress;
  const { mode } = useStore();
  const fetcher = useFetcher<typeof loader>();
  const imageRef = useRef<HTMLDivElement>(null);

  // User preference for randomization (overrides builder setting)
  const [userRandomization, setUserRandomization] = useState<'none' | 'shuffle'>(randomization);

  const { loading, payload, handleContinue, updateInteractionData, updateEarnedScore } =
    useViewPluginCore(
      mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
    );

  // Extract interaction data
  const initialInteractionData: ImageFocusQuizInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;
    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isImageFocusQuizInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  const parsedPayloadData: ImageFocusQuizInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isImageFocusQuizInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  const currentInteractionData = parsedPayloadData || initialInteractionData;

  // Use interaction hook with user's randomization preference
  const {
    state,
    currentRegion,
    isLastRegion,
    isFirstRegion,
    isQuizComplete,
    totalRegions,
    completedCount,
    revealAnswer,
    nextRegion,
    previousRegion,
    reset,
  } = useImageFocusQuizInteraction(currentInteractionData, regions, userRandomization);

  // Modal state - quiz starts when user clicks play
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Playback phase management
  const [playbackPhase, setPlaybackPhase] = useState<PlaybackPhase>(PlaybackPhase.INITIAL_DISPLAY);
  const [autoRevealTimer, setAutoRevealTimer] = useState<NodeJS.Timeout | null>(null);

  // Load image
  useEffect(() => {
    if (imageId && mode) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  // Initial display phase - only when modal is open
  useEffect(() => {
    if (isModalOpen && playbackPhase === PlaybackPhase.INITIAL_DISPLAY && regions.length > 0) {
      const timer = setTimeout(() => {
        setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
      }, initialDisplayDuration * 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isModalOpen, playbackPhase, initialDisplayDuration, regions.length]);

  // Auto-reveal answer timer
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.REGION_FOCUSED && revealMode === 'auto') {
      const delay = currentRegion?.revealDelay ?? defaultRevealDelay;
      const timer = setTimeout(() => {
        revealAnswer();
        setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
      }, delay * 1000);

      setAutoRevealTimer(timer);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [playbackPhase, revealMode, currentRegion?.revealDelay, defaultRevealDelay, revealAnswer]);

  // Auto-advance to next region
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.ANSWER_REVEALED && autoAdvance) {
      const timer = setTimeout(() => {
        handleNextRegion();
      }, autoAdvanceDelay * 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackPhase, autoAdvance, autoAdvanceDelay]);

  // Update interaction data
  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state } as any);
    }
  }, [mode, state, updateInteractionData]);

  // Update score
  useEffect(() => {
    if (mode === 'play') {
      const score = isQuizComplete ? weight : Math.floor((completedCount / totalRegions) * weight);
      updateEarnedScore(score);
    }
  }, [mode, isQuizComplete, completedCount, totalRegions, weight, updateEarnedScore]);

  // Handle manual reveal
  const handleRevealAnswer = () => {
    if (autoRevealTimer) {
      clearTimeout(autoRevealTimer);
      setAutoRevealTimer(null);
    }
    revealAnswer();
    setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
  };

  // Handle next region - always show full image between regions for better UX
  const handleNextRegion = () => {
    if (isLastRegion) {
      setPlaybackPhase(PlaybackPhase.COMPLETE);
    } else {
      // Always transition through full image for smooth UX
      setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
      setTimeout(() => {
        nextRegion();
        setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
      }, betweenRegionsDuration * 1000);
    }
  };

  // Handle previous region - also show full image between regions
  const handlePreviousRegion = () => {
    if (!isFirstRegion) {
      setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
      setTimeout(() => {
        previousRegion();
        setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
      }, betweenRegionsDuration * 1000);
    }
  };

  // Handle opening modal - reset and start quiz
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setPlaybackPhase(PlaybackPhase.INITIAL_DISPLAY);
    reset();
  };

  // Handle closing modal - cleanup timers
  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (autoRevealTimer) {
      clearTimeout(autoRevealTimer);
      setAutoRevealTimer(null);
    }
  };

  // Calculate region position for zoom (must be before early return)
  const regionStyle = useMemo(() => {
    if (
      !currentRegion ||
      playbackPhase === PlaybackPhase.INITIAL_DISPLAY ||
      playbackPhase === PlaybackPhase.BETWEEN_REGIONS ||
      playbackPhase === PlaybackPhase.COMPLETE
    ) {
      return {
        transform: 'scale(1)',
        transition: `transform ${animationDuration}ms ease-in-out`,
        transformOrigin: 'center center',
      };
    }

    const { x, y, width, height } = currentRegion;

    // Calculate the center of the region in percentage coordinates
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Calculate zoom scale: aim to make region fill roughly 60-80% of viewport
    // Smaller regions need more zoom. Use the smaller dimension to ensure entire region is visible.
    const targetFillPercentage = 70; // Target region to fill 70% of viewport
    const scaleX = targetFillPercentage / width;
    const scaleY = targetFillPercentage / height;
    const scale = Math.min(scaleX, scaleY, 3); // Cap at 3x to avoid over-zooming

    // Use image center as transform origin, calculate translation to center region in viewport
    // After scaling from center (50%, 50%), point at P becomes: 50 + (P - 50) * scale
    // We want region center to be at 50%:
    // 50 + (centerX - 50) * scale + translateX = 50
    // translateX = -((centerX - 50) * scale)
    const translateX = -((centerX - 50) * scale);
    const translateY = -((centerY - 50) * scale);

    return {
      transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
      transition: `transform ${animationDuration}ms ease-in-out`,
      transformOrigin: '50% 50%',
    };
  }, [currentRegion, playbackPhase, animationDuration]);

  const isComplete =
    mode === 'preview' ? isQuizComplete : blockWithProgress.block_progress?.is_completed;

  const fileData = fetcher.data?.success && fetcher.data.data ? fetcher.data.data : null;

  if (fetcher.state !== 'idle' || !fileData) {
    return (
      <div className='flex min-h-60 items-center justify-center'>
        <Spinner />
      </div>
    );
  }

  return (
    <ViewPluginWrapper
      isComplete={isComplete}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
      weight={weight}
    >
      <PlayPluginWrapper>
        <div className='relative mx-auto max-w-2xl'>
          {/* Static preview with play button */}
          <div className='space-y-6'>
            {/* Image preview */}
            <div
              className='relative flex items-center justify-center overflow-hidden rounded-lg shadow-lg'
              style={{ height: '50vh', maxHeight: '50vh' }}
            >
              <img
                src={fileData.signed_url}
                alt='Focus quiz preview'
                className='h-auto max-h-[50vh] w-auto max-w-full select-none'
                crossOrigin='anonymous'
              />
            </div>

            {/* Info and controls */}
            <div className='space-y-4'>
              <div className='text-muted-foreground text-center text-sm'>
                <p className='mb-2'>
                  This memorization exercise contains {totalRegions} region
                  {totalRegions !== 1 ? 's' : ''} to explore.
                </p>
                <p>Click Play to start the interactive experience.</p>
              </div>

              <div className='flex items-center justify-center gap-4'>
                <Button
                  onClick={handleOpenModal}
                  size='lg'
                  leftIcon={<Play size={20} />}
                  className='min-w-40'
                >
                  Play
                </Button>

                {/* Settings Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='ghost' size='lg' className='h-12 w-12 p-0'>
                      <Settings
                        className='text-muted-foreground transition-transform duration-200 hover:scale-110 hover:rotate-90'
                        size={20}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-80'>
                    <div className='grid gap-4'>
                      <div className='space-y-2'>
                        <h4 className='leading-none font-medium'>Memorization Settings</h4>
                        <p className='text-muted-foreground text-sm'>
                          Customize how you&apos;d like to practice this exercise
                        </p>
                      </div>

                      <div className='space-y-3'>
                        <Label className='text-sm font-medium'>Region Order</Label>
                        <RadioGroup
                          value={userRandomization}
                          onValueChange={(value) =>
                            setUserRandomization(value as 'none' | 'shuffle')
                          }
                        >
                          <div className='flex items-start space-y-0 space-x-3'>
                            <RadioGroupItem value='none' id='order-sequential' />
                            <div className='-mt-2 flex-1'>
                              <Label
                                htmlFor='order-sequential'
                                className='cursor-pointer leading-tight font-normal'
                              >
                                Sequential
                              </Label>
                              <p className='text-muted-foreground mt-1 text-xs'>
                                Go through regions in order, ideal for initial learning
                              </p>
                            </div>
                          </div>

                          <div className='flex items-start space-y-0 space-x-3'>
                            <RadioGroupItem value='shuffle' id='order-shuffle' />
                            <div className='-mt-2 flex-1'>
                              <Label
                                htmlFor='order-shuffle'
                                className='flex cursor-pointer items-center gap-1.5 leading-tight font-normal'
                              >
                                Randomized
                              </Label>
                              <p className='text-muted-foreground mt-1 text-xs'>
                                Shuffle regions each time, better for testing memory
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Always show Continue/Complete button */}
            {!blockWithProgress.block_progress?.is_completed && (
              <div className='flex justify-center pt-4'>
                <BlockActionButton
                  onClick={handleContinue}
                  loading={loading}
                  isLastBlock={is_last_block}
                  disabled={mode === 'preview'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal for quiz experience */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className='max-w-4xl'>
            <DialogHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <DialogTitle>Image Focus Memorization</DialogTitle>
                  <DialogDescription>
                    Explore the image regions and test your memory
                  </DialogDescription>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleCloseModal}
                  className='h-8 w-8 p-0'
                >
                  <X size={16} />
                </Button>
              </div>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Progress indicator */}
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  Region {state.currentRegionIndex + 1} of {totalRegions}
                </span>
                <span className='text-muted-foreground'>
                  {completedCount} / {totalRegions} completed
                </span>
              </div>

              {/* Image container */}
              <div
                className='relative flex items-center justify-center overflow-hidden rounded-lg shadow-lg'
                style={{ height: '50vh', maxHeight: '50vh' }}
              >
                <div
                  ref={imageRef}
                  className='relative flex items-center justify-center'
                  style={regionStyle}
                >
                  <img
                    src={fileData.signed_url}
                    alt='Focus quiz'
                    className='h-auto max-h-[50vh] w-auto max-w-full select-none'
                    crossOrigin='anonymous'
                  />

                  {/* Blur overlay when focused on region */}
                  {(playbackPhase === PlaybackPhase.REGION_FOCUSED ||
                    playbackPhase === PlaybackPhase.ANSWER_REVEALED) &&
                    currentRegion && (
                      <>
                        {/* Top overlay */}
                        <div
                          className='pointer-events-none absolute right-0 left-0'
                          style={{
                            top: 0,
                            height: `${currentRegion.y}%`,
                            backgroundColor: `rgba(0, 0, 0, ${dimIntensity})`,
                            backdropFilter: `blur(${blurIntensity}px)`,
                            transition: `opacity ${animationDuration}ms ease-in-out`,
                          }}
                        />
                        {/* Bottom overlay */}
                        <div
                          className='pointer-events-none absolute right-0 left-0'
                          style={{
                            top: `${currentRegion.y + currentRegion.height}%`,
                            bottom: 0,
                            backgroundColor: `rgba(0, 0, 0, ${dimIntensity})`,
                            backdropFilter: `blur(${blurIntensity}px)`,
                            transition: `opacity ${animationDuration}ms ease-in-out`,
                          }}
                        />
                        {/* Left overlay */}
                        <div
                          className='pointer-events-none absolute top-0 bottom-0'
                          style={{
                            left: 0,
                            width: `${currentRegion.x}%`,
                            backgroundColor: `rgba(0, 0, 0, ${dimIntensity})`,
                            backdropFilter: `blur(${blurIntensity}px)`,
                            transition: `opacity ${animationDuration}ms ease-in-out`,
                          }}
                        />
                        {/* Right overlay */}
                        <div
                          className='pointer-events-none absolute top-0 bottom-0'
                          style={{
                            left: `${currentRegion.x + currentRegion.width}%`,
                            right: 0,
                            backgroundColor: `rgba(0, 0, 0, ${dimIntensity})`,
                            backdropFilter: `blur(${blurIntensity}px)`,
                            transition: `opacity ${animationDuration}ms ease-in-out`,
                          }}
                        />
                      </>
                    )}
                </div>
              </div>

              {/* Answer section */}
              {playbackPhase === PlaybackPhase.ANSWER_REVEALED && currentRegion && (
                <div className='bg-card rounded-lg border p-6 shadow-sm'>
                  <h3 className='mb-4 font-medium'>Answer:</h3>
                  <RichTextRenderer editorState={currentRegion.answerState} />
                </div>
              )}

              {/* Control buttons */}
              <div className='flex items-center justify-between gap-4'>
                {/* Previous button */}
                <OutlineButton
                  onClick={handlePreviousRegion}
                  disabled={isFirstRegion}
                  className='flex items-center gap-2'
                >
                  <ChevronLeft size={16} />
                  Previous
                </OutlineButton>

                {/* Center action */}
                <div className='flex-1 text-center'>
                  {playbackPhase === PlaybackPhase.REGION_FOCUSED && revealMode === 'manual' && (
                    <OutlineButton onClick={handleRevealAnswer} className='flex items-center gap-2'>
                      <Eye size={16} />
                      Reveal Answer
                    </OutlineButton>
                  )}

                  {playbackPhase === PlaybackPhase.ANSWER_REVEALED && !isLastRegion && (
                    <OutlineButton onClick={handleNextRegion} className='flex items-center gap-2'>
                      Next Region
                      <ChevronRight size={16} />
                    </OutlineButton>
                  )}

                  {playbackPhase === PlaybackPhase.COMPLETE && (
                    <Button onClick={handleCloseModal} variant='secondary'>
                      Close
                    </Button>
                  )}
                </div>

                {/* Next button (disabled when manual reveal is needed) */}
                <OutlineButton
                  onClick={handleNextRegion}
                  disabled={playbackPhase === PlaybackPhase.REGION_FOCUSED || isLastRegion}
                  className='flex items-center gap-2'
                >
                  Next
                  <ChevronRight size={16} />
                </OutlineButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}
