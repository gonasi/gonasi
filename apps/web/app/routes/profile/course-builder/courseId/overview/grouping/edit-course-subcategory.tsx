import { data, Form, useOutletContext, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { editCourseSubcategory } from '@gonasi/database/courses';
import { fetchCourseSubCategoriesAsSelectOptions } from '@gonasi/database/courseSubCategories';
import {
  EditCourseSubcategorySchema,
  type EditCourseSubcategorySchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-subcategory';
import type { CourseOverviewType } from '../../course-id-index';

import { Button, NavLinkButton } from '~/components/ui/button';
import { GoSearchableDropDown } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Meta
export function meta() {
  return [
    { title: 'Course Subcategory, Remixed • Gonasi' },
    {
      name: 'description',
      content:
        'Ready to shake things up? Pick a new course subcategory and keep your course moving forward on Gonasi.',
    },
  ];
}

const resolver = zodResolver(EditCourseSubcategorySchema);

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

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseSubcategorySchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editCourseSubcategory(supabase, {
    ...data,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/${params.username}/course-builder/${params.courseId}/overview/grouping/edit-pathway`,
        message,
      )
    : dataWithError(null, message);
}

// Component
export default function EditCourseSubcategory({ loaderData }: Route.ComponentProps) {
  const params = useParams();

  const { course_sub_categories, course_categories } = useOutletContext<CourseOverviewType>() ?? {};

  const isPending = useIsPending();

  const defaultValue = {
    subcategory: course_sub_categories?.id,
  };

  const methods = useRemixForm<EditCourseSubcategorySchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: defaultValue,
  });

  const categoryId = course_categories?.id ?? '';
  const filteredOptions = loaderData.filter((subcategory) => subcategory.categoryId === categoryId);

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <GoSearchableDropDown
          name='subcategory'
          labelProps={{ children: 'Choose your subcategory', required: true }}
          description='Pick the subcategory that fits your course best.'
          searchDropdownProps={{
            options: filteredOptions,
          }}
          disabled={isDisabled}
        />
        {!defaultValue.subcategory || methods.formState.isDirty ? (
          <Button
            type='submit'
            disabled={isDisabled}
            isLoading={isDisabled}
            rightIcon={<ChevronRight />}
          >
            Save
          </Button>
        ) : (
          <div className='flex w-full items-center justify-between'>
            <NavLinkButton
              to={`/${params.username}/course-builder/${params.courseId}/overview/grouping/edit-category`}
              leftIcon={<ChevronLeft />}
              variant='ghost'
            >
              Previous
            </NavLinkButton>
            <NavLinkButton
              to={`/${params.username}/course-builder/${params.courseId}/overview/grouping/edit-pathway`}
              rightIcon={<ChevronRight />}
              variant='ghost'
              animate='rtl'
            >
              Next
            </NavLinkButton>
          </div>
        )}
      </Form>
    </RemixFormProvider>
  );
}
