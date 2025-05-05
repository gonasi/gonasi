import { data, Form, useOutletContext } from 'react-router';
import { FormProvider, getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { fetchCourseCategoriesAsSelectOptions } from '@gonasi/database/courseCategories';
import { editCourseCategory } from '@gonasi/database/courses';
import { EditCourseCategorySchema } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-category';
import type { CourseDetailsType } from './course-by-id';

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
  const courseCategories = await fetchCourseCategoriesAsSelectOptions(supabase);

  return data(courseCategories);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditCourseCategorySchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editCourseCategory(supabase, {
    ...submission.value,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-details/grouping/edit-subcategory`,
        message,
      )
    : dataWithError(null, message);
}

export default function EditCourseCategory({ actionData, loaderData }: Route.ComponentProps) {
  const { course_categories } = useOutletContext<CourseDetailsType>() ?? {};

  const defaultValue = {
    category: course_categories?.id ?? '',
  };

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'edit-course-category-form',
    constraint: getZodConstraint(EditCourseCategorySchema),
    lastResult: actionData?.result,
    defaultValue,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditCourseCategorySchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <FormProvider context={form.context}>
        <SearchDropdownField
          labelProps={{ children: 'Course Category', required: true }}
          searchDropdownProps={{
            meta: fields.category,
            disabled: isPending,
            options: loaderData,
          }}
          errors={fields.category?.errors}
          description='Choose a category for this course.'
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <Button type='submit' disabled={isPending} isLoading={isPending}>
          Save Changes
        </Button>
      </FormProvider>
    </Form>
  );
}
