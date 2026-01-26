import type { InviteToCourseSchemaTypes } from '@gonasi/schemas/courseInvites';

import type { TypedSupabaseClient } from '../client';
import { getUserProfile } from '../profile';

export const inviteToCourse = async (
  supabase: TypedSupabaseClient,
  formData: InviteToCourseSchemaTypes,
) => {
  try {
    const { user } = await getUserProfile(supabase);
    const { publishedCourseId, organizationId, email, cohortId, pricingTierId } = formData;

    // Self-invite check
    if (email === user?.email) {
      return {
        success: false,
        message: `You can't invite yourself.`,
        data: null,
      };
    }

    // 1. Check if invited email is already enrolled
    // First, find the user by email (if they have an account)
    const { data: invitedUserProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    // If user exists, check if they're enrolled
    if (invitedUserProfile) {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('published_course_id', publishedCourseId)
        .eq('user_id', invitedUserProfile.id)
        .maybeSingle();

      if (enrollmentError) {
        console.error('[inviteToCourse] Enrollment check failed:', enrollmentError);
        return {
          success: false,
          message: 'Could not verify enrollment status.',
          data: null,
        };
      }

      if (enrollmentData) {
        return {
          success: false,
          message: 'This user is already enrolled in the course.',
          data: null,
        };
      }
    }

    // 2. Verify pricing tier is active and course is private
    const { data: courseData, error: courseCheckError } = await supabase
      .from('published_courses')
      .select('visibility')
      .eq('id', publishedCourseId)
      .single();

    if (courseCheckError) {
      console.error('[inviteToCourse] Course check failed:', courseCheckError);
      return {
        success: false,
        message: 'Could not verify course details.',
        data: null,
      };
    }

    // Only private courses need email invitations
    if (courseData.visibility !== 'private') {
      return {
        success: false,
        message:
          'Email invitations are only for private courses. This course is public or unlisted, so you can share the course link directly.',
        data: null,
      };
    }

    // 3. Verify pricing tier is active
    const { data: pricingTierData, error: pricingTierError } = await supabase
      .from('course_pricing_tiers')
      .select('is_active')
      .eq('id', pricingTierId)
      .single();

    if (pricingTierError) {
      console.error('[inviteToCourse] Pricing tier check failed:', pricingTierError);
      return {
        success: false,
        message: 'Could not verify pricing tier.',
        data: null,
      };
    }

    if (!pricingTierData.is_active) {
      return {
        success: false,
        message: 'Cannot send invite. The selected pricing tier is inactive.',
        data: null,
      };
    }

    // 4. Check pending invite
    const { data: existingInvites, error: inviteCheckError } = await supabase
      .from('course_invites')
      .select('id')
      .eq('published_course_id', publishedCourseId)
      .eq('email', email)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString());

    if (inviteCheckError) {
      console.error('[inviteToCourse] Invite check failed:', inviteCheckError);
      return {
        success: false,
        message: 'Could not verify invite status.',
        data: null,
      };
    }

    if (existingInvites && existingInvites.length > 0) {
      return {
        success: false,
        message: 'This user already has a pending invite for this course.',
        data: null,
      };
    }

    // 5. Tier restriction check via RLS (will be caught by insert error)
    // The can_send_course_invite function is called automatically by RLS

    // ✅ Passed all checks — insert invite
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('course_invites')
      .insert({
        published_course_id: publishedCourseId,
        organization_id: organizationId,
        cohort_id: cohortId || null,
        pricing_tier_id: pricingTierId,
        email,
        invited_by: user?.id ?? '',
        token,
        resend_count: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('[inviteToCourse] DB insert error:', error);

      // Check if error is due to tier restrictions
      if (error.message.includes('can_send_course_invite')) {
        return {
          success: false,
          message:
            'Your organization tier does not allow sending invites for free courses. Upgrade your plan to send invites.',
          data: null,
        };
      }

      return {
        success: false,
        message: 'Failed to create invite. Please try again.',
        data: null,
      };
    }

    const { error: invokeError } = await supabase.functions.invoke('send-course-invite', {
      body: { email, token },
    });

    if (invokeError) {
      console.error('[inviteToCourse] Email send failed:', invokeError);
      return {
        success: false,
        message: 'Failed to send invite email.',
        data,
      };
    }

    return {
      success: true,
      message: 'Invitation is being sent.',
      data,
    };
  } catch (err) {
    console.error('[inviteToCourse] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};
