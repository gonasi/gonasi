import { getUserId } from '../auth';
import { PROFILE_PHOTOS, THUMBNAILS_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchAssetsParams } from '../types';

interface FetchOrgCoursesParams extends FetchAssetsParams {
  organizationId: string;
}

export async function fetchOrganizationCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  organizationId,
}: FetchOrgCoursesParams) {
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

  const userRole = memberData?.role;
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';

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
  // BASE COURSE QUERY
  // ---------------------------------------------------------
  let query = supabase
    .from('courses')
    .select(
      `
      id,
      name,
      image_url,
      blur_hash,
      course_editors(
        user_id,
        profiles!user_id(
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

  const { data: courses, error, count } = await query;

  if (error || !courses?.length) {
    return { count: 0, data: [] };
  }

  // ---------------------------------------------------------
  // PROCESS EACH COURSE
  // ---------------------------------------------------------
  const dataWithSignedUrls = await Promise.all(
    courses.map(async (course) => {
      // -----------------------------------------------------
      // COURSE-SPECIFIC EDITORS
      // -----------------------------------------------------
      const courseSpecificEditors = await Promise.all(
        (course.course_editors ?? [])
          .filter((ce) => ce.profiles)
          .map(async (ce) => {
            const p = ce.profiles!;
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
              role: 'editor' as const,
            };
          }),
      );

      // -----------------------------------------------------
      // ADMINS + OWNERS (ALSO EDITORS)
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

      courseSpecificEditors.forEach((editor) => {
        if (!allEditorsMap.has(editor.id)) {
          allEditorsMap.set(editor.id, editor);
        }
      });

      const editors = Array.from(allEditorsMap.values());

      // -----------------------------------------------------
      // PERMISSIONS
      // -----------------------------------------------------
      const canEdit = isAdminOrOwner || editors.some((e) => e.id === userId && e.role === 'editor');

      // -----------------------------------------------------
      // SIGNED THUMBNAIL URL
      // -----------------------------------------------------
      let signed_url: string | null = null;

      if (course.image_url) {
        const { data } = await supabase.storage
          .from(THUMBNAILS_BUCKET)
          .createSignedUrl(course.image_url, 3600);
        signed_url = data?.signedUrl ?? null;
      }

      // -----------------------------------------------------
      // FINAL RESULT PER COURSE
      // -----------------------------------------------------
      return {
        id: course.id,
        name: course.name,
        image_url: course.image_url,
        blur_hash: course.blur_hash,
        signed_url,
        editors,
        canEdit,
        canDelete: isAdminOrOwner,
        userId,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
