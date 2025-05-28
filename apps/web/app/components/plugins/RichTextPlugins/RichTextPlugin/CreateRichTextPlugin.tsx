import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { PluginTypeId, RichTextContentSchemaType } from '@gonasi/schemas/plugins';
import { RichTextContentSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(RichTextContentSchema);
interface CreateRichTextPluginProps {
  pluginTypeId: PluginTypeId;
}

export function CreateRichTextPlugin({ pluginTypeId }: CreateRichTextPluginProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<RichTextContentSchemaType>({
    mode: 'all',
    resolver,
    submitData: {
      intent: pluginTypeId,
    },
  });

  return (
    <RemixFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit} method='POST'>
        <HoneypotInputs />
        <GoRichTextInputField
          name='richTextState'
          labelProps={{ children: 'Rich Text', required: true }}
          description='You can format your content using rich text.'
          placeholder='Start typing...'
        />

        <div className='mt-4 flex justify-end space-x-2'>
          <Button
            type='submit'
            rightIcon={<Save />}
            disabled={isPending}
            isLoading={isPending || methods.formState.isSubmitting}
          >
            Save
          </Button>
        </div>
      </form>
    </RemixFormProvider>
  );
}
