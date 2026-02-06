import { Circle, Flame, Zap } from 'lucide-react';

import { GoRadioGroupField } from '~/components/ui/forms/elements';

interface DifficultyFieldProps {
  name: string;
  watchValue: 'easy' | 'medium' | 'hard';
}

export function DifficultyField({ name, watchValue }: DifficultyFieldProps) {
  const getIcon = () => {
    switch (watchValue) {
      case 'easy':
        return <Circle size={14} />;
      case 'medium':
        return <Zap size={14} />;
      case 'hard':
        return <Flame size={14} />;
    }
  };

  return (
    <GoRadioGroupField
      labelProps={{
        children: 'Difficulty level',
        endAdornment: getIcon(),
        endAdornmentKey: watchValue,
      }}
      name={name}
      description='Set the difficulty level for scoring and analytics.'
      options={[
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ]}
    />
  );
}
