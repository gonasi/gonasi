import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Howl } from 'howler';
import { ChevronLeft, ChevronRight, Pause, PauseCircle, Play, Settings } from 'lucide-react';

import type { BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useImageFocusQuizInteraction } from './hooks/useImageFocusQuizInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import rightAnswer from '/assets/sounds/right-answer.mp3';
import useModal from '~/components/go-editor/hooks/useModal';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import { Badge } from '~/components/ui/badge';
import { BlockActionButton, Button, IconTooltipButton } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Switch } from '~/components/ui/switch';
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

// Create Howl instance for timer complete sound - reused across all quiz instances
const timerCompleteHowl = new Howl({
  src: [rightAnswer],
  volume: 0.5,
  preload: true,
});

interface ImageFocusQuizModalContentProps {
  onClose: () => void;
  regions: ImageFocusQuizPluginType['content']['regions'];
  initialDisplayDuration: number;
  defaultRevealDelay: number;
  blurIntensity: number;
  dimIntensity: number;
  betweenRegionsDuration: number;
  animationDuration: number;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  fileData: { signed_url: string };
  userRandomization: 'none' | 'shuffle';
  userRevealMode: 'auto' | 'manual';
  userPlayAudio: boolean;
}

function ImageFocusQuizModalContent({
  regions,
  initialDisplayDuration,
  defaultRevealDelay,
  blurIntensity,
  dimIntensity,
  betweenRegionsDuration,
  animationDuration,
  autoAdvance,
  autoAdvanceDelay,
  fileData,
  userRandomization,
  userRevealMode,
  userPlayAudio,
}: ImageFocusQuizModalContentProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const { isSoundEnabled, mode } = useStore();
  const audioFetcher = useFetcher<typeof loader>();

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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const regionAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextRegionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCleanupInProgressRef = useRef(false);

  // Cache for audio URLs to prevent re-fetching during loops
  const audioUrlCacheRef = useRef<Map<string, { signed_url: string; name: string }>>(new Map());

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

            if (userRevealMode === 'auto') {
              // Play success sound first, then reveal answer after it finishes
              if (isSoundEnabled) {
                const soundId = timerCompleteHowl.play();
                // Wait for sound to finish before revealing
                timerCompleteHowl.once(
                  'end',
                  () => {
                    revealAnswer();
                    setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
                  },
                  soundId,
                );
              } else {
                // No sound, reveal immediately
                revealAnswer();
                setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
              }
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
  }, [playbackPhase, isPaused, isSoundEnabled, userRevealMode, revealAnswer]);

  // Cleanup audio function - centralized and reliable
  const cleanupAudio = useCallback(() => {
    if (regionAudioRef.current) {
      try {
        audioCleanupInProgressRef.current = true;
        regionAudioRef.current.pause();
        regionAudioRef.current.currentTime = 0;
        regionAudioRef.current.src = '';
        regionAudioRef.current = null;
        setIsAudioPlaying(false);
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      } finally {
        audioCleanupInProgressRef.current = false;
      }
    }
  }, []);

  // Load region audio when region changes (with caching)
  useEffect(() => {
    // Clean up previous audio immediately when region changes
    cleanupAudio();

    if (currentRegion?.audioId && mode) {
      // Only fetch if not already in cache
      if (!audioUrlCacheRef.current.has(currentRegion.audioId)) {
        audioFetcher.load(`/api/files/${currentRegion.audioId}/signed-url?mode=${mode}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRegion?.audioId, mode]);

  // Play region audio when answer is revealed
  useEffect(() => {
    // Don't start new audio if cleanup is in progress
    if (audioCleanupInProgressRef.current) return undefined;

    if (
      playbackPhase === PlaybackPhase.ANSWER_REVEALED &&
      isSoundEnabled &&
      userPlayAudio &&
      currentRegion?.audioId
    ) {
      // Check cache first
      let audioData = audioUrlCacheRef.current.get(currentRegion.audioId);

      // If not in cache, check fetcher data
      if (!audioData && audioFetcher.data?.success && audioFetcher.data.data) {
        audioData = audioFetcher.data.data;
        // Store in cache for future use
        audioUrlCacheRef.current.set(currentRegion.audioId, audioData);
      }

      if (audioData?.signed_url) {
        // Clean up any existing audio first
        cleanupAudio();

        const audio = new Audio(audioData.signed_url);
        audio.preload = 'auto';
        regionAudioRef.current = audio;

        setIsAudioPlaying(true);

        const handleEnded = () => {
          setIsAudioPlaying(false);
          if (regionAudioRef.current === audio) {
            regionAudioRef.current = null;
          }
        };

        const handleError = (e: ErrorEvent | Event) => {
          console.error('Audio playback error:', e);
          setIsAudioPlaying(false);
          if (regionAudioRef.current === audio) {
            regionAudioRef.current = null;
          }
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        audio.play().catch((error) => {
          console.error('Failed to play audio:', error);
          setIsAudioPlaying(false);
          if (regionAudioRef.current === audio) {
            regionAudioRef.current = null;
          }
        });

        return () => {
          audio.pause();
          audio.currentTime = 0;
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          if (regionAudioRef.current === audio) {
            regionAudioRef.current = null;
          }
        };
      }
    }
    return undefined;
  }, [
    playbackPhase,
    isSoundEnabled,
    userPlayAudio,
    currentRegion?.audioId,
    audioFetcher.data,
    cleanupAudio,
  ]);

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
      // Clean up region audio
      if (regionAudioRef.current) {
        regionAudioRef.current.pause();
        regionAudioRef.current = null;
      }
      // Clear audio URL cache
      audioUrlCacheRef.current.clear();
    };
  }, []);

  const handleNextRegion = useCallback(() => {
    // Stop and cleanup audio immediately
    cleanupAudio();

    // Clear any existing timeout to prevent memory leaks
    if (nextRegionTimeoutRef.current) {
      clearTimeout(nextRegionTimeoutRef.current);
      nextRegionTimeoutRef.current = null;
    }

    // Clear auto-advance timeout if navigating manually
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
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
  }, [isLastRegion, reset, nextRegion, betweenRegionsDuration, cleanupAudio]);

  const handlePreviousRegion = useCallback(() => {
    // Stop and cleanup audio immediately
    cleanupAudio();

    // Clear any existing timeout to prevent memory leaks
    if (nextRegionTimeoutRef.current) {
      clearTimeout(nextRegionTimeoutRef.current);
      nextRegionTimeoutRef.current = null;
    }

    // Clear auto-advance timeout if navigating manually
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
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
  }, [
    isFirstRegion,
    totalRegions,
    nextRegion,
    previousRegion,
    betweenRegionsDuration,
    cleanupAudio,
  ]);

  // Auto-advance to next region after answer is revealed
  useEffect(() => {
    if (
      playbackPhase === PlaybackPhase.ANSWER_REVEALED &&
      autoAdvance &&
      !isPaused &&
      !isAudioPlaying
    ) {
      // Clear any existing timeout
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }

      // If there was audio, add 1 second delay after it finishes
      // Otherwise use the configured autoAdvanceDelay
      const delayToUse = currentRegion?.audioId ? 1 : autoAdvanceDelay;

      autoAdvanceTimeoutRef.current = setTimeout(() => {
        handleNextRegion();
        autoAdvanceTimeoutRef.current = null;
      }, delayToUse * 1000);

      return () => {
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
          autoAdvanceTimeoutRef.current = null;
        }
      };
    }
    return undefined;
  }, [
    playbackPhase,
    autoAdvance,
    autoAdvanceDelay,
    isPaused,
    isAudioPlaying,
    currentRegion?.audioId,
    handleNextRegion,
  ]);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const newPausedState = !prev;

      // When pausing, stop any playing audio
      if (newPausedState && regionAudioRef.current) {
        cleanupAudio();
      }

      return newPausedState;
    });
  }, [cleanupAudio]);

  // Manual reveal handler
  const handleManualReveal = useCallback(() => {
    if (playbackPhase === PlaybackPhase.REGION_FOCUSED) {
      // Clear the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Play success sound first, then reveal answer after it finishes
      if (isSoundEnabled) {
        const soundId = timerCompleteHowl.play();
        // Wait for sound to finish before revealing
        timerCompleteHowl.once(
          'end',
          () => {
            revealAnswer();
            setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
          },
          soundId,
        );
      } else {
        // No sound, reveal immediately
        revealAnswer();
        setPlaybackPhase(PlaybackPhase.ANSWER_REVEALED);
      }
    }
  }, [playbackPhase, isSoundEnabled, revealAnswer]);

  // Memoize current region index for performance
  const currentRegionIndex = useMemo(() => state.currentRegionIndex, [state.currentRegionIndex]);

  // Memoize dimmed intensity calculation
  const calculatedDimIntensity = useMemo(() => dimIntensity * 0.1, [dimIntensity]);

  // Memoize current region to prevent unnecessary recalculations
  const memoizedCurrentRegion = useMemo(() => currentRegion, [currentRegion?.id]);

  const regionStyle = useMemo(() => {
    if (
      !memoizedCurrentRegion ||
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

    const { x, y, width, height } = memoizedCurrentRegion;
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
  }, [memoizedCurrentRegion, playbackPhase, animationDuration]);

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
                memoizedCurrentRegion && (
                  <>
                    <div
                      className='pointer-events-none absolute inset-x-0'
                      style={{
                        top: 0,
                        height: `${memoizedCurrentRegion.y}%`,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                    <div
                      className='pointer-events-none absolute inset-x-0'
                      style={{
                        top: `${memoizedCurrentRegion.y + memoizedCurrentRegion.height}%`,
                        bottom: 0,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                    <div
                      className='pointer-events-none absolute inset-y-0'
                      style={{
                        left: 0,
                        width: `${memoizedCurrentRegion.x}%`,
                        backgroundColor: `rgba(0,0,0,${calculatedDimIntensity})`,
                        backdropFilter: `blur(${blurIntensity}px)`,
                      }}
                    />
                    <div
                      className='pointer-events-none absolute inset-y-0'
                      style={{
                        left: `${memoizedCurrentRegion.x + memoizedCurrentRegion.width}%`,
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
          {playbackPhase === PlaybackPhase.REGION_FOCUSED && memoizedCurrentRegion && (
            <motion.div
              key='timer-section'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {userRevealMode === 'manual' && (
                <div className='bg-card flex items-center justify-center rounded-lg border p-4 shadow-sm md:p-6'>
                  <Button
                    onClick={handleManualReveal}
                    size='lg'
                    variant='default'
                    className='min-w-48'
                  >
                    Reveal Answer
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control buttons - Fixed at bottom */}
        <div className='fixed inset-x-0 bottom-0 z-50'>
          {/* Answer section with playful animations */}
          <AnimatePresence mode='wait'>
            {playbackPhase === PlaybackPhase.ANSWER_REVEALED && memoizedCurrentRegion && (
              <motion.div
                key={`answer-${currentRegionIndex}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 22,
                }}
                className='bg-card mx-auto max-w-2xl p-4 shadow-xs'
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.25 }}
                  className='text-sm md:text-base'
                >
                  {/* Celebratory sparkle effect */}
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1.05, 1] }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                  >
                    <RichTextRenderer editorState={memoizedCurrentRegion.answerState} />
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
                  memoizedCurrentRegion
                    ? (
                        (timeRemaining /
                          (memoizedCurrentRegion.revealDelay ?? defaultRevealDelay)) *
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
      playAudio,
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

  // User preference for reveal mode (overrides builder setting)
  const [userRevealMode, setUserRevealMode] = useState<'auto' | 'manual'>(revealMode);

  // User preference for audio playback (overrides builder setting)
  const [userPlayAudio, setUserPlayAudio] = useState<boolean>(playAudio);

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
          defaultRevealDelay={defaultRevealDelay}
          blurIntensity={blurIntensity}
          dimIntensity={dimIntensity}
          betweenRegionsDuration={betweenRegionsDuration}
          animationDuration={animationDuration}
          autoAdvance={autoAdvance}
          autoAdvanceDelay={autoAdvanceDelay}
          fileData={fileData}
          userRandomization={userRandomization}
          userRevealMode={userRevealMode}
          userPlayAudio={userPlayAudio}
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
    defaultRevealDelay,
    blurIntensity,
    dimIntensity,
    betweenRegionsDuration,
    animationDuration,
    autoAdvance,
    autoAdvanceDelay,
    userRandomization,
    userRevealMode,
    userPlayAudio,
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
                <p className='font-secondary'>Click Play to start the interactive experience.</p>
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
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Button variant='ghost' size='lg' className='h-12 w-12 p-0'>
                      <Settings
                        className='text-muted-foreground transition-transform duration-200 hover:scale-110 hover:rotate-90'
                        size={20}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='max-h-120 w-80 overflow-y-auto'>
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
                      </div>{' '}
                      <div className='space-y-3'>
                        <Label className='text-sm font-medium'>Reveal Mode</Label>
                        <RadioGroup
                          value={userRevealMode}
                          onValueChange={(value) => setUserRevealMode(value as 'auto' | 'manual')}
                        >
                          <div className='flex items-start space-y-0 space-x-3'>
                            <RadioGroupItem value='auto' id='reveal-auto' />
                            <div className='-mt-2 flex-1'>
                              <Label
                                htmlFor='reveal-auto'
                                className='cursor-pointer leading-tight font-normal'
                              >
                                Auto Reveal
                              </Label>
                              <p className='text-muted-foreground mt-1 text-xs'>
                                Answer reveals automatically when timer expires
                              </p>
                            </div>
                          </div>

                          <div className='flex items-start space-y-0 space-x-3'>
                            <RadioGroupItem value='manual' id='reveal-manual' />
                            <div className='-mt-2 flex-1'>
                              <Label
                                htmlFor='reveal-manual'
                                className='cursor-pointer leading-tight font-normal'
                              >
                                Manual Reveal
                              </Label>
                              <p className='text-muted-foreground mt-1 text-xs'>
                                Click button to reveal answer when ready
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className='space-y-3'>
                        <Label className='text-sm font-medium'>Audio Playback</Label>
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <Label
                              htmlFor='play-audio'
                              className='cursor-pointer leading-tight font-normal'
                            >
                              Play region audio
                            </Label>
                            <p className='text-muted-foreground mt-1 text-xs'>
                              Play audio files when answers are revealed
                            </p>
                          </div>
                          <Switch
                            id='play-audio'
                            checked={userPlayAudio}
                            onCheckedChange={setUserPlayAudio}
                          />
                        </div>
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
