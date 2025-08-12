import { motion } from 'framer-motion';
import { Howl } from 'howler';

import optionTapSound from '/assets/sounds/options-button.wav';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

const tapHowl = new Howl({
  src: [optionTapSound],
  volume: 0.1,
  preload: true,
});

interface ChoiceOptionButtonProps {
  choiceState: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  layoutStyle?: 'single' | 'double';
}

export function ChoiceOptionButton({
  choiceState,
  isSelected,
  isDisabled = false,
  onClick,
  layoutStyle = 'single',
}: ChoiceOptionButtonProps) {
  const { isSoundEnabled } = useStore();

  const handleClick = () => {
    if (isDisabled) return;
    onClick();
    if (isSoundEnabled) {
      tapHowl.play();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      aria-label='choice'
      disabled={isDisabled}
      className={cn(
        'border-border bg-background/40 w-full rounded-md border p-1 transition-colors duration-200',
        'hover:cursor-pointer',
        {
          'max-h-30 md:max-h-80': layoutStyle === 'single',
          'min-h-[4rem] md:min-h-[5rem]': layoutStyle === 'double',
          'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
            isSelected && !isDisabled,
          'cursor-not-allowed opacity-50 hover:cursor-not-allowed': isDisabled,
        },
      )}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            }
          : {}
      }
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{
        type: 'spring',
        stiffness: 250,
        damping: 20,
      }}
    >
      <RichTextRenderer editorState={choiceState} className='max-h-30 md:max-h-80' />
    </motion.button>
  );
}
