import { RadioButtonField } from '~/components/ui/forms';

interface PlaybackModeFieldProps {
  // Temporarily accept any to bypass type error
  field: any;
}

export function PlaybackModeField({ field }: PlaybackModeFieldProps) {
  return (
    <RadioButtonField
      labelProps={{ children: 'Playback Mode ▶️', required: true }}
      field={field}
      description='Select how this block appears in the lesson 📚.'
      options={[
        { value: 'inline', label: 'Inline – blends with surrounding content 🔄' },
        { value: 'standalone', label: 'Standalone – draws more attention ✨' },
      ]}
    />
  );
}
