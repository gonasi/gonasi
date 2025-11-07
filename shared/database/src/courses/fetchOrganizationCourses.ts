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

  // Get user role
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  const userRole = memberData?.role;
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';

  // Fetch all admins + owners
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

  // Base course query
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

  // Optional search
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: courses, error, count } = await query;

  if (error || !courses?.length) {
    return { count: 0, data: [] };
  }

  // Process courses
  const dataWithSignedUrls = await Promise.all(
    courses.map(async (course) => {
      // Course-specific editors
      const courseSpecificEditors = await Promise.all(
        (course.course_editors || [])
          .filter((ce: any) => ce.profiles)
          .map(async (ce: any) => {
            let avatar_signed_url = null;

            if (ce.profiles?.avatar_url) {
              const { data } = await supabase.storage
                .from(PROFILE_PHOTOS)
                .createSignedUrl(ce.profiles.avatar_url, 3600);

              avatar_signed_url = data?.signedUrl || null;
            }

            return {
              id: ce.profiles.id,
              username: ce.profiles.username,
              full_name: ce.profiles.full_name,
              avatar_url: ce.profiles.avatar_url,
              avatar_signed_url,
              email: ce.profiles.email,
              role: 'editor',
            };
          }),
      );

      // Admins + owners (always editors)
      const adminsAndOwnersEditors = await Promise.all(
        (orgAdminsAndOwners || [])
          .filter((member: any) => member.profiles)
          .map(async (member: any) => {
            let avatar_signed_url = null;

            if (member.profiles?.avatar_url) {
              const { data } = await supabase.storage
                .from(PROFILE_PHOTOS)
                .createSignedUrl(member.profiles.avatar_url, 3600);

              avatar_signed_url = data?.signedUrl || null;
            }

            return {
              id: member.profiles.id,
              username: member.profiles.username,
              full_name: member.profiles.full_name,
              avatar_url: member.profiles.avatar_url,
              avatar_signed_url,
              email: member.profiles.email,
              role: member.role,
            };
          }),
      );

      // Merge editors, prioritizing owner/admin roles
      const allEditorsMap = new Map();
      adminsAndOwnersEditors.forEach((editor: any) => allEditorsMap.set(editor.id, editor));
      courseSpecificEditors.forEach((editor: any) => {
        if (!allEditorsMap.has(editor.id)) allEditorsMap.set(editor.id, editor);
      });

      const editors = Array.from(allEditorsMap.values());

      // Permission logic
      const canEdit =
        isAdminOrOwner || editors.some((e: any) => e.id === userId && e.role === 'editor');

      // Signed URL for course thumbnail
      let signed_url = null;
      if (course.image_url) {
        const { data } = await supabase.storage
          .from(THUMBNAILS_BUCKET)
          .createSignedUrl(course.image_url, 3600);

        signed_url = data?.signedUrl || null;
      }

      return {
        id: course.id,
        name: course.name,
        image_url: course.image_url,
        blur_hash: course.blur_hash,
        signed_url,
        editors,
        canEdit,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
