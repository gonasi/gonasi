import { GoRadioGroupField } from '~/components/ui/forms/elements';

interface CanSkipFieldProps {
  name: string;
}

export function CanSkipField({ name }: CanSkipFieldProps) {
  return (
    <GoRadioGroupField
      labelProps={{
        children: 'Can learners skip this block?',
      }}
      name={name}
      description='Control whether learners must complete this block to progress.'
      options={[
        { value: 'false', label: 'Required – learners must complete it' },
        { value: 'true', label: 'Skippable – learners can move past it' },
      ]}
    />
  );
}
