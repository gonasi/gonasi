import { LayoutPanelTop, SquareStack } from 'lucide-react';

import { GoRadioGroupField } from '~/components/ui/forms/elements';

interface PlaybackModeFieldProps {
  name: string;
  watchValue: 'inline' | 'standalone';
}

export function PlaybackModeField({ name, watchValue }: PlaybackModeFieldProps) {
  return (
    <GoRadioGroupField
      labelProps={{
        children: 'Playback mode',
        endAdornment:
          watchValue === 'inline' ? <LayoutPanelTop size={14} /> : <SquareStack size={14} />,
        endAdornmentKey: watchValue, // 👈 this is what makes the animation work
      }}
      name={name}
      description='How this block appears in lessons.'
      options={[
        { value: 'inline', label: 'Inline – blends with content 🔄' },
        { value: 'standalone', label: 'Standalone – draws attention' },
      ]}
    />
  );
}
