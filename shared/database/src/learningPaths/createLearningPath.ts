import type { NewLearningPathSubmitValues } from '@gonasi/schemas/learningPaths';

import type { TypedSupabaseClient } from '../client';
import { LEARNING_PATHWAYS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

/**
 * Creates a new learning path and uploads the image with a blurhash
 */
export const createLearningPath = async (
  supabase: TypedSupabaseClient,
  learningPathData: NewLearningPathSubmitValues,
): Promise<ApiResponse> => {
  const { image, name, description, blurHash } = learningPathData;

  if (!image) {
    return { success: false, message: 'Image is required.' };
  }

  const fileExtension = image.name.split('.').pop()?.toLowerCase();
  const fileName = `${Date.now()}-${Math.random()}.${fileExtension}`;

  try {
    // Upload image to Supabase storage
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(LEARNING_PATHWAYS_BUCKET)
      .upload(fileName, image);

    if (uploadError) {
      console.log('createLearningPath: Image upload failed:', uploadError.message);
      return { success: false, message: `Image upload failed: ${uploadError.message}` };
    }

    const imagePath = uploadResponse?.path;

    // Get current user ID (requires user to be logged in)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: 'User not authenticated.' };
    }

    const { error: insertError } = await supabase.from('pathways').insert({
      name,
      description,
      image_url: imagePath,
      blur_hash: blurHash,
      created_by: user.id,
      updated_by: user.id,
    });

    if (insertError) {
      await supabase.storage.from(LEARNING_PATHWAYS_BUCKET).remove([imagePath]);
      return { success: false, message: `Failed to create learning path: ${insertError.message}` };
    }

    return { success: true, message: 'Learning path created successfully.' };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
