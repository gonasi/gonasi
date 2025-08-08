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
  layoutStyle?: 'single' | 'double'; // Add layout prop to determine height strategy
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
    onClick();
    if (!isDisabled && isSoundEnabled) {
      tapHowl.play();
    }
  };

  return (
    <OutlineButton
      onClick={handleClick}
      className={cn('relative m-0 h-full w-full justify-start p-0', {
        'md:max-h-100': layoutStyle === 'single',
        'min-h-[4rem] md:min-h-[5rem]': layoutStyle === 'double',
        'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
          isSelected,
      })}
      disabled={isDisabled}
    >
      <div className='flex h-full items-start'>
        <RichTextRenderer
          editorState={choiceState}
          className={cn('max-h-30 md:max-h-80', {
            // Center content vertically in double layout for better visual balance
            'flex min-h-[3rem] items-center md:min-h-[4rem]': layoutStyle === 'double',
          })}
        />
      </div>
    </OutlineButton>
  );
}
