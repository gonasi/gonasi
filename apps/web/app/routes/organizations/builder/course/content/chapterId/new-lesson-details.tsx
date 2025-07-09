import { data, Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createLessonDetails } from '@gonasi/database/lessons';
import { fetchLessonTypesAsSelectOptions } from '@gonasi/database/lessonTypes';
import { NewLessonDetailsSchema, type NewLessonDetailsSchemaTypes } from '@gonasi/schemas/lessons';

import type { Route } from './+types/new-lesson-details';

import { Button } from '~/components/ui/button';
import { GoInputField, GoSearchableDropDown } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(NewLessonDetailsSchema);

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lessonTypes, canEdit] = await Promise.all([
    fetchLessonTypesAsSelectOptions(supabase),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    throw redirectWithError(`/${params.organizationId}/builder/content`, 'Not allowed to do shit');
  }

  return data(lessonTypes);
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Anti-bot honeypot check
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data with Zod schema
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewLessonDetailsSchemaTypes>(formData, resolver);

  // If validation fails, return errors and user-entered values
  if (errors) {
    return { errors, defaultValues };
  }

  // Create the lesson details in the DB
  const {
    success,
    message,
    data: lessonData,
  } = await createLessonDetails(supabase, {
    ...data,
    courseId: params.courseId,
    chapterId: params.chapterId,
    organizationId: params.organizationId,
  });

  if (!success || !lessonData) {
    return dataWithError(null, message);
  }

  // Return success response
  return redirectWithSuccess(
    `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${lessonData.id}/lesson-blocks`,
    message,
  );
}

export default function NewLessonDetails({ params, loaderData }: Route.ComponentProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<NewLessonDetailsSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='New lesson'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              {/* Bot trap field */}
              <HoneypotInputs />

              {/* Lesson title */}
              <GoInputField
                labelProps={{ children: 'Lesson Title', required: true }}
                name='name'
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Enter the lesson title.'
              />

              {/* Lesson type dropdown */}
              <GoSearchableDropDown
                labelProps={{ children: 'Lesson type', required: true }}
                name='lessonType'
                searchDropdownProps={{
                  disabled: isDisabled,
                  options: loaderData,
                }}
                description="Pick what best fits the lesson you're making."
              />

              <div className='pt-4'>
                {/* Submit button */}
                <Button
                  type='submit'
                  disabled={isPending}
                  isLoading={isPending}
                  rightIcon={<ChevronRight />}
                >
                  Save
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
