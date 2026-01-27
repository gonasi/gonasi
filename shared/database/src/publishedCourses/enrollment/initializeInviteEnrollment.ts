import { v4 as uuidv4 } from 'uuid';

import type { InitializeEnrollTransactionSchemaTypes } from '@gonasi/schemas/payments';
import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import type { TypedSupabaseClient } from '../../client';
import { validateCourseInvite } from '../../courseInvites';
import { getUserProfile } from '../../profile';
import type { ApiResponse } from '../../types';
import { toPaystackMetadata } from './toPaystackMetadata';
import {
  type InitializeEnrollTransactionResponse,
  InitializeEnrollTransactionResponseSchema,
} from './types';

/**
 * Initializes the enrollment process for a course via invitation — handles both free and paid flows.
 *
 * Workflow:
 *  1. Verify authenticated user
 *  2. Validate the course invite token
 *  3. Fetch course + pricing tiers and validate pricing
 *  4. Determine effective price from invite
 *  5. If free:
 *     - Call enrollment RPC directly with invite association
 *     - Mark invite as accepted
 *     - Return success/failure
 *  6. If paid:
 *     - Generate metadata with invite reference
 *     - Call serverless function to initialize Paystack transaction
 *     - Return success/failure
 *
 * @param supabase - Supabase client instance (admin client for RLS bypass)
 * @param data - Course, pricing tier, invite token, and org context
 */
export const initializeInviteEnrollment = async ({
  supabase,
  supabaseAdmin,
  data,
  inviteToken,
}: {
  supabase: TypedSupabaseClient;
  supabaseAdmin: TypedSupabaseClient;
  data: InitializeEnrollTransactionSchemaTypes;
  inviteToken: string;
}): Promise<ApiResponse<InitializeEnrollTransactionResponse>> => {
  try {
    const { publishedCourseId, pricingTierId, organizationId } = data;

    // Step 1: Ensure the user is authenticated
    const userProfile = await getUserProfile(supabase);

    if (!userProfile?.user) {
      console.error('[initializeInviteEnrollment] No authenticated user found.');
      return {
        success: false,
        message: 'You need to be logged in to accept this invitation.',
      };
    }

    // Step 2: Validate the course invite
    const inviteResult = await validateCourseInvite(
      supabaseAdmin,
      inviteToken,
      userProfile.user.email,
    );

    if (!inviteResult.success || !inviteResult.data) {
      console.error('[initializeInviteEnrollment] Invalid invite:', inviteResult.message);
      return {
        success: false,
        message: inviteResult.message,
      };
    }

    const inviteData = inviteResult.data;

    // Verify the invite matches the course being enrolled in
    if (inviteData.publishedCourseId !== publishedCourseId) {
      console.error('[initializeInviteEnrollment] Invite course mismatch');
      return {
        success: false,
        message: 'This invitation is not valid for the selected course.',
      };
    }

    // Step 3: Fetch published course and its pricing tiers
    const { data: course, error: courseFetchError } = await supabaseAdmin
      .from('published_courses')
      .select('id, pricing_tiers, name')
      .match({ id: publishedCourseId, organization_id: organizationId })
      .single();

    if (courseFetchError || !course) {
      console.error(
        '[initializeInviteEnrollment] Failed to fetch course:',
        courseFetchError?.message,
      );
      return {
        success: false,
        message: "Sorry, we couldn't find the course or it's no longer available.",
      };
    }

    // Step 4: Validate pricing tiers
    const rawTiers =
      typeof course.pricing_tiers === 'string'
        ? JSON.parse(course.pricing_tiers)
        : course.pricing_tiers;

    const pricingValidation = PricingSchema.safeParse(rawTiers);
    if (!pricingValidation.success) {
      console.error(
        '[initializeInviteEnrollment] Pricing validation failed:',
        pricingValidation.error,
      );
      return {
        success: false,
        message: 'There is a problem with the course pricing. Please contact support.',
      };
    }

    const selectedTier = pricingValidation.data.find((tier) => tier.id === pricingTierId);
    if (!selectedTier) {
      console.error('[initializeInviteEnrollment] Selected pricing tier not found:', pricingTierId);
      return {
        success: false,
        message: 'That pricing option is no longer available.',
      };
    }

    const hasValidPromotion =
      selectedTier.promotional_price != null &&
      (!selectedTier.promotion_end_date || new Date(selectedTier.promotion_end_date) > new Date());

    // Step 5: Use pricing from invite (already calculated/validated)
    const effectivePrice = hasValidPromotion ? selectedTier.promotional_price! : selectedTier.price;
    const isFree = effectivePrice === 0;
    const finalAmount = effectivePrice * 100; // Convert to kobo or cents

    // ─────────────────────────────────────────────────────
    // FREE ENROLLMENT FLOW (via Invite)
    // ─────────────────────────────────────────────────────
    if (isFree) {
      const { data: enrollData, error: enrollError } = await supabase.rpc(
        'enroll_user_via_invite',
        {
          p_user_id: userProfile.user.id,
          p_published_course_id: publishedCourseId,
          p_tier_id: selectedTier.id,
          p_cohort_id: inviteData.cohortId ?? undefined,
          p_invite_id: inviteData.inviteId,
        },
      );

      if (enrollError) {
        console.error('[initializeInviteEnrollment] Free enrollment RPC failed:', enrollError);
        return {
          success: false,
          message: 'Enrollment failed. Please try again later.',
        };
      }

      if (enrollData && typeof enrollData === 'object' && 'success' in enrollData) {
        if (!enrollData.success) {
          return {
            success: false,
            message:
              typeof enrollData.message === 'string'
                ? enrollData.message
                : 'Enrollment was not successful.',
          };
        }

        return {
          success: true,
          message: `You've successfully enrolled in ${course.name} via invitation!`,
        };
      }
    }

    // ─────────────────────────────────────────────────────
    // PAID ENROLLMENT FLOW (via Invite)
    // ─────────────────────────────────────────────────────

    const reference = uuidv4();

    const metadata = toPaystackMetadata({
      publishedCourseId,
      pricingTierId,
      organizationId,
      userId: userProfile.user.id,
      userEmail: userProfile.user.email,
      userName: userProfile.user.full_name ?? '',
      tierName: selectedTier.tier_name ?? '',
      tierDescription: selectedTier.tier_description ?? '',
      paymentFrequency: selectedTier.payment_frequency,
      isPromotional: false, // Invite pricing is not promotional
      promotionalPrice: null,
      effectivePrice,
      courseTitle: course.name,
      cohortId: inviteData.cohortId ?? null,
      // Add invite-specific metadata
      inviteId: inviteData.inviteId,
      inviteToken,
    });

    const { data: transactionData, error: transactionError } = await supabase.functions.invoke(
      'initialize-paystack-transaction',
      {
        body: {
          email: userProfile.user.email,
          name: userProfile.user.full_name,
          amount: finalAmount,
          currencyCode: inviteData.currencyCode,
          reference,
          metadata,
        },
      },
    );

    if (transactionError || !transactionData) {
      console.error(
        '[initializeInviteEnrollment] Payment initialization failed:',
        transactionError,
      );
      return {
        success: false,
        message: `We couldn't start the payment process. Please try again.`,
      };
    }

    const parsedTransaction = InitializeEnrollTransactionResponseSchema.safeParse(
      transactionData.data,
    );
    if (!parsedTransaction.success) {
      console.error(
        '[initializeInviteEnrollment] Payment response validation failed:',
        parsedTransaction.error,
      );
      return {
        success: false,
        message: 'Unexpected response from payment provider. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Payment initialized successfully.',
      data: parsedTransaction.data,
    };
  } catch (err) {
    console.error('[initializeInviteEnrollment] Unexpected error:', err);
    return {
      success: false,
      message: 'Oops! Something went wrong. Please try again later.',
    };
  }
};
