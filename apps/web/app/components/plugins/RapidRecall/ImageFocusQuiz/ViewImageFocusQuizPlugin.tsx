import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { ChevronLeft, ChevronRight, Eye, Pause, Play, Settings, X } from 'lucide-react';

import type { BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useImageFocusQuizInteraction } from './hooks/useImageFocusQuizInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import useModal from '~/components/go-editor/hooks/useModal';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import { BlockActionButton, Button, OutlineButton } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

type ImageFocusQuizPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'image_focus_quiz' }>;

enum PlaybackPhase {
  INITIAL_DISPLAY = 'initial_display',
  REGION_FOCUSED = 'region_focused',
  ANSWER_REVEALED = 'answer_revealed',
  BETWEEN_REGIONS = 'between_regions',
  COMPLETE = 'complete',
}

interface ImageFocusQuizModalContentProps {
  onClose: () => void;
  regions: ImageFocusQuizPluginType['content']['regions'];
  initialDisplayDuration: number;
  revealMode: ImageFocusQuizPluginType['settings']['revealMode'];
  defaultRevealDelay: number;
  blurIntensity: number;
  dimIntensity: number;
  betweenRegionsDuration: number;
  animationDuration: number;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  fileData: { signed_url: string };
  userRandomization: 'none' | 'shuffle';
}

function ImageFocusQuizModalContent({
  onClose,
  regions,
  initialDisplayDuration,
  revealMode,
  defaultRevealDelay,
  blurIntensity,
  dimIntensity,
  betweenRegionsDuration,
  animationDuration,
  autoAdvance,
  autoAdvanceDelay,
  fileData,
  userRandomization,
}: ImageFocusQuizModalContentProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const { isSoundEnabled } = useStore();

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
  } = useImageFocusQuizInteraction(null, regions, userRandomization);

  const [playbackPhase, setPlaybackPhase] = useState<PlaybackPhase>(PlaybackPhase.INITIAL_DISPLAY);
  const [autoRevealTimer, setAutoRevealTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial display phase
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.INITIAL_DISPLAY && regions.length > 0) {
      const timer = setTimeout(() => {
        setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
      }, initialDisplayDuration * 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [playbackPhase, initialDisplayDuration, regions.length]);

  // Initialize timer when entering REGION_FOCUSED phase or changing region
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.REGION_FOCUSED) {
      const delay = currentRegion?.revealDelay ?? defaultRevealDelay;
      setTimeRemaining(delay);
    }
  }, [playbackPhase, currentRegion, defaultRevealDelay]);

  // Timer countdown - separate from initialization
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.REGION_FOCUSED && !isPaused) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            if (isSoundEnabled) {
              const audio = new Audio('/sounds/timer-complete.mp3');
              audio.play().catch(() => {});
            }
            if (revealMode === 'auto') {
              revealAnswer();
              setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
            }
            return 0;
          }
          return newTime;
        });
      }, 100);

      timerIntervalRef.current = interval;

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }
    return undefined;
  }, [playbackPhase, isPaused, isSoundEnabled, revealMode, revealAnswer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoRevealTimer) clearTimeout(autoRevealTimer);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [autoRevealTimer]);

  // Memoized handlers for performance
  const handleRevealAnswer = useCallback(() => {
    if (autoRevealTimer) {
      clearTimeout(autoRevealTimer);
      setAutoRevealTimer(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    revealAnswer();
    setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
  }, [autoRevealTimer, revealAnswer]);

  const handleNextRegion = useCallback(() => {
    setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
    setTimeout(() => {
      if (isLastRegion) {
        reset();
      } else {
        nextRegion();
      }
      setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
    }, betweenRegionsDuration * 1000);
  }, [isLastRegion, reset, nextRegion, betweenRegionsDuration]);

  const handlePreviousRegion = useCallback(() => {
    setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
    setTimeout(() => {
      if (isFirstRegion) {
        for (let i = 0; i < totalRegions - 1; i++) {
          nextRegion();
        }
      } else {
        previousRegion();
      }
      setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
    }, betweenRegionsDuration * 1000);
  }, [isFirstRegion, totalRegions, nextRegion, previousRegion, betweenRegionsDuration]);

  // Auto-advance to next region after answer is revealed
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.ANSWER_REVEALED && autoAdvance && !isPaused) {
      const timer = setTimeout(() => {
        handleNextRegion();
      }, autoAdvanceDelay * 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [playbackPhase, autoAdvance, autoAdvanceDelay, isPaused, handleNextRegion]);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

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
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const targetFillPercentage = 85;
    const scaleX = targetFillPercentage / width;
    const scaleY = targetFillPercentage / height;
    const scale = Math.min(scaleX, scaleY, 5);
    const translateX = -((centerX - 50) * scale);
    const translateY = -((centerY - 50) * scale);

    return {
      transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
      transition: `transform ${animationDuration}ms ease-in-out`,
      transformOrigin: '50% 50%',
    };
  }, [currentRegion, playbackPhase, animationDuration]);

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-4'>
        <p className='text-muted-foreground hidden text-sm md:block'>
          Explore the image regions and test your memory
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={togglePause}
            className='h-8 w-8 shrink-0 p-0'
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </Button>
          <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 shrink-0 p-0'>
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className='space-y-4'>
        {/* Progress indicator */}
        <div className='flex flex-col items-center justify-center gap-2 text-sm'>
          <span className='text-muted-foreground'>
            Region {state.currentRegionIndex + 1} of {totalRegions}
          </span>
          {isPaused && (
            <span className='bg-warning/10 text-warning border-warning/20 rounded-full border px-3 py-1 text-xs font-medium'>
              Paused
            </span>
          )}
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

            {/* Blur overlays */}
            {(playbackPhase === PlaybackPhase.REGION_FOCUSED ||
              playbackPhase === PlaybackPhase.ANSWER_REVEALED) &&
              currentRegion && (
                <>
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

        {/* Timer section */}
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
                  Click &quot;Reveal Answer&quot; when you&apos;re ready, or wait for auto-reveal
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
          <OutlineButton
            onClick={handlePreviousRegion}
            className='flex items-center gap-1 md:gap-2'
          >
            <ChevronLeft size={16} />
            <span className='hidden sm:inline'>Previous</span>
          </OutlineButton>

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

          <OutlineButton onClick={handleNextRegion} className='flex items-center gap-1 md:gap-2'>
            <span className='hidden sm:inline'>Next</span>
            <ChevronRight size={16} />
          </OutlineButton>
        </div>
      </div>
    </div>
  );
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

  const totalRegions = regions.length;

  const { is_last_block } = blockWithProgress;
  const { mode } = useStore();
  const fetcher = useFetcher<typeof loader>();
  const [modal, showModal] = useModal();

  // User preference for randomization (overrides builder setting)
  const [userRandomization, setUserRandomization] = useState<'none' | 'shuffle'>(randomization);

  const { loading, handleContinue, updateEarnedScore } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Load image
  useEffect(() => {
    if (imageId && mode) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  // Update score - always give full weight for memorization practice
  useEffect(() => {
    if (mode === 'play') {
      updateEarnedScore(weight);
    }
  }, [mode, weight, updateEarnedScore]);

  // Get file data from fetcher
  const fileData = fetcher.data?.success && fetcher.data.data ? fetcher.data.data : null;

  // Handle opening modal - show the quiz modal
  const handleOpenModal = useCallback(() => {
    if (!fileData) return;

    showModal(
      'Image Focus Memorization',
      (onClose) => (
        <ImageFocusQuizModalContent
          onClose={onClose}
          regions={regions}
          initialDisplayDuration={initialDisplayDuration}
          revealMode={revealMode}
          defaultRevealDelay={defaultRevealDelay}
          blurIntensity={blurIntensity}
          dimIntensity={dimIntensity}
          betweenRegionsDuration={betweenRegionsDuration}
          animationDuration={animationDuration}
          autoAdvance={autoAdvance}
          autoAdvanceDelay={autoAdvanceDelay}
          fileData={fileData}
          userRandomization={userRandomization}
        />
      ),
      '',
      undefined,
      'full',
    );
  }, [
    fileData,
    showModal,
    regions,
    initialDisplayDuration,
    revealMode,
    defaultRevealDelay,
    blurIntensity,
    dimIntensity,
    betweenRegionsDuration,
    animationDuration,
    autoAdvance,
    autoAdvanceDelay,
    userRandomization,
  ]);

  // For memorization, completion is only based on block progress, not quiz state
  const isComplete = blockWithProgress.block_progress?.is_completed;

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
      weight={weight}
    >
      <PlayPluginWrapper>
        <div className='relative mx-auto max-w-2xl'>
          {/* Static preview with play button */}
          <div className='space-y-6'>
            {/* Image preview */}
            <div
              className='relative flex items-center justify-center overflow-hidden rounded-lg shadow-lg'
              style={{ maxHeight: '50vh' }}
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
              <div className='flex justify-end pt-4'>
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
        {modal}
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}
