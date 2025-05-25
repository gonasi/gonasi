import { Howl } from 'howler';
import { RefreshCw } from 'lucide-react';

import { OutlineButton } from './OutlineButton';

import tryAgainSound from '/assets/sounds/try-again-button.wav';
import { useStore } from '~/store';

const tapHowl = new Howl({
  src: [tryAgainSound],
  volume: 0.1,
  preload: true,
});

interface TryAgainButtonProps {
  onClick: () => void;
}

export function TryAgainButton({ onClick }: TryAgainButtonProps) {
  const { isSoundEnabled } = useStore();

  const handleClick = () => {
    onClick();
    if (isSoundEnabled) {
      tapHowl.play();
    }
  };

  return (
    <OutlineButton
      className='rounded-full'
      rightIcon={<RefreshCw size={16} />}
      onClick={handleClick}
    >
      Try Again
    </OutlineButton>
  );
}
