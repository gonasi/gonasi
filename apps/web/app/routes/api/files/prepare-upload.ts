import { prepareFileUpload } from '@gonasi/database/files';

import type { Route } from './+types/prepare-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * API route to prepare a file upload by generating a signed Cloudinary upload URL.
 *
 * This enables direct client-to-Cloudinary uploads, avoiding server memory/timeout issues.
 *
 * Flow:
 * 1. Client calls this endpoint with file metadata
 * 2. Server validates storage quota and generates signed upload parameters
 * 3. Client uses signature to upload directly to Cloudinary
 * 4. Client calls confirm-upload to finalize the database record
 */
export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  const result = await prepareFileUpload(supabase, {
    name: formData.get('name') as string,
    mimeType: formData.get('mimeType') as string,
    size: Number(formData.get('size')),
    courseId: formData.get('courseId') as string,
    organizationId: formData.get('organizationId') as string,
  });

  return result;
}
