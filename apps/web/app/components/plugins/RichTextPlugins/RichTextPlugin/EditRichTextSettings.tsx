import { Form } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { RichTextSettingsSchema, type RichTextSettingsSchemaType } from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import type { EditPluginSettingsComponentProps } from '../../EditPluginSettingsTypeRenderer';

import { Button } from '~/components/ui/button';
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

        <BlockWeightField meta={fields.weight} />
        <PlaybackModeField field={fields.playbackMode} />

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
