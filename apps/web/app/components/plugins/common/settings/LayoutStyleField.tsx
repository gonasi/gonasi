import { AlignJustify, LayoutGrid } from 'lucide-react';

import { GoRadioGroupField } from '~/components/ui/forms/elements';

interface LayoutStyleFieldProps {
  name: string;
  watchValue: 'single' | 'double';
}

export function LayoutStyleField({ name, watchValue }: LayoutStyleFieldProps) {
  return (
    <GoRadioGroupField
      labelProps={{
        children: 'Layout style',
        endAdornment:
          watchValue === 'single' ? <AlignJustify size={14} /> : <LayoutGrid size={14} />,
        endAdornmentKey: watchValue,
      }}
      name={name}
      description='Choose how content is arranged in this block.'
      options={[
        { value: 'single', label: 'Single column (stacked vertically)' },
        { value: 'double', label: 'Two columns (side by side)' },
      ]}
    />
  );
}
