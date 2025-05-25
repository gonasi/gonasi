import { Howl } from 'howler';

import { OutlineButton } from './OutlineButton';

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
}

export function ChoiceOptionButton({
  choiceState,
  isSelected,
  isDisabled = false,
  onClick,
}: ChoiceOptionButtonProps) {
  const { isSoundEnabled } = useStore();

  const handleClick = () => {
    onClick();
    if (!isDisabled && isSoundEnabled) {
      tapHowl.play();
    }
  };

  return (
    <OutlineButton
      onClick={handleClick}
      className={cn('relative h-fit w-full justify-start text-left md:max-h-50', {
        'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
          isSelected,
      })}
      disabled={isDisabled}
    >
      <div className='flex items-start'>
        <RichTextRenderer editorState={choiceState} className='max-h-30 md:max-h-40' />
      </div>
    </OutlineButton>
  );
}
