import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, RefreshCw, X } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';
import type { CardContentSchemaTypes } from '@gonasi/schemas/plugins';

import type { MatchColor } from '../utils/colors';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import { AssetRenderer } from '~/components/plugins/common/AssetRenderer';
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

interface MatchingItemButtonProps {
  contentData: CardContentSchemaTypes;
  mode?: 'preview' | 'play';
  isSelected?: boolean;
  isMatched?: boolean;
  isDisabled?: boolean;
  isWrong?: boolean;
  matchColor?: MatchColor;
  shouldPulse?: boolean; // Pulse to indicate user should interact (right items)
  shouldPulseSubtle?: boolean; // Subtle pulse for left items when nothing selected
  shouldNudge?: boolean; // Nudge when match is made
  onClick?: () => void;
}

export function MatchingItemButton({
  contentData,
  mode = 'play',
  isSelected = false,
  isMatched = false,
  isDisabled = false,
  isWrong = false,
  matchColor,
  shouldPulse = false,
  shouldPulseSubtle = false,
  shouldNudge = false,
  onClick,
}: MatchingItemButtonProps) {
  const [assetFile, setAssetFile] = useState<FileWithSignedUrl | null>(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch asset with retry logic for reliability
  useEffect(() => {
    if (contentData.type !== 'asset') return;

    const assetId = contentData.assetId;
    const fileType = contentData.fileType;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const fetchAsset = async (attempt: number = 0) => {
      setAssetLoading(true);
      setAssetError(null);

      try {
        const controller = new AbortController();
        // Longer timeout for 3D files (30s), normal for others (10s)
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

        if (data.success && data.data) {
          setAssetFile(data.data);
          setAssetError(null);
          console.log(`[MatchingItemButton] Successfully loaded ${fileType} asset:`, assetId);
        } else {
          throw new Error(data.message || 'Failed to load asset data');
        }
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error(
          `[MatchingItemButton] Asset load failed (attempt ${attempt + 1}/${maxRetries}):`,
          {
            assetId,
            fileType,
            error: errorMessage,
            isTimeout,
          },
        );

        // Retry logic
        if (attempt < maxRetries - 1) {
          console.log(
            `[MatchingItemButton] Retrying in ${retryDelay}ms... (attempt ${attempt + 2}/${maxRetries})`,
          );
          setTimeout(
            () => {
              setRetryCount(attempt + 1);
              fetchAsset(attempt + 1);
            },
            retryDelay * (attempt + 1),
          ); // Exponential backoff
        } else {
          setAssetError(
            isTimeout
              ? `Timeout loading ${fileType} file. The file may be too large.`
              : `Failed to load ${fileType}: ${errorMessage}`,
          );
        }
      } finally {
        setAssetLoading(false);
      }
    };

    fetchAsset(retryCount);
  }, [contentData, mode, retryCount]);

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  // Determine animation state
  const getAnimateProps = () => {
    // Pulse animation when left is selected and right items should be picked
    if (shouldPulse && !isMatched && !isDisabled) {
      return {
        scale: [1, 1.03, 1],
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0)',
          '0 0 0 4px rgba(59, 130, 246, 0.2)',
          '0 0 0 0 rgba(59, 130, 246, 0)',
        ],
      };
    }

    // Subtle pulse for left items when nothing is selected (guide to start)
    if (shouldPulseSubtle && !isMatched && !isDisabled && !isSelected) {
      return {
        scale: [1, 1.015, 1],
      };
    }

    // Selected left item subtle pulse
    if (isSelected && !isMatched) {
      return {
        scale: [1, 1.01, 1],
      };
    }

    return {};
  };

  const getTransitionProps = () => {
    // Pulse animation for right items
    if (shouldPulse && !isMatched && !isDisabled) {
      return {
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: 'easeInOut' as const,
      };
    }

    // Subtle pulse for left items when nothing selected
    if (shouldPulseSubtle && !isMatched && !isDisabled && !isSelected) {
      return {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: 'easeInOut' as const,
      };
    }

    // Selected left item pulse
    if (isSelected && !isMatched) {
      return {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      };
    }

    return { duration: 0.3 };
  };

  return (
    <motion.button
      type='button'
      onClick={handleClick}
      disabled={isDisabled}
      // Key changes when shouldNudge changes to force animation re-trigger
      key={shouldNudge ? 'nudging' : 'idle'}
      className={cn(
        'relative flex w-full items-center rounded-lg border-2 p-4 text-left transition-all duration-200',
        // Base state with hover cursor
        !isMatched &&
          !isSelected &&
          !isDisabled &&
          'border-border hover:border-primary hover:bg-accent/50 hover:cursor-pointer',
        // Selected state with glow
        isSelected &&
          !isMatched &&
          'border-primary bg-primary/5 shadow-primary/20 shadow-lg hover:cursor-pointer',
        // Matched state with color (only border, no background)
        isMatched && matchColor && `${matchColor.border} cursor-not-allowed`,
        // Matched state without color (fallback)
        isMatched && !matchColor && 'border-success cursor-not-allowed',
        // Disabled state (wrong attempt)
        isDisabled && !isMatched && 'border-border cursor-not-allowed opacity-50',
        // Pulsing state gets subtle highlight
        shouldPulse && !isMatched && !isDisabled && 'ring-primary/30 ring-1',
      )}
      // Initial state for nudge animation
      initial={shouldNudge ? { scale: 1, x: 0, rotate: 0 } : false}
      // Nudge animation when triggered
      animate={
        shouldNudge
          ? {
              scale: [1, 1.15, 1.15, 1],
              x: [0, -10, 10, -10, 10, 0],
              rotate: [0, -3, 3, -3, 3, 0],
            }
          : getAnimateProps()
      }
      transition={
        shouldNudge
          ? {
              duration: 0.6,
              ease: 'easeOut' as const,
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            }
          : getTransitionProps()
      }
      whileHover={
        !isDisabled && !isMatched
          ? {
              scale: 1.02,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            }
          : {}
      }
      whileTap={!isDisabled && !isMatched ? { scale: 0.98 } : {}}
    >
      {/* Content container - ensures assets fit properly */}
      <div className='flex-1 overflow-hidden'>
        <div
          className={cn(
            contentData.type === 'asset' ? 'flex items-center justify-center' : '',
            contentData.type === 'asset' ? 'h-20' : '', // Fixed height for asset content
          )}
        >
          {contentData.type === 'richtext' ? (
            <RichTextRenderer editorState={contentData.content} />
          ) : assetLoading ? (
            <div className='flex flex-col items-center justify-center gap-2'>
              <Spinner />
              {contentData.fileType === FileType.MODEL_3D && (
                <p className='text-muted-foreground text-xs'>Loading 3D model...</p>
              )}
            </div>
          ) : assetError ? (
            <div className='flex flex-col items-center justify-center gap-2 text-center'>
              <AlertCircle className='text-destructive h-8 w-8' />
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
            <div className='h-full w-full'>
              <AssetRenderer file={assetFile} displaySettings={contentData.displaySettings} />
            </div>
          ) : (
            <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 text-center'>
              <AlertCircle className='h-8 w-8' />
              <p className='text-xs'>Asset not found</p>
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
      </div>

      {/* Status indicators - positioned outside at top right */}
      {isMatched && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={cn(
            'border-background absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2',
            matchColor ? `${matchColor.bg}` : 'bg-success',
          )}
        >
          <Check
            className={cn('h-4 w-4 font-bold', matchColor ? matchColor.text : 'text-white')}
            strokeWidth={3}
          />
        </motion.div>
      )}
      {isWrong && !isMatched && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{
            scale: 1,
            rotate: 0,
            x: [0, -2, 2, -2, 2, 0],
          }}
          transition={{
            scale: { type: 'spring', stiffness: 200, damping: 15 },
            rotate: { duration: 0.3 },
            x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
          }}
          className='bg-destructive text-destructive-foreground border-background absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2'
        >
          <X className='h-4 w-4' strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}
