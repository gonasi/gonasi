import { useEffect, useRef } from 'react';
import { Form, useFetcher } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { redirectWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCourseCategoriesAsSelectOptions } from '@gonasi/database/courseCategories';
import { fetchOrganizationCourseOverviewById } from '@gonasi/database/courses';
import {
  EditCourseGroupingSchema,
  type EditCourseGroupingSchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-grouping';
import type { loader as subCategoryLoader } from '../../../../api/course-sub-categories';

import { Button } from '~/components/ui/button';
import { GoSearchableDropDown } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Edit Course Grouping • Gonasii' },
    {
      name: 'description',
      content: 'Organize your course by updating its categories and subcategories.',
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const orgId = params.organizationId;

  const [courseOverview, categories, canEditRes] = await Promise.all([
    fetchOrganizationCourseOverviewById({ supabase, courseId }),
    fetchCourseCategoriesAsSelectOptions(supabase),
    supabase.rpc('can_user_edit_course', { arg_course_id: courseId }),
  ]);

  if (!courseOverview || canEditRes.data === null) {
    throw redirectWithError(
      `/${orgId}/builder/${courseId}/overview`,
      'Course not found or no permissions',
    );
  }

  return {
    courseOverview,
    categories,
  };
}

export default function EditCourseGrouping({ params, loaderData }: Route.ComponentProps) {
  const { categories, courseOverview } = loaderData;
  const fetcher = useFetcher<typeof subCategoryLoader>();

  const form = useRemixForm<EditCourseGroupingSchemaTypes>({
    mode: 'all',
    resolver: zodResolver(EditCourseGroupingSchema),
    defaultValues: {
      category: courseOverview.course_categories?.id,
      subcategory: courseOverview.course_sub_categories?.id,
    },
  });

  const isPending = useIsPending();
  const isDisabled = isPending || form.formState.isSubmitting;
  const selectedCategory = form.watch('category');

  const lastCategory = useRef<string | null>(null);

  useEffect(() => {
    if (selectedCategory && selectedCategory !== lastCategory.current && fetcher.state === 'idle') {
      lastCategory.current = selectedCategory;

      // Clear subcategory when category changes
      form.setValue('subcategory', '');

      fetcher.submit(
        { q: selectedCategory },
        { method: 'get', action: '/api/course-sub-categories' },
      );
    }
  }, [selectedCategory, fetcher.state, fetcher, form]);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Tweak Course Grouping'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/overview`}
        />
        <Modal.Body>
          <RemixFormProvider {...form}>
            <Form method='POST' onSubmit={form.handleSubmit}>
              <HoneypotInputs />

              <GoSearchableDropDown
                name='category'
                labelProps={{ children: 'Pick a Category', required: true }}
                searchDropdownProps={{
                  disabled: isDisabled,
                  options: categories,
                }}
                description='What general topic does your course fall under?'
              />

              <GoSearchableDropDown
                name='subcategory'
                labelProps={{
                  children: 'Pick a Subcategory',
                  required: true,
                  endAdornment:
                    fetcher.state !== 'idle' ? (
                      <LoaderCircle className='animate-spin' size={12} />
                    ) : null,
                }}
                searchDropdownProps={{
                  disabled: isDisabled || !selectedCategory || fetcher.state !== 'idle',
                  options: fetcher.data?.options ?? [],
                }}
                description='Let’s narrow it down a bit. Choose something more specific.'
              />

              <Button type='submit' disabled={isDisabled} isLoading={isDisabled}>
                Save
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
