import type { FieldMetadata } from '@conform-to/react';

import { SliderField } from '~/components/ui/forms/SliderInputField';

interface BlockWeightFieldProps {
  meta: FieldMetadata<number>;
}

export function BlockWeightField({ meta }: BlockWeightFieldProps) {
  return (
    <SliderField
      labelProps={{ children: 'Block weight ⚖️', required: true }}
      meta={meta}
      min={1}
      max={10}
      description='Adjust how important this block is when calculating overall progress 📊.'
    />
  );
}
