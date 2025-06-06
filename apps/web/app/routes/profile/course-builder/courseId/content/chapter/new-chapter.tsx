import { Form, useNavigate, useOutletContext, useParams } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createCourseChapter } from '@gonasi/database/courseChapters';
import { NewChapterSchema, type NewChapterSchemaTypes } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/new-chapter';

import { Button } from '~/components/ui/button';
import { GoCheckBoxField, GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'New Chapter | Gonasi' },
    {
      name: 'description',
      content: 'Add new chapter',
    },
  ];
}

const resolver = zodResolver(NewChapterSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: NewChapterSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await createCourseChapter(supabase, {
    ...submission.value,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
        message,
      )
    : dataWithError(null, message);
}

export default function NewCourseChapter() {
  const { pricing_model } = useOutletContext<{ pricing_model: 'free' | 'paid' }>() ?? {};

  const navigate = useNavigate();
  const params = useParams();

  const isPending = useIsPending();

  const methods = useRemixForm<NewChapterSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      requiresPayment: pricing_model !== 'free',
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Add a new chapter'
          closeRoute={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <GoInputField
                labelProps={{ children: 'Chapter title', required: true }}
                name='name'
                inputProps={{
                  autoFocus: true,
                  disabled: isDisabled,
                }}
                description='Give your chapter a short, clear name.'
              />

              <GoTextAreaField
                name='description'
                labelProps={{ children: 'What’s this chapter about?', required: true }}
                textareaProps={{
                  disabled: isDisabled,
                }}
                description='Just a quick overview to help learners know what to expect.'
              />

              {pricing_model === 'paid' ? (
                <GoCheckBoxField
                  labelProps={{ children: 'Is this a paid chapter?', required: true }}
                  name='requiresPayment'
                  description='Check this if users need to pay to access it.'
                />
              ) : null}

              <Button type='submit' disabled={isPending} isLoading={isPending}>
                Create Chapter
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
