import type { UpdateOrganizationProfilePictureSchemaTypes } from '@gonasi/schemas/organizations/settings/profile';

import type { TypedSupabaseClient } from '../../../client';
import { ORGANIZATION_PROFILE_PHOTOS } from '../../../constants';

/**
 * Uploads a new organization avatar to the appropriate folder
 * and updates the organization's profile with the uploaded image path.
 *
 * RLS compliance:
 * - Bucket: 'organization_profile_photos'
 * - Path: starts with the organization ID
 */
export const updateOrganizationProfilePicture = async ({
  supabase,
  data,
}: {
  supabase: TypedSupabaseClient;
  data: UpdateOrganizationProfilePictureSchemaTypes;
}) => {
  const { image, organizationId } = data;

  if (!image) {
    return {
      success: false,
      message: 'No image found to upload.',
      data: null,
    };
  }

  try {
    const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = image.type || 'image/jpeg';
    const storagePath = `${organizationId}/avatar.${extension}`;

    console.log('Uploading to:', storagePath); // Log this!

    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from(ORGANIZATION_PROFILE_PHOTOS)
      .upload(storagePath, image, {
        upsert: true,
        contentType,
        cacheControl: '31536000',
        metadata: { organization_id: organizationId },
      });

    if (uploadError || !uploadResult?.path) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: 'Upload failed. Try again.',
        data: null,
      };
    }

    const uploadedImagePath = uploadResult.path;

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ avatar_url: uploadedImagePath })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      await supabase.storage.from(ORGANIZATION_PROFILE_PHOTOS).remove([uploadedImagePath]);

      return {
        success: false,
        message: 'Upload succeeded, but profile update failed.',
        data: null,
      };
    }

    // Trigger background BlurHash generation (non-blocking)
    supabase.functions
      .invoke('generate-blurhash', {
        body: {
          bucket: ORGANIZATION_PROFILE_PHOTOS,
          object_key: uploadedImagePath,
          table: 'organizations',
          column: 'blur_hash',
          row_id_column: 'id',
          row_id_value: organizationId,
        },
      })
      .catch((err) => {
        console.error('BlurHash generation failed:', err);
      });

    return {
      success: true,
      message: 'Your new profile picture is all set!',
      data: uploadedImagePath,
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      message: 'Unexpected error occurred.',
      data: null,
    };
  }
};
