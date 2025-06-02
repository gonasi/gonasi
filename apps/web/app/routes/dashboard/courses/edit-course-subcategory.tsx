// Imports
import { data, Form, useOutletContext } from 'react-router';
import { FormProvider, getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { editCourseSubcategory } from '@gonasi/database/courses';
import { fetchCourseSubCategoriesAsSelectOptions } from '@gonasi/database/courseSubCategories';
import { EditCourseSubcategorySchema } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-subcategory';
import type { CourseOverviewType } from './course-by-id';

import { Button } from '~/components/ui/button';
import { ErrorList, SearchDropdownField } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Meta
export function meta() {
  return [
    { title: 'Gonasi - Edit Course Subcategory' },
    {
      name: 'description',
      content: 'Modify the subcategory for your course in Gonasi.',
    },
  ];
}

// Loader
export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const subcategories = await fetchCourseSubCategoriesAsSelectOptions(supabase);
  return data(subcategories);
}

// Action
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, {
    schema: EditCourseSubcategorySchema,
  });

  if (submission.status !== 'success') {
    return {
      result: submission.reply(),
      status: submission.status === 'error' ? 400 : 200,
    };
  }

  const { success, message } = await editCourseSubcategory(supabase, {
    ...submission.value,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-details/grouping/edit-pathway`,
        message,
      )
    : dataWithError(null, message);
}

// Component
export default function EditCourseSubcategory({ actionData, loaderData }: Route.ComponentProps) {
  const { course_sub_categories, course_categories } = useOutletContext<CourseOverviewType>() ?? {};
  const isPending = useIsPending();

  const defaultValue = {
    subcategory: course_sub_categories?.id ?? '',
  };

  const [form, fields] = useForm({
    id: 'edit-course-subcategory-form',
    constraint: getZodConstraint(EditCourseSubcategorySchema),
    lastResult: actionData?.result,
    defaultValue,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: EditCourseSubcategorySchema }),
  });

  const categoryId = course_categories?.id ?? '';
  const filteredOptions = loaderData.filter((subcategory) => subcategory.categoryId === categoryId);

  return (
    <Form method='POST' {...getFormProps(form)}>
      <FormProvider context={form.context}>
        <SearchDropdownField
          labelProps={{ children: 'Course Subcategory', required: true }}
          searchDropdownProps={{
            meta: fields.subcategory,
            disabled: isPending,
            options: filteredOptions,
          }}
          errors={fields.subcategory?.errors}
          description='Select the appropriate subcategory for this course.'
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <Button type='submit' disabled={isPending} isLoading={isPending}>
          Save Changes
        </Button>
      </FormProvider>
    </Form>
  );
}
