import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, PauseCircle, Play, Settings } from 'lucide-react';

import type { BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useImageFocusQuizInteraction } from './hooks/useImageFocusQuizInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import useModal from '~/components/go-editor/hooks/useModal';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import { Badge } from '~/components/ui/badge';
import { BlockActionButton, Button, IconTooltipButton } from '~/components/ui/button';
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
  const imageRef = useRef<HTMLImageElement>(null);
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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userRevealMode, setUserRevealMode] = useState<'auto' | 'manual'>(revealMode);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextRegionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-load and cache audio
  useEffect(() => {
    if (isSoundEnabled) {
      const audio = new Audio('/sounds/timer-complete.mp3');
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isSoundEnabled]);

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
            // Use cached audio for better performance
            if (isSoundEnabled && audioRef.current) {
              audioRef.current.currentTime = 0; // Reset to start
              audioRef.current.play().catch(() => {});
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

  // Cleanup all timers and resources on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (nextRegionTimeoutRef.current) {
        clearTimeout(nextRegionTimeoutRef.current);
        nextRegionTimeoutRef.current = null;
      }
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      // Clean up audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNextRegion = useCallback(() => {
    // Clear any existing timeout to prevent memory leaks
    if (nextRegionTimeoutRef.current) {
      clearTimeout(nextRegionTimeoutRef.current);
      nextRegionTimeoutRef.current = null;
    }

    setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
    nextRegionTimeoutRef.current = setTimeout(() => {
      if (isLastRegion) {
        reset();
      } else {
        nextRegion();
      }
      setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
      nextRegionTimeoutRef.current = null;
    }, betweenRegionsDuration * 1000);
  }, [isLastRegion, reset, nextRegion, betweenRegionsDuration]);

  const handlePreviousRegion = useCallback(() => {
    // Clear any existing timeout to prevent memory leaks
    if (nextRegionTimeoutRef.current) {
      clearTimeout(nextRegionTimeoutRef.current);
      nextRegionTimeoutRef.current = null;
    }

    setPlaybackPhase(PlaybackPhase.BETWEEN_REGIONS);
    nextRegionTimeoutRef.current = setTimeout(() => {
      if (isFirstRegion) {
        for (let i = 0; i < totalRegions - 1; i++) {
          nextRegion();
        }
      } else {
        previousRegion();
      }
      setPlaybackPhase(PlaybackPhase.REGION_FOCUSED);
      nextRegionTimeoutRef.current = null;
    }, betweenRegionsDuration * 1000);
  }, [isFirstRegion, totalRegions, nextRegion, previousRegion, betweenRegionsDuration]);

  // Auto-advance to next region after answer is revealed
  useEffect(() => {
    if (playbackPhase === PlaybackPhase.ANSWER_REVEALED && autoAdvance && !isPaused) {
      // Clear any existing timeout
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }

      autoAdvanceTimeoutRef.current = setTimeout(() => {
        handleNextRegion();
        autoAdvanceTimeoutRef.current = null;
      }, autoAdvanceDelay * 1000);

      return () => {
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
          autoAdvanceTimeoutRef.current = null;
        }
      };
    }
    return undefined;
  }, [playbackPhase, autoAdvance, autoAdvanceDelay, isPaused, handleNextRegion]);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Memoize current region index for performance
  const currentRegionIndex = useMemo(() => state.currentRegionIndex, [state.currentRegionIndex]);

  // Memoize dimmed intensity calculation
  const calculatedDimIntensity = useMemo(() => dimIntensity * 0.1, [dimIntensity]);

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
    <div className='flex h-full flex-col'>
      <div className='flex items-start justify-between gap-4'>
        <p className='text-muted-foreground hidden text-sm md:block'>
          Explore the image regions and test your memory
        </p>
      </div>

      <div className='flex-1 space-y-4 pb-24'>
        <div className='flex h-10 flex-col items-center justify-center'>
          <AnimatePresence mode='wait'>
            {isPaused ? (
              <motion.div
                key='paused'
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Badge variant='info'>
                  <PauseCircle />
                  Paused
                </Badge>
              </motion.div>
            ) : (
              <motion.span
                key='region-count'
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className='text-muted-foreground text-xs'
              >
                Region {currentRegionIndex + 1} of {totalRegions}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Image container */}
        <div className='relative -mx-6 flex h-[60vh] items-center justify-center overflow-hidden md:mx-0'>
          {/* ZOOM LAYER */}
          <div
            className='relative'
            style={{
              ...regionStyle,
              transformOrigin: 'center center',
              transition: `transform ${animationDuration}ms ease-in-out`,
            }}
          >
            {/* IMAGE BOUNDS (true coordinate system) */}
            <div className='relative max-h-[60vh] max-w-full'>
              <img
                ref={imageRef}
                src={fileData.signed_url}
                alt='Focus quiz'
                className='block max-h-[60vh] max-w-full object-contain'
                crossOrigin='anonymous'
              />

              {/* Blur overlays */}
              {(playbackPhase === PlaybackPhase.REGION_FOCUSED ||
                playbackPhase === PlaybackPhase.ANSWER_REVEALED) &&
                currentRegion && (
                  <>
                    <div
                      className='pointer-events-none absolute inset-x-0'
                      style={{
                        top: 0,
                        height: `${currentRegion.y}%`,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                    <div
                      className='pointer-events-none absolute inset-x-0'
                      style={{
                        top: `${currentRegion.y + currentRegion.height}%`,
                        bottom: 0,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                    <div
                      className='pointer-events-none absolute inset-y-0'
                      style={{
                        left: 0,
                        width: `${currentRegion.x}%`,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                    <div
                      className='pointer-events-none absolute inset-y-0'
                      style={{
                        left: `${currentRegion.x + currentRegion.width}%`,
                        right: 0,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                  </>
                )}
            </div>
          </div>
        </div>

        {/* Timer section */}
        <AnimatePresence mode='wait'>
          {playbackPhase === PlaybackPhase.REGION_FOCUSED && currentRegion && (
            <motion.div
              key='timer-section'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {revealMode === 'manual' && (
                <div className='bg-card rounded-lg border p-4 shadow-sm md:p-6'>
                  <div className='space-y-3'>
                    <p className='text-muted-foreground text-xs md:text-sm'>
                      Click &quot;Reveal Answer&quot; when you&apos;re ready, or wait for
                      auto-reveal
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control buttons - Fixed at bottom */}
        <div className='fixed inset-x-0 bottom-0 z-50'>
          {/* Answer section with playful animations */}
          <AnimatePresence mode='wait'>
            {playbackPhase === PlaybackPhase.ANSWER_REVEALED && currentRegion && (
              <motion.div
                key={`answer-${currentRegionIndex}`}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  duration: 0.5,
                }}
                className='bg-card mx-auto max-w-2xl p-4 shadow-xs'
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className='text-sm md:text-base'
                >
                  {/* Celebratory sparkle effect */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: 'easeOut',
                    }}
                  >
                    <RichTextRenderer editorState={currentRegion.answerState} />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar with smooth animation */}
          <motion.div
            className='bg-muted h-1 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className='from-secondary/70 to-primary/70 h-full bg-gradient-to-r'
              initial={{ width: '100%' }}
              animate={{
                width: `${
                  currentRegion
                    ? (
                        (timeRemaining / (currentRegion.revealDelay ?? defaultRevealDelay)) *
                        100
                      ).toFixed(2)
                    : '0'
                }%`,
              }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </motion.div>

          {/* Control buttons with hover animations */}
          <motion.div
            className='mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4 md:px-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconTooltipButton
                title='Previous'
                icon={ChevronLeft}
                onClick={handlePreviousRegion}
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconTooltipButton
                title={isPaused ? 'Resume' : 'Pause'}
                icon={isPaused ? Play : Pause}
                onClick={togglePause}
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconTooltipButton title='Next' icon={ChevronRight} onClick={handleNextRegion} />
            </motion.div>
          </motion.div>
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
