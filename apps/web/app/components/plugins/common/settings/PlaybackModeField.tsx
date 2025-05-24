import type { useForm } from '@conform-to/react';

import type { RichTextSettingsSchemaType } from '@gonasi/schemas/plugins';

import { RadioButtonField } from '~/components/ui/forms';

type Fields = ReturnType<typeof useForm<RichTextSettingsSchemaType>>[1];

interface PlaybackModeFieldProps {
  field: Fields['playbackMode'];
}

export function PlaybackModeField({ field }: PlaybackModeFieldProps) {
  return (
    <RadioButtonField
      labelProps={{ children: 'Playback Mode', required: true }}
      field={field}
      description='Choose how this block appears in the lesson.'
      options={[
        { value: 'inline', label: 'Inline – blends with surrounding content' },
        { value: 'standalone', label: 'Standalone – draws more attention' },
      ]}
    />
  );
}
