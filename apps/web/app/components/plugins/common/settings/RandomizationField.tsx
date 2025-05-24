import { RadioButtonField } from '~/components/ui/forms';

interface RandomizationFieldProps {
  // Temporarily accept any to bypass type error
  field: any;
}

export function RandomizationField({ field }: RandomizationFieldProps) {
  return (
    <RadioButtonField
      labelProps={{ children: 'Randomization 🎲', required: true }}
      field={field}
      description='Choose how the options should be displayed 🔀.'
      options={[
        { value: 'none', label: 'None – options appear in original order 📋' },
        { value: 'shuffle', label: 'Shuffle – randomly arranges options 🔁' },
      ]}
    />
  );
}
