import { data, Form, useOutletContext, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { editCoursePathway } from '@gonasi/database/courses';
import { fetchLearningPathsAsSelectOptions } from '@gonasi/database/learningPaths';
import {
  EditCoursePathwaySchema,
  type EditCoursePathwaySchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-pathway';
import type { CourseOverviewType } from '../../course-id-index';

import { GoLink } from '~/components/go-link';
import { Button, NavLinkButton } from '~/components/ui/button';
import { GoSearchableDropDown } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Shape Your Pathway | Gonasi' },
    {
      name: 'description',
      content: "Give your pathway a fresh vibe — let's get you set up with Gonasi.",
    },
  ];
}

const resolver = zodResolver(EditCoursePathwaySchema);

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const pathways = await fetchLearningPathsAsSelectOptions(supabase);
  return data(pathways);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCoursePathwaySchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editCoursePathway(supabase, {
    ...data,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(`/${params.username}/course-builder/${params.courseId}/overview`, message)
    : dataWithError(null, message);
}

export default function EditCoursePathway({ loaderData }: Route.ComponentProps) {
  const params = useParams();

  const { pathways } = useOutletContext<CourseOverviewType>() ?? {};

  const defaultValue = {
    pathway: pathways?.id ?? '',
  };

  const isPending = useIsPending();

  const methods = useRemixForm<EditCoursePathwaySchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: defaultValue,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <GoSearchableDropDown
          name='pathway'
          labelProps={{
            children: 'Choose your pathway',
            required: true,
            endAdornment: (
              <GoLink to={`/${params.username}/course-builder/${params.courseId}/overview`}>
                Create new pathway?
              </GoLink>
            ),
          }}
          description='Pick the pathway that fits your course best.'
          searchDropdownProps={{
            options: loaderData,
          }}
          disabled={isDisabled}
        />
        {!defaultValue.pathway || methods.formState.isDirty ? (
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
            leftIcon={<ChevronLeft />}
            variant='ghost'
          >
            Previous
          </NavLinkButton>
        )}
      </Form>
    </RemixFormProvider>
  );
}
