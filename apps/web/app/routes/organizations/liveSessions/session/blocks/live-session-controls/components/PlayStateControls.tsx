import { motion } from 'framer-motion';
import { Gamepad2, type LucideIcon, PlayCircle } from 'lucide-react';

import { PlayStateButton } from '../../components/PlayStateButton';
import { getValidPlayStateTransitions, PLAY_STATES } from '../constants/play-states';
import type { LiveSessionPlayState } from '../types';

import useModal from '~/components/go-editor/hooks/useModal';

interface PlayStateControlsProps {
  currentPlayState: LiveSessionPlayState | null;
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

  // Handle null play state (session not started yet)
  const isSessionNotStarted = currentPlayState === null;
  const activeState = currentPlayState ? PLAY_STATES.find((state) => state.state === currentPlayState) : null;
  const ActiveIcon = activeState?.icon || PlayCircle;

  const handleStateChange = (state: LiveSessionPlayState, onClose: () => void) => {
    onPlayStateChange(state, currentBlockId);
    // Close modal immediately on click
    onClose();
  };

  const openStateModal = () => {
    // Cannot change play state if session hasn't started
    if (isSessionNotStarted) {
      return;
    }

    // Get valid transitions for current state
    const validTransitions = getValidPlayStateTransitions(currentPlayState!);

    // Filter play states to only show valid transitions
    const availableStates = PLAY_STATES.filter((state) => validTransitions.includes(state.state));

    showModal(
      'Change Play State',
      (onClose) => (
        <motion.div
          className='grid grid-cols-1 gap-2'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {availableStates.length === 0 ? (
            <div className='text-muted-foreground col-span-2 py-6 text-center text-sm'>
              No valid state transitions available from <strong>{activeState?.label}</strong>.
            </div>
          ) : (
            availableStates.map(({ state, label, icon, description }, index) => (
              <motion.div
                key={state}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <PlayStateButton
                  icon={icon as LucideIcon}
                  label={label}
                  description={description}
                  onClick={() => handleStateChange(state, onClose)}
                  disabled={disabled}
                  isLoading={isLoading}
                  showPresentationIcon
                />
              </motion.div>
            ))
          )}
        </motion.div>
      ),
      '',
      <Gamepad2 />,
      'md',
    );
  };

  return (
    <>
      <motion.div
        className='space-y-3'
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className='flex items-center gap-2'
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ duration: 0.2 }}>
            <Gamepad2 size={18} />
          </motion.div>
          <h3 className='text-lg font-semibold'>Play State</h3>
        </motion.div>

        <PlayStateButton
          icon={ActiveIcon as LucideIcon}
          label={isSessionNotStarted ? 'Not Started' : activeState?.label || ''}
          description={
            isSessionNotStarted
              ? 'Start the session to activate play state controls'
              : activeState?.description || ''
          }
          onClick={openStateModal}
          disabled={disabled || isSessionNotStarted}
          isLoading={isLoading}
          showChevron={!isSessionNotStarted}
        />
      </motion.div>
      {modal}
    </>
  );
}
