import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { Json } from '../../schema';
import type {
  InteractiveNodePayload,
  NodeProgressMap,
  NodeProgressPayload,
  TapToRevealNodePayload,
} from './types';

/**
 * Adds or updates a node entry in the user's lesson progress.
 */
export async function addGoInteractiveToUserLessonProgress(
  supabase: TypedSupabaseClient,
  courseId: string,
  chapterId: string,
  lessonId: string,
  payload: NodeProgressPayload,
): Promise<{ success: boolean; message?: string }> {
  const userId = await getUserId(supabase);
  const { nodeType, uuid, timestamp } = payload;

  // Create a base entry object with common properties
  const baseEntry = {
    type: nodeType,
    payload: {
      nodeType,
      uuid,
      timestamp,
    },
  };

  // Add type-specific properties only if not a page-break
  const newEntry =
    nodeType === 'page-break'
      ? baseEntry
      : nodeType === 'tap-to-reveal'
        ? {
            ...baseEntry,
            payload: {
              ...baseEntry.payload,
              isPlayed: (payload as TapToRevealNodePayload).isPlayed,
            },
          }
        : {
            ...baseEntry,
            payload: {
              ...baseEntry.payload,
              isCorrect: (payload as InteractiveNodePayload).isCorrect,
              isAnswerChecked: (payload as InteractiveNodePayload).isAnswerChecked,
              showExplanation: (payload as InteractiveNodePayload).showExplanation,
              showCorrectAnswer: (payload as InteractiveNodePayload).showCorrectAnswer,
              attempts: (payload as InteractiveNodePayload).attempts,
            },
          };

  try {
    // Try to get existing progress
    const { data } = await supabase
      .from('lessons_progress')
      .select('id, node_progress')
      .match({ lesson_id: lessonId, user_id: userId })
      .single();

    const existingProgress = (data?.node_progress ?? {}) as unknown as NodeProgressMap;
    const updatedNodeProgress = {
      ...existingProgress,
      [uuid]: newEntry,
    } as NodeProgressMap;

    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('lessons_progress')
        .update({ node_progress: updatedNodeProgress as unknown as Json })
        .match({ id: data.id });

      if (updateError) {
        throw new Error(`Failed to update node progress: ${updateError.message}`);
      }

      return { success: true, message: 'Node progress updated successfully' };
    } else {
      // Insert new record
      const { error: insertError } = await supabase.from('lessons_progress').insert({
        course_id: courseId,
        chapter_id: chapterId,
        lesson_id: lessonId,
        user_id: userId,
        node_progress: updatedNodeProgress as unknown as Json,
      });

      if (insertError) {
        throw new Error(`Failed to insert node progress: ${insertError.message}`);
      }

      return { success: true, message: 'Node progress created successfully' };
    }
  } catch (error) {
    throw new Error(
      `Error updating lesson progress: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
