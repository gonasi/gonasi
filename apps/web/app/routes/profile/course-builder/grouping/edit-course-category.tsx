import { data, Form, useOutletContext, useParams } from 'react-router';
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

import { Button, NavLinkButton } from '~/components/ui/button';
import { GoSearchableDropDown } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Page meta with a relaxed vibe
export function meta() {
  return [
    { title: 'Tweak Your Course Vibe | Gonasi' },
    {
      name: 'description',
      content: 'Switch up your course category to keep things fresh — it only takes a sec.',
    },
  ];
}

const resolver = zodResolver(EditCourseCategorySchema);

// Handles form submission and updates the course category
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseCategorySchemaTypes>(formData, resolver);

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

// Load dropdown options for categories
export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseCategories = await fetchCourseCategoriesAsSelectOptions(supabase);
  return data(courseCategories);
}

// The main form UI
export default function EditCourseCategory({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const { course_categories } = useOutletContext<CourseOverviewType>() ?? {};

  const defaultValue = {
    category: course_categories?.id,
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
          labelProps={{ children: 'Pick a category', required: true }}
          description='Select the vibe that best fits your course.'
          searchDropdownProps={{
            options: loaderData,
          }}
          disabled={isDisabled}
        />
        {!defaultValue.category || methods.formState.isDirty ? (
          <Button
            type='submit'
            disabled={isDisabled}
            isLoading={isDisabled}
            rightIcon={<ChevronRight />}
          >
            Save
          </Button>
        ) : (
          <NavLinkButton
            to={`/${params.username}/course-builder/${params.courseId}/overview/grouping/edit-subcategory`}
            rightIcon={<ChevronRight />}
            variant='ghost'
          >
            Next
          </NavLinkButton>
        )}
      </Form>
    </RemixFormProvider>
  );
}
