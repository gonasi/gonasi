import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteLearningPathById, fetchLearningPathById } from '@gonasi/database/learningPaths';
import { DeleteLearningPathSchema } from '@gonasi/schemas/learningPaths';

import type { Route } from './+types/delete-learning-path-by-id';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { ErrorList } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const learningPath = await fetchLearningPathById(supabase, params.learningPathId);

  if (learningPath === null)
    return redirectWithError(
      `/dashboard/${params.companyId}/learning-paths`,
      'Learning path does not exist',
    );

  return data({
    name: learningPath.name,
    imageUrl: learningPath.image_url,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: DeleteLearningPathSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await deleteLearningPathById(supabase, {
    ...submission.value,
    learningPathId: params.learningPathId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`,
        message,
      )
    : dataWithError(null, message);
}

export default function DeleteLearningPath({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'delete-learning-path-form',
    constraint: getZodConstraint(DeleteLearningPathSchema),
    lastResult: actionData?.result,
    defaultValue: loaderData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: DeleteLearningPathSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Input {...getInputProps(fields.imageUrl, { type: 'text' })} hidden />
            <Input {...getInputProps(fields.name, { type: 'text' })} hidden />
            <ErrorList errors={form.errors} id={form.errorId} />
            <DeleteConfirmationLayout
              title={loaderData.name}
              isLoading={isPending}
              handleClose={handleClose}
            />
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
