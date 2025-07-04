import { Form } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createLearningPath } from '@gonasi/database/learningPaths';
import { NewLearningPathSchema } from '@gonasi/schemas/learningPaths';

import type { Route } from './+types/new-learning-path';

import { StepperFormLayout } from '~/components/layouts/stepper/StepperFormLayout';
import { Button } from '~/components/ui/button';
import { ErrorList, Field, TextareaField } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Create a Learning Path • Gonasi' },
    {
      name: 'description',
      content:
        'Design and launch your own learning path on Gonasi. Organize courses, share knowledge, and guide learners effectively.',
    },
    {
      name: 'keywords',
      content: 'learning path, course creation, education, online learning, Gonasi',
    },
    { property: 'og:title', content: 'Create a Learning Path • Gonasi' },
    {
      property: 'og:description',
      content:
        'Build structured learning experiences with Gonasi. Create custom pathways to enhance skill development and knowledge sharing.',
    },
    { property: 'og:type', content: 'website' },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: NewLearningPathSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await createLearningPath(supabase, {
    ...submission.value,
  });

  return success
    ? redirectWithSuccess(`/dashboard/${params.companyId}/learning-paths`, message)
    : dataWithError(null, message);
}

export default function NewLearningPath({ actionData, params }: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: 'new-learning-path-form',
    constraint: getZodConstraint(NewLearningPathSchema),
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: NewLearningPathSchema }),
  });

  const isPending = useIsPending();

  return (
    <StepperFormLayout
      closeLink={`/dashboard/${params.companyId}/learning-paths`}
      desktopTitle='Create a Learning Path'
      mobileTitle='Create a Learning Path'
      companyId={params.companyId}
    >
      <Form method='POST' encType='multipart/form-data' {...getFormProps(form)}>
        <HoneypotInputs />
        <Field
          labelProps={{ children: 'Pathway Name', required: true }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
            disabled: isPending,
          }}
          errors={fields.name?.errors}
          description='Give your learning path a clear and engaging name'
        />
        <TextareaField
          labelProps={{ children: 'Overview', required: true }}
          textareaProps={{
            ...getInputProps(fields.description, { type: 'text' }),
            disabled: isPending,
          }}
          errors={fields.description?.errors}
          description='This helps learners understand what to expect from this path.'
        />
        <Field
          labelProps={{ children: 'Cover Image', required: true }}
          inputProps={{ ...getInputProps(fields.image, { type: 'file' }), disabled: isPending }}
          errors={fields.image?.errors}
          description='Upload an image to visually represent your learning path'
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <Button type='submit' disabled={isPending} isLoading={isPending}>
          Create Pathway
        </Button>
      </Form>
    </StepperFormLayout>
  );
}
