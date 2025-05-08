import { redirect } from 'react-router';
import { dataWithError, dataWithSuccess } from 'remix-toast';

import type { NodeProgressPayload } from '@gonasi/database/lessons';
import {
  addGoInteractiveToUserLessonProgress,
  completeLessonByUser,
  resetBlockInteractionsByLesson,
} from '@gonasi/database/lessons';

import type { Route } from './+types/api-interactive';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Action function to add page breaks to user lesson progress.
 * Validates input and handles errors.
 */
export async function action({ request, params }: Route.ActionArgs) {
  // Initialize Supabase client using the request object
  const { supabase } = createClient(request);

  // Parse form data from the request
  const formData = await request.formData();
  const intent = formData.get('intent');

  // Validate 'intent' value
  if (typeof intent !== 'string') {
    return dataWithError(null, 'Invalid or missing intent', { status: 400 });
  }

  try {
    // Extract common params for reuse
    const { courseId, chapterId, lessonId } = params;

    switch (intent) {
      case 'resetLessonProgress': {
        const { success, message } = await resetBlockInteractionsByLesson(supabase, lessonId);

        return success ? dataWithSuccess(null, message) : dataWithError(null, message);
      }

      case 'addGoInteractive': {
        const rawPayload = formData.get('payload');

        // Validate 'payload' value
        if (typeof rawPayload !== 'string') {
          return dataWithError(null, 'Invalid or missing payload', { status: 400 });
        }

        // Parse payload and add to lesson progress
        try {
          const parsedPayload = JSON.parse(rawPayload) as NodeProgressPayload;
          console.log(parsedPayload);
          await addGoInteractiveToUserLessonProgress(
            supabase,
            courseId,
            chapterId,
            lessonId,
            parsedPayload,
          );

          return true;
        } catch (parseError) {
          console.error('Error parsing payload:', parseError);
          return dataWithError(null, 'Invalid payload format', { status: 400 });
        }
      }

      case 'completeLesson': {
        const { success, message } = await completeLessonByUser(
          supabase,
          courseId,
          chapterId,
          lessonId,
        );

        if (!success) {
          return dataWithError(null, message, { status: 400 });
        }

        return redirect(`/go/course/${courseId}/${chapterId}/${lessonId}/completed`);
      }

      default:
        return dataWithError(null, `Unknown intent: ${intent}`, { status: 400 });
    }
  } catch (error) {
    console.error(`Error processing intent "${intent}":`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return dataWithError(null, errorMessage, { status: 500 });
  }
}
