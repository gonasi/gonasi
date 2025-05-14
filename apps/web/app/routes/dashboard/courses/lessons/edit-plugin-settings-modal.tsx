import { Suspense } from 'react';
import { Form, useNavigate } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Settings as LucideSettings } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import type { z } from 'zod';

import { editBlockSettingsAndWeight, fetchBlockSettingsByBlockId } from '@gonasi/database/lessons';
import {
  getSettingsSchemaByType,
  type PluginTypeId,
  type Settings,
  WeightSchema,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/edit-plugin-settings-modal';

import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { RadioButtonField, SwitchField } from '~/components/ui/forms';
import { SliderField } from '~/components/ui/forms/SliderInputField';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// --- Action Handler ---
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const pluginType = formData.get('intent') as PluginTypeId;
  const OriginalSchema = getSettingsSchemaByType(pluginType);

  type UpdateSettingsSchema = z.infer<typeof OriginalSchema>;

  const SettingsSchema = OriginalSchema.extend({
    weight: WeightSchema,
  });

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: SettingsSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { weight, ...rest } = submission.value;

  const settings: UpdateSettingsSchema = {
    ...rest,
  };

  const settingsPayload: Settings = {
    block_id: params.blockId,
    plugin_type: pluginType,
    weight,
    settings,
  };

  const { success, message } = await editBlockSettingsAndWeight(supabase, settingsPayload);

  const redirectPath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`;

  return success ? redirectWithSuccess(redirectPath, message) : dataWithError(null, message);
}

// --- Loader ---
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { data } = await fetchBlockSettingsByBlockId(supabase, params.blockId);

  if (!data) {
    const path = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`;
    return redirectWithError(path, 'Lesson block not found');
  }

  return { data };
}

// --- Component ---
export default function EditPluginSettingsModal({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { data } = loaderData;

  const OriginalSchema = getSettingsSchemaByType(data.plugin_type);

  const SettingsSchema = OriginalSchema.extend({
    weight: WeightSchema,
  });

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`,
    );
  };

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: `${data.plugin_type}-settings-form`,
    constraint: getZodConstraint(SettingsSchema),
    defaultValue: {
      ...data.settings,
      autoContinue: data.settings.autoContinue?.toString() || 'false',
      weight: data.weight,
    },
    // lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SettingsSchema });
    },
  });

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header leadingIcon={<LucideSettings size={14} />} title='Edit Block Settings' />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <Form method='POST' {...getFormProps(form)}>
              <div className='flex flex-col space-y-4'>
                <HoneypotInputs />
                <SliderField
                  labelProps={{ children: 'Block Weight', required: true }}
                  meta={fields.weight}
                  min={1}
                  max={10}
                  errors={fields.weight.errors}
                  description='Indicates how large the block is; also used to calculate progress.'
                />

                <RadioButtonField
                  labelProps={{
                    children: 'Playback Mode 🎵',
                    required: true,
                  }}
                  field={fields.playbackMode}
                  errors={fields.playbackMode.errors}
                  description='Choose how the plugin block is shown in the lesson ✨'
                  options={[
                    { value: 'inline', label: 'Inline – blends with content' },
                    { value: 'standalone', label: 'Standalone – draws full attention' },
                  ]}
                />

                <SliderField
                  labelProps={{ children: 'Delay Before Showing Block', required: true }}
                  meta={fields.delayBeforeShow}
                  min={0}
                  max={5}
                  errors={fields.delayBeforeShow.errors}
                  description='Number of seconds to wait before showing the block.'
                />

                <SwitchField
                  labelProps={{ children: 'Auto-Continue', required: true }}
                  meta={fields.autoContinue}
                  errors={fields.autoContinue.errors}
                  description='When enabled, the plugin automatically proceeds to the next block.'
                />

                {fields.autoContinue.value === 'true' ? (
                  <SliderField
                    labelProps={{ children: 'Delay Before Auto-Continue', required: true }}
                    meta={fields.delayBeforeAutoContinue}
                    min={1}
                    max={5}
                    errors={fields.delayBeforeAutoContinue.errors}
                    description='Delay (in seconds) before automatically continuing to the next block.'
                  />
                ) : null}

                <RadioButtonField
                  labelProps={{
                    children: 'Choices Per Row',
                    required: true,
                  }}
                  field={fields.layoutStyle}
                  errors={fields.layoutStyle.errors}
                  description='Controls how many choices are displayed per row in the plugin block.'
                  options={[
                    { value: 'single', label: 'Single Per Row' },
                    { value: 'double', label: 'Two Per Row' },
                  ]}
                />

                <div className='pt-4'>
                  <Button
                    type='submit'
                    name='intent'
                    value={data.plugin_type}
                    disabled={isPending}
                    isLoading={isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </Form>
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
