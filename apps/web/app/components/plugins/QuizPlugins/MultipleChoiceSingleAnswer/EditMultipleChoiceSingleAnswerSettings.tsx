import { Form } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  type MultipleChoiceSingleAnswerSettingsSchemaType,
  TrueOrFalseSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutField } from '../../common/settings/LayoutField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationField } from '../../common/settings/RandomizationModeField';
import type { EditPluginSettingsComponentProps } from '../../PluginRenderers/EditPluginSettingsTypeRenderer';

import { Button } from '~/components/ui/button';
import { useIsPending } from '~/utils/misc';

export function EditMultipleChoiceSingleAnswerSettings({
  block,
}: EditPluginSettingsComponentProps) {
  const pending = useIsPending();
  const settings = block.settings as MultipleChoiceSingleAnswerSettingsSchemaType;

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-settings-form`,
    constraint: getZodConstraint(TrueOrFalseSettingsSchema),
    defaultValue: {
      ...settings,
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TrueOrFalseSettingsSchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <div className='flex flex-col space-y-4'>
        <HoneypotInputs />

        <BlockWeightField meta={fields.weight} />
        <PlaybackModeField field={fields.playbackMode} />
        <RandomizationField field={fields.randomization} />
        <LayoutField field={fields.layoutStyle} />

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
