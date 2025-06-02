import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editLearningPathDetails, fetchLearningPathById } from '@gonasi/database/learningPaths';
import { EditLearningPathDetailsSchema } from '@gonasi/schemas/learningPaths';

import type { Route } from './+types/edit-learning-path-details-by-id';

import { Button } from '~/components/ui/button';
import { ErrorList, Field, TextareaField } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta({ data }: { data: { title?: string; description?: string } }) {
  return [
    { title: data?.title ? `${data.title} | Gonasi` : 'Gonasi' },
    { name: 'description', content: data?.description || 'Explore learning paths on Gonasi.' },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const learningPath = await fetchLearningPathById(supabase, params.learningPathId);

  if (learningPath === null)
    return redirectWithError(
      `/dashboard/${params.companyId}/learning-paths`,
      'Learning path not exist',
    );

  return data({
    name: learningPath.name,
    description: learningPath.description,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditLearningPathDetailsSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editLearningPathDetails(supabase, {
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

export default function EditLearningPathDetailsById({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'edit-learning-path-details-form',
    constraint: getZodConstraint(EditLearningPathDetailsSchema),
    lastResult: actionData?.result,
    defaultValue: loaderData,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditLearningPathDetailsSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Update Learning Path' />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'Learning Path Name', required: true }}
              inputProps={{
                ...getInputProps(fields.name, { type: 'text' }),
                autoFocus: true,
                disabled: isPending,
                placeholder: 'Enter a descriptive name',
              }}
              errors={fields.name?.errors}
            />
            <TextareaField
              labelProps={{ children: 'Description', required: true }}
              textareaProps={{
                ...getInputProps(fields.description, { type: 'text' }),
                disabled: isPending,
                placeholder: 'Provide a brief overview of this learning path',
              }}
              errors={fields.description?.errors}
              description='This helps learners understand what to expect from this path.'
            />
            <ErrorList errors={form.errors} id={form.errorId} />
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Save
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
