import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteBlockById } from '@gonasi/database/lessons/blocks';
import { DeleteBlockSchema, type DeleteBlockSchemaTypes } from '@gonasi/schemas/plugins';

import type { Route } from './+types/delete-plugin-modal';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteBlockSchema);

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Anti-bot check using honeypot
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data against schema
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteBlockSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  // Attempt to delete the block
  const { success, message } = await deleteBlockById(supabase, data.blockId);

  if (!success) {
    return dataWithError(null, message);
  }

  // Redirect on success
  const redirectPath = `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`;
  return redirectWithSuccess(redirectPath, message);
}

export default function DeletePluginModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const redirectPath = `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  // Form setup with Remix Hook Form and Zod schema
  const methods = useRemixForm<DeleteBlockSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      blockId: params.blockId,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const handleClose = () => navigate(redirectPath);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={redirectPath} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              {/* Honeypot field for spam protection */}
              <HoneypotInputs />
              <DeleteConfirmationLayout
                titlePrefix='this'
                title='Block'
                isLoading={isDisabled}
                handleClose={handleClose}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
