import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import type z from 'zod';

import { upsertLessonBlock } from '@gonasi/database/lessons';
import { BuilderSchema } from '@gonasi/schemas/plugins';

import type { Route } from './+types/upsert-plugin-api';

import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

type FormData = z.infer<typeof BuilderSchema>;
// Handles form submission for creating a plugin block
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Honeypot anti-bot check
  await checkHoneypot(formData);

  // Validate form data using Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<FormData>(formData, zodResolver(BuilderSchema));

  if (errors) return { errors, defaultValues };

  const basePath = `/${params.organizationId}/builder/${params.courseId}/content`;
  const redirectUrl = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  const { supabase } = createClient(request);

  try {
    const result = await upsertLessonBlock({ supabase, blockData: data });

    return result.success
      ? redirectWithSuccess(redirectUrl, result.message)
      : dataWithError(null, result.message);
  } catch (error) {
    console.error('Error creating block:', error);
    return dataWithError(null, 'Could not create block. Please try again.');
  }
}

export default function UpsertPluginApi() {
  return <></>;
}
