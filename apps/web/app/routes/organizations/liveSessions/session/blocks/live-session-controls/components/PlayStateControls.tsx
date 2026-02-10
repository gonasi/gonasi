import { ChevronDown, Gamepad2, LoaderCircle, PlayCircle } from 'lucide-react';

import { PLAY_STATES } from '../constants/play-states';
import type { LiveSessionPlayState } from '../types';

import useModal from '~/components/go-editor/hooks/useModal';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface PlayStateControlsProps {
  currentPlayState: LiveSessionPlayState;
  onPlayStateChange: (playState: LiveSessionPlayState, blockId?: string) => void;
  currentBlockId?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function PlayStateControls({
  currentPlayState,
  onPlayStateChange,
  currentBlockId,
  disabled = false,
  isLoading = false,
}: PlayStateControlsProps) {
  const [modal, showModal] = useModal();

  const activeState = PLAY_STATES.find((state) => state.state === currentPlayState);
  const ActiveIcon = activeState?.icon || PlayCircle;

  const handleStateChange = (state: LiveSessionPlayState, onClose: () => void) => {
    onPlayStateChange(state, currentBlockId);
    // Close modal immediately on click
    onClose();
  };

  const openStateModal = () => {
    showModal(
      'Change Play State',
      (onClose) => (
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {PLAY_STATES.filter((state) => state.state !== currentPlayState).map(
            ({ state, label, icon: Icon, description }) => (
              <Button
                key={state}
                size='sm'
                variant='secondary'
                className='flex h-auto flex-col items-start justify-start py-3'
                onClick={() => handleStateChange(state, onClose)}
                disabled={disabled}
              >
                <div className='flex w-full items-center gap-2'>
                  <Icon size={16} />
                  <span className='text-xs font-medium'>{label}</span>
                </div>
                <span className='text-muted-foreground mt-1 text-left text-[10px]'>
                  {description}
                </span>
              </Button>
            ),
          )}
        </div>
      ),
      '',
      <Gamepad2 />,
      'md',
    );
  };

  return (
    <>
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <Gamepad2 size={18} />
          <h3 className='font-semibold'>Play State</h3>
        </div>

        {/* 
          Replacing non-interactive div with a properly accessible button.
          If you want just a demo area, prefer <button> or give role and keyboard handlers.
        */}

        <button
          type='button'
          onClick={openStateModal}
          className={cn(
            'group w-full rounded-none border bg-transparent px-3 py-2',
            'text-foreground transition',
            'hover:shadow-sm',
            'hover:cursor-ponter',
            'focus:ring-border focus:ring-2 focus:outline-none',
          )}
        >
          <div className='flex items-center gap-3'>
            <ActiveIcon className='shrink-0' />

            <div className='flex min-w-0 flex-1 flex-col text-left'>
              <span className='truncate text-sm font-medium'>{activeState?.label}</span>
              <span className='text-muted-foreground truncate text-[11px] leading-tight'>
                {activeState?.description}
              </span>
            </div>

            <div className='ml-2 flex shrink-0 items-center'>
              {!isLoading ? (
                <LoaderCircle className='animate-spin' />
              ) : (
                <ChevronDown
                  className={cn('transition-transform', 'group-hover:translate-y-[1px]')}
                />
              )}
            </div>
          </div>
        </button>

        <Button
          size='sm'
          variant='default'
          className='flex h-auto flex-col items-start justify-start py-3'
          onClick={openStateModal}
          disabled={disabled || isLoading}
          isLoading={isLoading}
          leftIcon={<ActiveIcon size={16} />}
          leftIconAtEdge
        >
          <div className='flex w-full items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  <span className='text-xs font-medium'>{activeState?.label}</span>
                </>
              )}
            </div>
            {!isLoading && <ChevronDown size={14} />}
          </div>
          {!isLoading && (
            <span className='text-muted-foreground mt-1 text-left text-[10px]'>
              {activeState?.description}
            </span>
          )}
        </Button>
      </div>
      {modal}
    </>
  );
}
