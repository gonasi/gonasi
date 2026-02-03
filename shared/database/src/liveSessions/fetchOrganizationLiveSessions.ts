import { getSignedUrl } from '@gonasi/cloudinary';

import { getUserId } from '../auth';
import { PROFILE_PHOTOS } from '../constants';
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
  const userId = await getUserId(supabase);

  // ---------------------------------------------------------
  // USER ROLE
  // ---------------------------------------------------------
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  const isAdminOrOwner = memberData?.role === 'owner' || memberData?.role === 'admin';

  // ---------------------------------------------------------
  // FETCH ADMINS + OWNERS
  // ---------------------------------------------------------
  const { data: orgAdminsAndOwners } = await supabase
    .from('organization_members')
    .select(
      `
      user_id,
      role,
      profiles:user_id(
        id,
        username,
        full_name,
        avatar_url,
        email
      )
    `,
    )
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'admin']);

  // ---------------------------------------------------------
  // BASE SESSION QUERY
  // ---------------------------------------------------------
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
      updated_at,
      live_session_facilitators(
        user_id,
        profiles:user_id(
          id,
          username,
          full_name,
          avatar_url,
          email
        )
      )
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

  // ---------------------------------------------------------
  // PROCESS EACH SESSION
  // ---------------------------------------------------------
  const dataWithSignedUrls = await Promise.all(
    sessions.map(async (session) => {
      // -----------------------------------------------------
      // SESSION-SPECIFIC FACILITATORS
      // -----------------------------------------------------
      const sessionFacilitators = await Promise.all(
        (session.live_session_facilitators ?? [])
          .filter((f) => f.profiles)
          .map(async (f) => {
            const p = f.profiles!;
            let avatar_signed_url: string | null = null;

            if (p.avatar_url) {
              const { data } = await supabase.storage
                .from(PROFILE_PHOTOS)
                .createSignedUrl(p.avatar_url, 3600);
              avatar_signed_url = data?.signedUrl ?? null;
            }

            return {
              id: p.id,
              username: p.username,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
              avatar_signed_url,
              email: p.email,
              role: 'facilitator' as const,
            };
          }),
      );

      // -----------------------------------------------------
      // ADMINS + OWNERS (ALSO CAN EDIT)
      // -----------------------------------------------------
      const adminsAndOwnersEditors = await Promise.all(
        (orgAdminsAndOwners ?? [])
          .filter((m) => m.profiles)
          .map(async (m) => {
            const p = m.profiles!;
            let avatar_signed_url: string | null = null;

            if (p.avatar_url) {
              const { data } = await supabase.storage
                .from(PROFILE_PHOTOS)
                .createSignedUrl(p.avatar_url, 3600);
              avatar_signed_url = data?.signedUrl ?? null;
            }

            return {
              id: p.id,
              username: p.username,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
              avatar_signed_url,
              email: p.email,
              role: m.role, // "owner" | "admin"
            };
          }),
      );

      // -----------------------------------------------------
      // MERGE EDITORS (INFERRED)
      // -----------------------------------------------------
      const allEditorsMap = new Map(adminsAndOwnersEditors.map((e) => [e.id, e] as const));

      sessionFacilitators.forEach((facilitator) => {
        if (!allEditorsMap.has(facilitator.id)) {
          allEditorsMap.set(facilitator.id, facilitator);
        }
      });

      const editors = Array.from(allEditorsMap.values());

      // -----------------------------------------------------
      // PERMISSIONS
      // -----------------------------------------------------
      const canEdit =
        isAdminOrOwner || editors.some((e) => e.id === userId && e.role === 'facilitator');

      // -----------------------------------------------------
      // SIGNED THUMBNAIL URL (CLOUDINARY)
      // -----------------------------------------------------
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

      // -----------------------------------------------------
      // FINAL RESULT PER SESSION
      // -----------------------------------------------------
      return {
        id: session.id,
        name: session.name,
        description: session.description,
        image_url: session.image_url,
        blur_hash: session.blur_hash,
        session_code: session.session_code,
        status: session.status,
        visibility: session.visibility,
        signed_url,
        editors,
        canEdit,
        userId,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
