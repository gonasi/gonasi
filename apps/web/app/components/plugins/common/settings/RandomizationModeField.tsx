import { Ban, Shuffle } from 'lucide-react';

import { GoRadioGroupField } from '~/components/ui/forms/elements';

interface RandomizationModeFieldProps {
  name: string;
  watchValue: 'none' | 'shuffle';
}

export function RandomizationModeField({ name, watchValue }: RandomizationModeFieldProps) {
  return (
    <GoRadioGroupField
      labelProps={{
        children: 'Randomization',
        endAdornment: watchValue === 'shuffle' ? <Shuffle size={14} /> : <Ban size={14} />,
        endAdornmentKey: watchValue,
      }}
      name={name}
      description='Control the order in which items are presented.'
      options={[
        { value: 'none', label: 'None – fixed order' },
        { value: 'shuffle', label: 'Shuffle – random order each time' },
      ]}
    />
  );
}
