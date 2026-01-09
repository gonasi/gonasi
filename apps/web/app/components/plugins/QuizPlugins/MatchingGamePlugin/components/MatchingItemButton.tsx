import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

import type { FileType } from '@gonasi/schemas/file';
import type { CardContentSchemaTypes } from '@gonasi/schemas/plugins';

import type { MatchColor } from '../utils/colors';

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

  // Fetch asset if content type is 'asset'
  useEffect(() => {
    if (contentData.type === 'asset') {
      const assetId = contentData.assetId;
      setAssetLoading(true);
      fetch(`/api/files/${assetId}/signed-url?mode=${mode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAssetFile(data.data);
          }
        })
        .catch((error) => {
          console.error('Failed to load asset:', error);
        })
        .finally(() => {
          setAssetLoading(false);
        });
    }
  }, [contentData, mode]);

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
            <Spinner />
          ) : assetFile ? (
            <div className='h-full w-full'>
              <AssetRenderer file={assetFile} displaySettings={contentData.displaySettings} />
            </div>
          ) : (
            <div className='text-muted-foreground text-sm'>Asset not found</div>
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
            'absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background',
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
          className='bg-destructive text-destructive-foreground absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background'
        >
          <X className='h-4 w-4' strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}
