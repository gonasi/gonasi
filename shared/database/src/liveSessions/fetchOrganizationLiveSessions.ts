import { getSignedUrl } from '@gonasi/cloudinary';

import { getPaginationRange } from '../constants/utils';
import type { FetchAssetsParams } from '../types';

interface FetchOrgLiveSessionsParams extends FetchAssetsParams {
  organizationId: string;
}

export async function fetchOrganizationLiveSessions({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  organizationId,
}: FetchOrgLiveSessionsParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('live_sessions')
    .select(
      `
      id,
      name,
      description,
      image_url,
      blur_hash,
      session_code,
      status,
      visibility,
      created_at,
      updated_at
    `,
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex);

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: sessions, error, count } = await query;

  if (error || !sessions?.length) {
    return { count: 0, data: [] };
  }

  const dataWithSignedUrls = await Promise.all(
    sessions.map(async (session) => {
      let signed_url: string | null = null;

      if (session.image_url) {
        try {
          const version = session.updated_at ? new Date(session.updated_at).getTime() : undefined;

          signed_url = getSignedUrl(session.image_url, {
            width: 400,
            quality: 'auto',
            format: 'auto',
            expiresInSeconds: 3600,
            resourceType: 'image',
            crop: 'fill',
            version,
          });
        } catch {
          console.error('[fetchOrganizationLiveSessions] Failed to generate signed URL');
          signed_url = null;
        }
      }

      return {
        ...session,
        signed_url,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
