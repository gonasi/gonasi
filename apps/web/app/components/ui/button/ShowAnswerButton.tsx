import showAnswerSound from '/assets/sounds/show-answer-button.wav';
import { Button } from '~/components/ui/button';
import { useStore } from '~/store';

const tapHowl = new Howl({
  src: [showAnswerSound],
  volume: 0.1,
  preload: true, // Preload for better performance
});

interface ShowAnswerButtonProps {
  onClick: () => void;
}

export function ShowAnswerButton({ onClick }: ShowAnswerButtonProps) {
  const { isSoundEnabled } = useStore();
  return (
    <Button
      variant='secondary'
      className='rounded-full'
      onClick={() => {
        onClick();
        // Only play sound if not disabled and not loading
        if (isSoundEnabled) {
          tapHowl.play();
        }
      }}
    >
      Show Answer
    </Button>
  );
}
