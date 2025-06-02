import { data, Form, useOutletContext } from 'react-router';
import { FormProvider, getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { editCoursePathway } from '@gonasi/database/courses';
import { fetchLearningPathsAsSelectOptions } from '@gonasi/database/learningPaths';
import { EditCoursePathwaySchema } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-pathway';
import type { CourseOverviewType } from './course-by-id';

import { GoLink } from '~/components/go-link';
import { Button } from '~/components/ui/button';
import { ErrorList, SearchDropdownField } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const pathways = await fetchLearningPathsAsSelectOptions(supabase);
  return data(pathways);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditCoursePathwaySchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editCoursePathway(supabase, {
    ...submission.value,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-details`,
        message,
      )
    : dataWithError(null, message);
}

export default function EditCoursePathway({
  actionData,
  loaderData,
  params,
}: Route.ComponentProps) {
  const { pathways } = useOutletContext<CourseOverviewType>() ?? {};

  const defaultValue = {
    pathway: pathways?.id ?? '',
  };

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'edit-course-pathway-form',
    constraint: getZodConstraint(EditCoursePathwaySchema),
    lastResult: actionData?.result,
    defaultValue,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditCoursePathwaySchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <FormProvider context={form.context}>
        <SearchDropdownField
          labelProps={{
            children: 'Course Pathway',
            required: true,
            endAdornment: (
              <GoLink to={`/dashboard/${params.companyId}/learning-paths`}>
                Create a new pathway?
              </GoLink>
            ),
          }}
          searchDropdownProps={{
            meta: fields.pathway,
            disabled: isPending,
            options: loaderData,
          }}
          errors={fields.pathway?.errors}
          description='Choose a pathway for this course.'
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <Button type='submit' disabled={isPending} isLoading={isPending}>
          Save Changes
        </Button>
      </FormProvider>
    </Form>
  );
}
