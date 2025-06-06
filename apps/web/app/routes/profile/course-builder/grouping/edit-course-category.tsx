import { data, Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { fetchCourseCategoriesAsSelectOptions } from '@gonasi/database/courseCategories';
import { editCourseCategory } from '@gonasi/database/courses';
import {
  EditCourseCategorySchema,
  type EditCourseCategorySchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-category';
import type { CourseOverviewType } from '../course-by-id';

import { Button } from '~/components/ui/button';
import { GoSearchableDropDown } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Tweak Your Course Vibe | Gonasi' },
    {
      name: 'description',
      content: 'Fine-tune your course category and keep things fresh – only on Gonasi.',
    },
  ];
}

const resolver = zodResolver(EditCourseCategorySchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate and parse form data using zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseCategorySchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editCourseCategory(supabase, {
    ...data,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/${params.username}/course-builder/${params.courseId}/overview/grouping/edit-subcategory`,
        message,
      )
    : dataWithError(null, message);
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseCategories = await fetchCourseCategoriesAsSelectOptions(supabase);

  return data(courseCategories);
}

export default function EditCourseCategory({ loaderData }: Route.ComponentProps) {
  const { course_categories } = useOutletContext<CourseOverviewType>() ?? {};

  const defaultValue = {
    category: course_categories?.id ?? '',
  };

  const isPending = useIsPending();

  const methods = useRemixForm<EditCourseCategorySchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: defaultValue,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <GoSearchableDropDown
          name='category'
          labelProps={{ children: 'Course category', required: true }}
          description='Choose a category for this course.'
          searchDropdownProps={{
            options: loaderData,
          }}
        />
        <Button
          type='submit'
          disabled={isDisabled}
          isLoading={isDisabled}
          rightIcon={<ChevronRight />}
        >
          Save
        </Button>
      </Form>
    </RemixFormProvider>
  );
}
