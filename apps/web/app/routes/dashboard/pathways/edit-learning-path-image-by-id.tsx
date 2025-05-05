import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editLearningPathFile, fetchLearningPathById } from '@gonasi/database/learningPaths';
import { EditLearningPathImageSchema } from '@gonasi/schemas/learningPaths';

import type { Route } from './+types/edit-learning-path-image-by-id';

import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
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
    id: learningPath.id,
    imageUrl: learningPath.image_url,
    image: null,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditLearningPathImageSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editLearningPathFile(supabase, {
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

export default function EditLearningPathImageById({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'edit-learning-path-image-form',
    constraint: getZodConstraint(EditLearningPathImageSchema),
    lastResult: actionData?.result,
    defaultValue: loaderData,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditLearningPathImageSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit learning path cover image' />
        <Modal.Body>
          <Form method='POST' encType='multipart/form-data' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'Cover image', required: true }}
              inputProps={{ ...getInputProps(fields.image, { type: 'file' }), disabled: isPending }}
              errors={fields.image?.errors}
              description='Upload an image to visually represent your learning path'
            />
            <Input {...getInputProps(fields.imageUrl, { type: 'hidden' })} />
            <ErrorList errors={form.errors} id={form.errorId} />
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
