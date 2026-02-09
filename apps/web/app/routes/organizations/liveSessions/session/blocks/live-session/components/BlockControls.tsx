import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

import type { LiveSessionBlock } from '@gonasi/database/liveSessions';

import type { LiveSessionBlockStatus } from '../types';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface BlockControlsProps {
  blocks: LiveSessionBlock[];
  currentBlockIndex: number;
  onBlockChange: (index: number) => void;
  onBlockStatusChange: (blockId: string, status: LiveSessionBlockStatus) => void;
  disabled?: boolean;
}

export function BlockControls({
  blocks,
  currentBlockIndex,
  onBlockChange,
  onBlockStatusChange,
  disabled = false,
}: BlockControlsProps) {
  const currentBlock = blocks[currentBlockIndex];
  const hasPrevious = currentBlockIndex > 0;
  const hasNext = currentBlockIndex < blocks.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onBlockChange(currentBlockIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onBlockChange(currentBlockIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentBlock) {
      onBlockStatusChange(currentBlock.id, 'skipped');
      if (hasNext) {
        onBlockChange(currentBlockIndex + 1);
      }
    }
  };

  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold'>Block Navigation</h3>

      {/* Current Block Info */}
      {currentBlock && (
        <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground'>Current Block</p>
              <p className='font-medium capitalize'>
                {currentBlock.plugin_type.replace(/_/g, ' ')}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-xs text-muted-foreground'>Progress</p>
              <p className='font-medium'>
                {currentBlockIndex + 1} / {blocks.length}
              </p>
            </div>
          </div>
          <div className='mt-2 flex items-center gap-2'>
            <span className='text-xs text-muted-foreground'>Status:</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                currentBlock.status === 'active' && 'bg-success/10 text-success',
                currentBlock.status === 'pending' && 'bg-gray-200 text-gray-700',
                currentBlock.status === 'completed' && 'bg-primary/10 text-primary',
                currentBlock.status === 'skipped' && 'bg-warning/10 text-warning',
              )}
            >
              {currentBlock.status}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          variant='secondary'
          leftIcon={<ChevronLeft size={16} />}
          onClick={handlePrevious}
          disabled={disabled || !hasPrevious}
          className='flex-1'
        >
          Previous
        </Button>

        <Button
          size='sm'
          variant='warning'
          leftIcon={<SkipForward size={16} />}
          onClick={handleSkip}
          disabled={disabled}
        >
          Skip
        </Button>

        <Button
          size='sm'
          variant='secondary'
          rightIcon={<ChevronRight size={16} />}
          onClick={handleNext}
          disabled={disabled || !hasNext}
          className='flex-1'
        >
          Next
        </Button>
      </div>

      {/* Block Status Actions */}
      <div className='grid grid-cols-2 gap-2'>
        <Button
          size='sm'
          variant='success'
          onClick={() => currentBlock && onBlockStatusChange(currentBlock.id, 'active')}
          disabled={disabled || !currentBlock || currentBlock.status === 'active'}
        >
          Activate
        </Button>
        <Button
          size='sm'
          variant='default'
          onClick={() => currentBlock && onBlockStatusChange(currentBlock.id, 'closed')}
          disabled={disabled || !currentBlock || currentBlock.status === 'closed'}
        >
          Close
        </Button>
        <Button
          size='sm'
          variant='secondary'
          onClick={() => currentBlock && onBlockStatusChange(currentBlock.id, 'completed')}
          disabled={disabled || !currentBlock || currentBlock.status === 'completed'}
        >
          Complete
        </Button>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => currentBlock && onBlockStatusChange(currentBlock.id, 'pending')}
          disabled={disabled || !currentBlock || currentBlock.status === 'pending'}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
