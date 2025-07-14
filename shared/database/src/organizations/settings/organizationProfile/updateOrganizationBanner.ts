import type { UpdateOrganizationBannerSchemaTypes } from '@gonasi/schemas/organizations/settings/profile';

import type { TypedSupabaseClient } from '../../../client';
import { ORGANIZATION_BANNER_PHOTOS } from '../../../constants';

/**
 * Uploads a new organization banner image to the appropriate folder
 * and updates the organization's profile with the uploaded image path.
 *
 * RLS compliance:
 * - Bucket: 'organization_banner_photos'
 * - Path: starts with the organization ID
 */
export const updateOrganizationBanner = async ({
  supabase,
  data,
}: {
  supabase: TypedSupabaseClient;
  data: UpdateOrganizationBannerSchemaTypes;
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
    const storagePath = `${organizationId}/banner.${extension}`;

    console.log('Uploading banner to:', storagePath);

    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from(ORGANIZATION_BANNER_PHOTOS)
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
        message: 'Banner upload failed. Try again.',
        data: null,
      };
    }

    const uploadedImagePath = uploadResult.path;

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ banner_url: uploadedImagePath })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Banner update error:', updateError);
      await supabase.storage.from(ORGANIZATION_BANNER_PHOTOS).remove([uploadedImagePath]);

      return {
        success: false,
        message: 'Upload succeeded, but banner update failed.',
        data: null,
      };
    }

    // Trigger background BlurHash generation (non-blocking)
    supabase.functions
      .invoke('generate-blurhash', {
        body: {
          bucket: ORGANIZATION_BANNER_PHOTOS,
          object_key: uploadedImagePath,
          table: 'organizations',
          column: 'banner_blur_hash',
          row_id_column: 'id',
          row_id_value: organizationId,
        },
      })
      .catch((err) => {
        console.error('BlurHash generation failed:', err);
      });

    return {
      success: true,
      message: 'Your new banner is live!',
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
