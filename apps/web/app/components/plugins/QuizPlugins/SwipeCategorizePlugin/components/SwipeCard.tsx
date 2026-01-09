import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';
import type { CardSchemaTypes } from '@gonasi/schemas/plugins';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { AssetRenderer } from '~/components/plugins/common/AssetRenderer';
import { Spinner } from '~/components/loaders';
import { cn } from '~/lib/utils';

interface FileWithSignedUrl {
  id: string;
  name: string;
  signed_url: string;
  file_type: FileType;
  extension: string;
  blur_url?: string | null;
  settings?: any;
}

interface SwipeCardProps {
  cardData: CardSchemaTypes;
  mode?: 'preview' | 'play';
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onWrongSwipe?: (direction: 'left' | 'right') => void;
  dragEnabled?: boolean;
  correctCategory?: 'left' | 'right';
  disabledDirection?: 'left' | 'right' | null;
  isFront?: boolean;
  stackIndex?: number;
}

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  shake: () => void;
}

const SWIPE_THRESHOLD = 75;
const VELOCITY_THRESHOLD = 400;

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  (
    {
      cardData,
      mode = 'play',
      onSwipeLeft,
      onSwipeRight,
      onWrongSwipe,
      dragEnabled = true,
      correctCategory,
      disabledDirection = null,
      isFront = true,
      stackIndex = 0,
    },
    ref,
  ) => {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const [isExiting, setIsExiting] = useState(false);
    const isProcessingRef = useRef(false);

    // State for asset file data
    const [assetFile, setAssetFile] = useState<FileWithSignedUrl | null>(null);
    const [assetLoading, setAssetLoading] = useState(false);
    const [assetError, setAssetError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Fetch asset with retry logic and cleanup
    useEffect(() => {
      if (cardData.contentData.type !== 'asset') return;

      const assetId = cardData.contentData.assetId;
      const fileType = cardData.contentData.fileType;
      let isMounted = true;

      const fetchAsset = async (attempt: number = 0) => {
        const maxRetries = 3;
        const retryDelay = 1000;

        if (!isMounted) return;

        setAssetLoading(true);
        setAssetError(null);

        try {
          const controller = new AbortController();
          const timeout = fileType === FileType.MODEL_3D ? 30000 : 10000;
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(`/api/files/${assetId}/signed-url?mode=${mode}`, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (!isMounted) return;

          if (data.success && data.data) {
            setAssetFile(data.data);
            setAssetError(null);
            console.log(`[SwipeCard] Successfully loaded ${fileType} asset:`, assetId);
          } else {
            throw new Error(data.message || 'Failed to load asset data');
          }
        } catch (error) {
          if (!isMounted) return;

          const isTimeout = error instanceof Error && error.name === 'AbortError';
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          console.error(`[SwipeCard] Asset load failed (attempt ${attempt + 1}/${maxRetries}):`, {
            assetId,
            fileType,
            error: errorMessage,
            isTimeout,
          });

          if (attempt < maxRetries - 1) {
            console.log(
              `[SwipeCard] Retrying in ${retryDelay * (attempt + 1)}ms... (attempt ${attempt + 2}/${maxRetries})`,
            );
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(attempt + 1);
                fetchAsset(attempt + 1);
              }
            }, retryDelay * (attempt + 1));
          } else {
            setAssetError(
              isTimeout
                ? `Timeout loading ${fileType} file.`
                : `Failed to load ${fileType}: ${errorMessage}`,
            );
          }
        } finally {
          if (isMounted) {
            setAssetLoading(false);
          }
        }
      };

      fetchAsset(retryCount);

      return () => {
        isMounted = false;
      };
    }, [cardData.contentData, mode, retryCount]);

    // Optimized rotation calculation
    const staticRotateOffset = useMemo(() => {
      return isFront ? 0 : stackIndex % 2 ? 6 : -6;
    }, [isFront, stackIndex]);

    const rotateRaw = useTransform(x, [-150, 150], [-18, 18]);
    const rotate = useTransform(rotateRaw, (value) => value + staticRotateOffset);
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

    // Direction indicator opacities
    const leftIndicatorOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
    const rightIndicatorOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

    // Reset position when card changes
    useEffect(() => {
      if (isFront && !isExiting) {
        x.set(0);
        isProcessingRef.current = false;
      }
    }, [cardData.id, x, isFront, isExiting]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        isProcessingRef.current = false;
      };
    }, []);

    const animateExit = useCallback(
      async (direction: 'left' | 'right') => {
        if (isExiting || !isFront || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsExiting(true);

        const exitX = direction === 'right' ? 1000 : -1000;
        const exitRotate = direction === 'right' ? 30 : -30;

        // Trigger callback immediately for better responsiveness
        if (direction === 'left') {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }

        // Then animate exit
        await controls.start({
          x: exitX,
          rotate: exitRotate,
          opacity: 0,
          scale: 0.8,
          transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          },
        });

        // Reset state after animation
        setIsExiting(false);
        isProcessingRef.current = false;
      },
      [isExiting, isFront, controls, onSwipeLeft, onSwipeRight],
    );

    const animateShake = useCallback(async () => {
      if (!isFront || isProcessingRef.current) return;

      isProcessingRef.current = true;

      await controls.start({
        x: [0, -20, 20, -20, 20, -10, 10, 0],
        rotate: [0, -5, 5, -5, 5, -3, 3, 0],
        scale: 1,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      });

      isProcessingRef.current = false;
    }, [isFront, controls]);

    const handleSwipe = useCallback(
      (direction: 'left' | 'right') => {
        // Prevent multiple simultaneous swipes
        if (!isFront || isProcessingRef.current || isExiting) return;

        // Check if this direction is disabled
        if (disabledDirection === direction) {
          return;
        }

        // Check if wrong direction
        if (correctCategory && correctCategory !== direction) {
          animateShake();
          onWrongSwipe?.(direction);
          return;
        }

        animateExit(direction);
      },
      [
        isFront,
        isExiting,
        disabledDirection,
        correctCategory,
        animateShake,
        animateExit,
        onWrongSwipe,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        swipeLeft: () => handleSwipe('left'),
        swipeRight: () => handleSwipe('right'),
        shake: animateShake,
      }),
      [handleSwipe, animateShake],
    );

    const handleDragEnd = useCallback(
      (_event: any, info: any) => {
        // Prevent processing if already exiting or not front card
        if (!isFront || isProcessingRef.current || isExiting) {
          controls.start({
            x: 0,
            rotate: staticRotateOffset,
            transition: { type: 'spring', stiffness: 500, damping: 30 },
          });
          return;
        }

        const { offset, velocity } = info;
        const swipe =
          Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > VELOCITY_THRESHOLD;

        if (swipe) {
          const direction = offset.x > 0 ? 'right' : 'left';
          handleSwipe(direction);
        } else {
          // Reset to center with smooth spring animation
          controls.start({
            x: 0,
            rotate: staticRotateOffset,
            transition: { type: 'spring', stiffness: 500, damping: 30 },
          });
        }
      },
      [isFront, isExiting, handleSwipe, controls, staticRotateOffset],
    );

    const dragConstraints = useMemo(() => {
      if (disabledDirection === 'left') {
        return { left: 0, right: 200 };
      }
      if (disabledDirection === 'right') {
        return { left: -200, right: 0 };
      }
      return { left: -200, right: 200 };
    }, [disabledDirection]);

    // Get display settings and determine padding/border
    const isAssetType = cardData.contentData.type === 'asset';
    const displaySettings =
      isAssetType && cardData.contentData.type === 'asset'
        ? cardData.contentData.displaySettings
        : undefined;
    const noPadding = displaySettings?.noPadding ?? false;
    const noBorder = displaySettings?.noBorder ?? false;

    return (
      <motion.div
        className={cn(
          'bg-card border-border flex h-96 w-72 origin-bottom cursor-grab flex-col rounded-lg select-none active:cursor-grabbing',
          // Conditional padding
          noPadding ? 'p-0' : 'p-4',
          // Conditional border
          noBorder ? 'border-0' : 'border',
          !dragEnabled && 'cursor-default active:cursor-default',
          !isFront && 'pointer-events-none',
        )}
        style={{
          gridRow: 1,
          gridColumn: 1,
          x: isFront ? x : 0,
          rotate: isFront ? rotate : staticRotateOffset,
          opacity: isFront ? opacity : 1,
          boxShadow: isFront
            ? '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          zIndex: isFront ? 50 : 10 - stackIndex,
          touchAction: 'pan-y',
          willChange: isFront ? 'transform' : undefined,
        }}
        animate={
          isFront
            ? controls
            : {
                scale: 0.95 - stackIndex * 0.02,
              }
        }
        initial={{ scale: isFront ? 1 : 0.95 - stackIndex * 0.02 }}
        drag={dragEnabled && !isExiting && isFront ? 'x' : false}
        dragConstraints={isFront ? dragConstraints : { left: 0, right: 0 }}
        dragElastic={0.2}
        dragDirectionLock
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragEnd={handleDragEnd}
      >
        {/* Card content */}
        <div
          className={cn(
            'flex flex-1 items-center justify-center',
            isAssetType ? (noPadding ? '' : 'p-0') : 'overflow-y-auto',
          )}
        >
          {cardData.contentData.type === 'richtext' ? (
            <RichTextRenderer editorState={cardData.contentData.content} />
          ) : assetLoading ? (
            <div className='flex flex-col items-center justify-center gap-2'>
              <Spinner />
              {cardData.contentData.fileType === FileType.MODEL_3D && (
                <p className='text-muted-foreground text-xs'>Loading 3D model...</p>
              )}
            </div>
          ) : assetError ? (
            <div className='flex flex-col items-center justify-center gap-2 p-4 text-center'>
              <AlertCircle className='text-destructive h-10 w-10' />
              <p className='text-destructive text-xs'>{assetError}</p>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  setRetryCount(0);
                }}
                className='text-primary hover:text-primary/80 flex items-center gap-1 text-xs underline'
              >
                <RefreshCw className='h-3 w-3' />
                Retry
              </button>
            </div>
          ) : assetFile ? (
            <AssetRenderer file={assetFile} displaySettings={displaySettings} />
          ) : (
            <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 p-4'>
              <AlertCircle className='h-10 w-10' />
              <p className='text-center text-xs'>Asset not found</p>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  setRetryCount(0);
                }}
                className='text-primary hover:text-primary/80 flex items-center gap-1 text-xs underline'
              >
                <RefreshCw className='h-3 w-3' />
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Direction indicators - only on front card */}
        {isFront && (
          <>
            {disabledDirection !== 'left' && (
              <motion.div
                className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2'
                style={{
                  opacity: leftIndicatorOpacity,
                }}
              >
                <ArrowLeft className='text-destructive h-16 w-16' strokeWidth={2.5} />
              </motion.div>
            )}
            {disabledDirection !== 'right' && (
              <motion.div
                className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2'
                style={{
                  opacity: rightIndicatorOpacity,
                }}
              >
                <ArrowRight className='text-success h-16 w-16' strokeWidth={2.5} />
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    );
  },
);

SwipeCard.displayName = 'SwipeCard';
