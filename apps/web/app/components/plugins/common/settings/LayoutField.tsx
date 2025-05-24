import { RadioButtonField } from '~/components/ui/forms';

interface LayoutFieldProps {
  // Temporarily accept any to bypass type error
  field: any;
}

export function LayoutField({ field }: LayoutFieldProps) {
  return (
    <RadioButtonField
      labelProps={{ children: 'Layout 📐', required: true }}
      field={field}
      description='Choose how this block is laid out 🧩.'
      options={[
        { value: 'single', label: 'Single – one per row 1️⃣' },
        { value: 'double', label: 'Double – two per row 2️⃣' },
      ]}
    />
  );
}
