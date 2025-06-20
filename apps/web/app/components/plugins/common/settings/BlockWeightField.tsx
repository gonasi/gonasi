import { GoSliderField } from '~/components/ui/forms/elements';

interface BlockWeightFieldProps {
  name: string;
}

export function BlockWeightField({ name }: BlockWeightFieldProps) {
  return (
    <GoSliderField
      labelProps={{ children: 'Block weight' }}
      name={name}
      min={1}
      max={10}
      description='How important this block is for progress.'
    />
  );
}
