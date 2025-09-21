import { AlignJustify, LayoutGrid } from 'lucide-react';

import { GoRadioGroupField } from '~/components/ui/forms/elements';

interface CarouselLayoutFieldProps {
  name: string;
  watchValue: 'single' | 'double';
}

export function CarouselLayoutField({ name, watchValue }: CarouselLayoutFieldProps) {
  return (
    <GoRadioGroupField
      labelProps={{
        children: 'Carousel layout',
        endAdornment:
          watchValue === 'single' ? <AlignJustify size={14} /> : <LayoutGrid size={14} />,
        endAdornmentKey: watchValue,
      }}
      name={name}
      description='Choose how carousel items are displayed.'
      options={[
        { value: 'single', label: 'Show one card at a time' },
        { value: 'double', label: 'Show two cards side by side' },
      ]}
    />
  );
}
