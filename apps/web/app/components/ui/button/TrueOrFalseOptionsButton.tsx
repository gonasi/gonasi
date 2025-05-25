import type { ReactNode } from 'react';

import { OutlineButton } from './OutlineButton';

import optionTapSound from '/assets/sounds/options-button.wav';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

const tapHowl = new Howl({
  src: [optionTapSound],
  volume: 0.1,
  preload: true, // Preload for better performance
});

interface TrueOrFalseOptionsButtonProps {
  val: boolean;
  icon: ReactNode;
  isSelected: boolean;
  isDisabled?: boolean;
  selectOption: (val: boolean) => void;
}

export function TrueOrFalseOptionsButton({
  val,
  icon,
  isSelected,
  isDisabled = false,
  selectOption,
}: TrueOrFalseOptionsButtonProps) {
  const { isSoundEnabled } = useStore();

  return (
    <OutlineButton
      onClick={() => {
        selectOption(val);
        // Only play sound if not disabled and not loading
        if (!isDisabled && isSoundEnabled) {
          tapHowl.play();
        }
      }}
      leftIcon={icon}
      className={cn('relative w-full', {
        'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
          isSelected,
      })}
      disabled={isDisabled}
    >
      {val ? 'True' : 'False'}
    </OutlineButton>
  );
}
