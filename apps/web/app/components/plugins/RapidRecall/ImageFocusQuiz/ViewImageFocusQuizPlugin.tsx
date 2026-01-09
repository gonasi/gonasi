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
    totalRegions,
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

  // Timer state for countdown
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const { isSoundEnabled } = useStore();

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

  // Timer countdown for quiz-like feeling
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.REGION_FOCUSED) {
      const delay = currentRegion?.revealDelay ?? defaultRevealDelay;
      setTimeRemaining(delay);

      // Update timer every 100ms for smooth progress bar
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            clearInterval(interval);
            // Play sound when timer expires
            if (isSoundEnabled) {
              const audio = new Audio('/sounds/timer-complete.mp3');
              audio.play().catch(() => {
                // Ignore if sound fails to play
              });
            }
            // Auto-reveal answer when timer expires (for both auto and manual modes)
            if (revealMode === 'auto') {
              revealAnswer();
              setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
            }
            return 0;
          }
          return newTime;
        });
      }, 100);

      setTimerInterval(interval);

      return () => {
        clearInterval(interval);
        setTimerInterval(null);
      };
    }
    return undefined;
  }, [
    playbackPhase,
    currentRegion?.revealDelay,
    defaultRevealDelay,
    isSoundEnabled,
    revealMode,
    revealAnswer,
  ]);

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

  // Update score - always give full weight for memorization practice
  useEffect(() => {
    if (mode === 'play') {
      updateEarnedScore(weight);
    }
  }, [mode, weight, updateEarnedScore]);

  // Handle manual reveal
  const handleRevealAnswer = () => {
    if (autoRevealTimer) {
      clearTimeout(autoRevealTimer);
      setAutoRevealTimer(null);
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    revealAnswer();
    setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
  };

  // Handle next region - loop back to first when reaching the end
  const handleNextRegion = () => {
    setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
    setTimeout(() => {
      if (isLastRegion) {
        // Loop back to first region
        reset();
      } else {
        nextRegion();
      }
      setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
    }, betweenRegionsDuration * 1000);
  };

  // Handle previous region - loop to last when going before first
  const handlePreviousRegion = () => {
    setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
    setTimeout(() => {
      if (isFirstRegion) {
        // Loop to last region by calling nextRegion totalRegions-1 times
        for (let i = 0; i < totalRegions - 1; i++) {
          nextRegion();
        }
      } else {
        previousRegion();
      }
      setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
    }, betweenRegionsDuration * 1000);
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
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
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

    // Calculate zoom scale: aim to make region fill roughly 80-90% of viewport
    // Smaller regions need more zoom. Use the smaller dimension to ensure entire region is visible.
    const targetFillPercentage = 85; // Target region to fill 85% of viewport
    const scaleX = targetFillPercentage / width;
    const scaleY = targetFillPercentage / height;
    const scale = Math.min(scaleX, scaleY, 5); // Cap at 5x for better detail visibility

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

  // For memorization, completion is only based on block progress, not quiz state
  const isComplete = blockWithProgress.block_progress?.is_completed;

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
          <DialogContent className='h-full w-full !max-w-full md:!top-0 md:!left-0 md:h-screen md:!max-h-screen md:w-screen md:!translate-x-0 md:!translate-y-0 md:rounded-none'>
            <DialogHeader>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <DialogTitle className='text-base md:text-lg'>
                    Image Focus Memorization
                  </DialogTitle>
                  <DialogDescription className='hidden text-sm md:block'>
                    Explore the image regions and test your memory
                  </DialogDescription>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleCloseModal}
                  className='h-8 w-8 shrink-0 p-0'
                >
                  <X size={16} />
                </Button>
              </div>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Progress indicator */}
              <div className='flex items-center justify-center text-sm'>
                <span className='text-muted-foreground'>
                  Region {state.currentRegionIndex + 1} of {totalRegions}
                </span>
              </div>

              {/* Image container */}
              <div className='relative flex h-[45vh] items-center justify-center overflow-hidden rounded-lg shadow-lg md:h-[75vh]'>
                <div
                  ref={imageRef}
                  className='relative flex items-center justify-center'
                  style={regionStyle}
                >
                  <img
                    src={fileData.signed_url}
                    alt='Focus quiz'
                    className='h-auto max-h-[45vh] w-auto max-w-full select-none md:max-h-[75vh]'
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

              {/* Timer section - shown when region is focused */}
              {playbackPhase === PlaybackPhase.REGION_FOCUSED && currentRegion && (
                <div className='bg-card rounded-lg border p-4 shadow-sm md:p-6'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-medium md:text-base'>
                        {revealMode === 'manual'
                          ? 'Think about your answer...'
                          : 'Answer revealing in...'}
                      </h3>
                      <span className='text-primary text-lg font-bold md:text-xl'>
                        {timeRemaining.toFixed(1)}s
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className='bg-muted h-3 overflow-hidden rounded-full md:h-4'>
                      <div
                        className='bg-primary h-full transition-all duration-100 ease-linear'
                        style={{
                          width: `${((timeRemaining / (currentRegion.revealDelay ?? defaultRevealDelay)) * 100).toFixed(2)}%`,
                        }}
                      />
                    </div>

                    {revealMode === 'manual' && (
                      <p className='text-muted-foreground text-xs md:text-sm'>
                        Click &quot;Reveal Answer&quot; when you&apos;re ready, or wait for
                        auto-reveal
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Answer section */}
              {playbackPhase === PlaybackPhase.ANSWER_REVEALED && currentRegion && (
                <div className='bg-card rounded-lg border p-4 shadow-sm md:p-6'>
                  <h3 className='mb-3 text-sm font-medium md:mb-4 md:text-base'>Answer:</h3>
                  <div className='text-sm md:text-base'>
                    <RichTextRenderer editorState={currentRegion.answerState} />
                  </div>
                </div>
              )}

              {/* Control buttons */}
              <div className='flex items-center justify-between gap-2 md:gap-4'>
                {/* Previous button - loops to last region when at first */}
                <OutlineButton
                  onClick={handlePreviousRegion}
                  className='flex items-center gap-1 md:gap-2'
                >
                  <ChevronLeft size={16} />
                  <span className='hidden sm:inline'>Previous</span>
                </OutlineButton>

                {/* Center action */}
                <div className='flex-1 text-center'>
                  {playbackPhase === PlaybackPhase.REGION_FOCUSED && revealMode === 'manual' && (
                    <OutlineButton
                      onClick={handleRevealAnswer}
                      className='flex items-center gap-1 md:gap-2'
                    >
                      <Eye size={16} />
                      <span className='hidden sm:inline'>Reveal Answer</span>
                    </OutlineButton>
                  )}
                </div>

                {/* Next button - loops to first region when at last */}
                <OutlineButton
                  onClick={handleNextRegion}
                  className='flex items-center gap-1 md:gap-2'
                >
                  <span className='hidden sm:inline'>Next</span>
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
