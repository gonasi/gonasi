import { NavLink } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';
import {
  LiveSessionTrueOrFalseSchema,
  type LiveSessionTrueOrFalseContentSchemaTypes,
  type LiveSessionTrueOrFalseSettingsSchemaTypes,
} from '@gonasi/schemas/liveSessions';
import { fetchLiveSessionBlockById } from '@gonasi/database/liveSessions';

import { Button } from '~/components/ui/button';
import { GoRadioGroupField, GoRichTextInputField, GoSliderField } from '~/components/ui/forms/elements';
import { Separator } from '~/components/ui/separator';
import { useIsPending } from '~/utils/misc';

type LiveSessionBlockRow = NonNullable<Awaited<ReturnType<typeof fetchLiveSessionBlockById>>>;

interface LiveSessionTrueOrFalseFormProps {
  block?: LiveSessionBlockRow;
  liveSessionId: string;
  organizationId: string;
  actionUrl: string;
  closeRoute: string;
}

const resolver = zodResolver(LiveSessionTrueOrFalseSchema);

export function LiveSessionTrueOrFalseForm({
  block,
  liveSessionId,
  organizationId,
  actionUrl,
  closeRoute,
}: LiveSessionTrueOrFalseFormProps) {
  const isPending = useIsPending();
  const isCreate = !block;

  const methods = useRemixForm({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          live_session_id: block.live_session_id,
          organization_id: block.organization_id,
          plugin_type: 'true_or_false' as const,
          content: block.content as LiveSessionTrueOrFalseContentSchemaTypes,
          settings: block.settings as LiveSessionTrueOrFalseSettingsSchemaTypes,
          weight: block.weight,
          time_limit: block.time_limit ?? 0,
        }
      : {
          live_session_id: liveSessionId,
          organization_id: organizationId,
          plugin_type: 'true_or_false' as const,
          content: { questionState: EMPTY_LEXICAL_STATE, correctAnswer: 'true' as const },
          settings: { layoutStyle: 'double' as const, randomization: 'shuffle' as const },
          weight: 2,
          time_limit: 0,
        },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <form
        id='live-session-true-or-false-form'
        onSubmit={methods.handleSubmit}
        method='POST'
        action={actionUrl}
      >
        <HoneypotInputs />

        {/* Hidden fields */}
        {block && <input type='hidden' name='id' value={block.id} />}
        <input type='hidden' name='live_session_id' value={liveSessionId} />
        <input type='hidden' name='organization_id' value={organizationId} />
        <input type='hidden' name='plugin_type' value='true_or_false' />

        <div className='space-y-4'>
          {/* Question */}
          <GoRichTextInputField
            name='content.questionState'
            labelProps={{ children: 'Question', required: true }}
            placeholder='Type your statement here...'
          />

          {/* Correct Answer */}
          <GoRadioGroupField
            name='content.correctAnswer'
            labelProps={{ children: 'Correct Answer', required: true }}
            options={[
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' },
            ]}
          />

          <Separator />

          {/* Block Settings */}
          <h3 className='text-sm font-semibold'>Block Settings</h3>

          <GoSliderField
            name='weight'
            labelProps={{ children: 'Block Weight' }}
            min={1}
            max={10}
            description='How important this block is for scoring.'
          />

          <GoSliderField
            name='time_limit'
            labelProps={{ children: 'Time Limit (seconds)' }}
            min={0}
            max={600}
            description='0 = use session default'
          />

          <GoRadioGroupField
            name='settings.layoutStyle'
            labelProps={{ children: 'Layout' }}
            options={[
              { value: 'single', label: 'Single Column' },
              { value: 'double', label: 'Two Columns' },
            ]}
          />

          <GoRadioGroupField
            name='settings.randomization'
            labelProps={{ children: 'Randomization' }}
            options={[
              { value: 'none', label: 'Keep Order' },
              { value: 'shuffle', label: 'Shuffle' },
            ]}
          />

          {/* Actions */}
          <div className='flex justify-end gap-2 pt-2'>
            <NavLink to={closeRoute}>
              <Button type='button' variant='ghost' disabled={isDisabled}>
                Cancel
              </Button>
            </NavLink>
            <Button type='submit' disabled={isDisabled} isLoading={isDisabled}>
              {isCreate ? 'Save Block' : 'Update Block'}
            </Button>
          </div>
        </div>
      </form>
    </RemixFormProvider>
  );
}
