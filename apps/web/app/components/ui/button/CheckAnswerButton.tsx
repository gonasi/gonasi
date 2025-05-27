import { CheckCheck } from 'lucide-react';

import { AnimateInButtonWrapper } from './AnimateInButtonWrapper';
import { Button } from './Button';

interface CheckAnswerButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function CheckAnswerButton({ disabled, onClick }: CheckAnswerButtonProps) {
  return (
    <div className='flex h-full w-full items-center justify-end'>
      <AnimateInButtonWrapper>
        <Button
          variant='secondary'
          className='rounded-full'
          rightIcon={<CheckCheck />}
          disabled={disabled}
          onClick={onClick}
        >
          Check
        </Button>
      </AnimateInButtonWrapper>
    </div>
  );
}
