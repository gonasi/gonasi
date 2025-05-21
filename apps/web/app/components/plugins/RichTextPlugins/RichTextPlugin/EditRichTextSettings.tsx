import { Form } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { RichTextSettingsSchema, type RichTextSettingsSchemaType } from '@gonasi/schemas/plugins';

import type { EditPluginSettingsComponentProps } from '../../EditPluginSettingsTypeRenderer';

import { Button } from '~/components/ui/button';
import { RadioButtonField } from '~/components/ui/forms';
import { SliderField } from '~/components/ui/forms/SliderInputField';
import { useIsPending } from '~/utils/misc';

export function EditRichTextSettings({ block }: EditPluginSettingsComponentProps) {
  const pending = useIsPending();
  const settings = block.settings as RichTextSettingsSchemaType;

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-settings-form`,
    constraint: getZodConstraint(RichTextSettingsSchema),
    defaultValue: {
      playbackMode: settings.playbackMode,
      weight: settings.weight,
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',

    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RichTextSettingsSchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <div className='flex flex-col space-y-4'>
        <HoneypotInputs />

        <SliderField
          labelProps={{ children: 'Block Weight', required: true }}
          meta={fields.weight}
          min={1}
          max={10}
          description='Controls the importance of this block when calculating progress.'
        />

        <RadioButtonField
          labelProps={{ children: 'Playback Mode', required: true }}
          field={fields.playbackMode}
          description='Choose how this block appears in the lesson.'
          options={[
            { value: 'inline', label: 'Inline – blends with surrounding content' },
            { value: 'standalone', label: 'Standalone – draws more attention' },
          ]}
        />

        <div className='pt-4'>
          <Button
            type='submit'
            name='intent'
            value={block.plugin_type}
            disabled={pending}
            isLoading={pending}
            rightIcon={<Save />}
          >
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
