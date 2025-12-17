import { confirmFileUpload } from '@gonasi/database/files';

import type { Route } from './+types/confirm-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * API route to confirm a file upload after client-side direct upload to Cloudinary completes.
 *
 * This creates the database record with Cloudinary upload details.
 *
 * Flow:
 * 1. Client calls prepare-upload to get signed parameters
 * 2. Client uploads directly to Cloudinary
 * 3. Cloudinary returns upload response
 * 4. Client calls THIS endpoint with Cloudinary response data
 */
export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  const result = await confirmFileUpload(supabase, {
    fileId: formData.get('fileId') as string,
    name: formData.get('name') as string,
    courseId: formData.get('courseId') as string,
    organizationId: formData.get('organizationId') as string,
    cloudinaryPublicId: formData.get('cloudinaryPublicId') as string,
    size: Number(formData.get('size')),
    mimeType: formData.get('mimeType') as string,
  });

  return result;
}
