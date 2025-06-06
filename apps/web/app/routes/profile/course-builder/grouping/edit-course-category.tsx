import { data, Form, useOutletContext } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { fetchCourseCategoriesAsSelectOptions } from '@gonasi/database/courseCategories';
import { editCourseCategory } from '@gonasi/database/courses';
import {
  EditCourseCategorySchema,
  type EditCourseCategorySchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-category';
import type { CourseOverviewType } from '../course-by-id';

import { GoLink } from '~/components/go-link';
import { Button } from '~/components/ui/button';
import { GoInputField, GoSearchableDropDown } from '~/components/ui/forms/elements';
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

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
  },
];

export default function EditCourseCategory({ actionData, loaderData }: Route.ComponentProps) {
  const { course_categories } = useOutletContext<CourseOverviewType>() ?? {};

  const defaultValue = {
    category: course_categories?.id ?? '',
  };

  const isPending = useIsPending();

  const methods = useRemixForm<EditCourseCategorySchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <GoInputField
          labelProps={{
            children: 'Your password',
            required: true,
            endAdornment: <GoLink to='/'>Forgot it?</GoLink>,
          }}
          name='password'
          inputProps={{
            type: 'text',
            autoComplete: 'current-password',
            disabled: isDisabled,
          }}
          description='We won’t tell anyone, promise 😊'
        />
        <GoSearchableDropDown
          name='category'
          labelProps={{ children: 'Course category', required: true }}
          description='Choose a category for this course.'
          searchDropdownProps={{
            options: frameworks,
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
