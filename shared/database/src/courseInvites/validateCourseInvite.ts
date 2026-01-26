import type { TypedSupabaseClient } from '../client';

interface ValidateCourseInviteResult {
  success: boolean;
  message: string;
  data: {
    inviteId: string;
    courseName: string;
    organizationName: string;
    tierName: string;
    isFree: boolean;
    price: string;
    currencyCode: string;
    expiresAt: string;
    publishedCourseId: string;
    organizationId: string;
    cohortId: string | null;
    pricingTierId: string;
  } | null;
}

export const validateCourseInvite = async (
  supabase: TypedSupabaseClient,
  token: string,
  userEmail: string,
): Promise<ValidateCourseInviteResult> => {
  try {
    // 1. Fetch the invite with all related data
    const { data: invite, error: inviteError } = await supabase
      .from('course_invites')
      .select(
        `
        id,
        email,
        published_course_id,
        organization_id,
        cohort_id,
        pricing_tier_id,
        accepted_at,
        revoked_at,
        expires_at,
        published_courses!inner (
          id,
          name,
          is_active,
          organization_id,
          organizations!inner (
            id,
            name
          )
        ),
        course_pricing_tiers!inner (
          id,
          is_active,
          tier_name,
          is_free,
          price,
          currency_code
        )
      `,
      )
      .eq('token', token)
      .maybeSingle();

    if (inviteError) {
      console.error('[validateCourseInvite] Database error:', inviteError);
      return {
        success: false,
        message: 'Failed to verify invitation. Please try again.',
        data: null,
      };
    }

    // 2. Check if invite exists
    if (!invite) {
      return {
        success: false,
        message: 'This invitation does not exist or has been deleted.',
        data: null,
      };
    }

    // 3. Check if invite email matches logged-in user
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return {
        success: false,
        message: `This invitation was sent to ${invite.email}. Please log in with that email address.`,
        data: null,
      };
    }

    // 4. Check if invite has already been accepted
    if (invite.accepted_at) {
      return {
        success: false,
        message: 'This invitation has already been accepted.',
        data: null,
      };
    }

    // 5. Check if invite has been revoked
    if (invite.revoked_at) {
      return {
        success: false,
        message: 'This invitation has been revoked and is no longer valid.',
        data: null,
      };
    }

    // 6. Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      return {
        success: false,
        message: 'This invitation has expired. Please request a new one.',
        data: null,
      };
    }

    // 7. Check if published course is still active
    if (!invite.published_courses.is_active) {
      return {
        success: false,
        message: 'This course has been unpublished and is no longer available.',
        data: null,
      };
    }

    // 8. Check if pricing tier is still active
    if (!invite.course_pricing_tiers.is_active) {
      return {
        success: false,
        message:
          'The pricing tier for this invitation is no longer active. Please contact the course administrator.',
        data: null,
      };
    }

    // ✅ All checks passed - return invite data
    return {
      success: true,
      message: 'Invitation is valid.',
      data: {
        inviteId: invite.id,
        courseName: invite.published_courses.name,
        organizationName: invite.published_courses.organizations.name,
        tierName: invite.course_pricing_tiers.tier_name || 'Default Tier',
        isFree: invite.course_pricing_tiers.is_free,
        price: invite.course_pricing_tiers.price,
        currencyCode: invite.course_pricing_tiers.currency_code,
        expiresAt: invite.expires_at,
        publishedCourseId: invite.published_course_id,
        organizationId: invite.organization_id,
        cohortId: invite.cohort_id,
        pricingTierId: invite.pricing_tier_id,
      },
    };
  } catch (err) {
    console.error('[validateCourseInvite] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};
