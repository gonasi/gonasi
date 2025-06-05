import type { NewLearningPathSubmitValues } from '@gonasi/schemas/learningPaths';
import { generateBlurHash } from '@gonasi/utils/generateBlurHash';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { LEARNING_PATHWAYS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

export const createLearningPath = async (
  supabase: TypedSupabaseClient,
  learningPathData: NewLearningPathSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { image, name, description } = learningPathData;

  if (!image) {
    return { success: false, message: 'Image is required.' };
  }

  const fileExtension = image.name.split('.').pop()?.toLowerCase();
  const fileName = `${Date.now()}-${Math.random()}.${fileExtension}`;

  const blurHash = await generateBlurHash(image);

  try {
    // Upload image to storage
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(LEARNING_PATHWAYS_BUCKET)
      .upload(fileName, image);

    if (uploadError) {
      console.log('createLearningPaht: Image upload failed: ', uploadError.message);
      return { success: false, message: `Image upload failed: ${uploadError.message}` };
    }

    // Insert learning path record
    const { error: insertError } = await supabase.from('pathways').insert({
      name,
      description,
      image_url: uploadResponse.path,
      blur_hash: blurHash,
      created_by: userId,
      updated_by: userId,
    });

    if (insertError) {
      // Rollback image upload in case of DB insert failure
      await supabase.storage.from(LEARNING_PATHWAYS_BUCKET).remove([uploadResponse.path]);
      return { success: false, message: `Failed to create learning path: ${insertError.message}` };
    }

    return { success: true, message: 'Learning path created successfully.' };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
