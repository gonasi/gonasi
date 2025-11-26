import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import { getOrganizationFreeCoursesUsage } from './getOrganizationFreeCoursesUsage';
import { getOrganizationStorageUsage } from './getOrganizationStorageUsage';
import type { TierStatus } from './tierLimitsTypes';

interface OrganizationTierLimitsSummaryArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

// Helper: Calculate days remaining
const getDaysRemaining = (endDate: string | null): number | null => {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

// Helper: Format days remaining message
const formatDaysMessage = (days: number | null): string => {
  if (days === null) return '';
  if (days <= 0) return 'ending today';
  if (days === 1) return 'ending tomorrow';
  return `ending in ${days} days`;
};

export const organizationTierLimitsSummary = async ({
  supabase,
  organizationId,
}: OrganizationTierLimitsSummaryArgs) => {
  try {
    const userId = await getUserId(supabase);

    // ------------------------------------------------------
    //  Fetch subscription + tier limits in ONE query
    // ------------------------------------------------------
    const { data: subscription, error: subscriptionError } = await supabase
      .from('organization_subscriptions')
      .select(
        `
        id,
        organization_id,
        tier,
        status,
        cancel_at_period_end,
        next_tier,
        downgrade_effective_at,
        downgrade_requested_at,
        current_period_end,
  
        tier_limits: tier_limits!organization_subscriptions_tier_fkey (
          storage_limit_mb_per_org,
          max_members_per_org,
          max_free_courses_per_org,
          ai_tools_enabled,
          custom_domains_enabled,
          price_monthly_usd,
          price_yearly_usd,
          platform_fee_percentage
        )
      `,
      )
      .eq('organization_id', organizationId)
      .single();

    if (!subscription || subscriptionError) {
      return {
        success: false,
        status: 'error',
        message: 'We could not load your organization plan details. Please try again later.',
        data: null,
      };
    }

    const limits = subscription.tier_limits;
    if (!limits) {
      return {
        success: false,
        status: 'error',
        message: 'Your subscription information is incomplete. Please contact support.',
        data: null,
      };
    }

    let warningCount = 0;
    let errorCount = 0;
    const issues: string[] = [];

    // ------------------------------------------------------
    // SUBSCRIPTION STATUS CHECKS
    // ------------------------------------------------------
    if (subscription.status !== 'active') {
      if (subscription.status === 'non-renewing') {
        // Cancelled subscription - will end at period end
        const daysUntilEnd = getDaysRemaining(subscription.current_period_end);
        const timeframe = formatDaysMessage(daysUntilEnd);
        warningCount++;
        issues.push(
          `Your subscription has been cancelled and is ${timeframe}. After that, you'll lose access to paid features.`,
        );
      } else if (subscription.status === 'attention') {
        // Payment issue
        errorCount++;
        issues.push(
          `Your subscription requires immediate attention. There's a payment issue that needs to be resolved.`,
        );
      } else if (subscription.status === 'completed') {
        // Fixed-term subscription ended
        errorCount++;
        issues.push(
          'Your fixed-term subscription has ended. Please renew to continue using premium features.',
        );
      } else if (subscription.status === 'cancelled') {
        // Immediately terminated
        errorCount++;
        issues.push(
          'Your subscription has been terminated. Contact support if this was unexpected.',
        );
      }
    }

    // Also check cancel_at_period_end flag if status is active
    if (subscription.status === 'active' && subscription.cancel_at_period_end) {
      const daysUntilEnd = getDaysRemaining(subscription.current_period_end);
      const timeframe = formatDaysMessage(daysUntilEnd);
      warningCount++;
      issues.push(
        `Your subscription is set to cancel ${timeframe}. You can reactivate it anytime before then.`,
      );
    }

    // ------------------------------------------------------
    // DOWNGRADE SCHEDULED CHECK
    // ------------------------------------------------------
    if (subscription.next_tier && subscription.downgrade_effective_at) {
      const daysUntilDowngrade = getDaysRemaining(subscription.downgrade_effective_at);
      const timeframe = formatDaysMessage(daysUntilDowngrade);
      warningCount++;
      issues.push(
        `Your plan will downgrade to ${subscription.next_tier} ${timeframe}. Some features may become unavailable.`,
      );
    }

    // ------------------------------------------------------
    // TEMP PLAN CHECK
    // ------------------------------------------------------
    if (subscription.tier === 'temp') {
      errorCount++;
      issues.push(
        'Your organization is on a TEMP plan. Upgrade to unlock full features like creating courses and uploading files.',
      );
    }

    // ------------------------------------------------------
    // STORAGE CHECK
    // ------------------------------------------------------
    const storageLimits = await getOrganizationStorageUsage({
      supabase,
      organizationId,
      allowedStorageMB: limits.storage_limit_mb_per_org,
    });

    if (storageLimits.exceeded_limit) {
      errorCount++;
      issues.push(
        `You have exceeded your organization's storage limit. Please remove some files or upgrade your plan.`,
      );
    } else if (storageLimits.approaching_limit) {
      warningCount++;
      issues.push(
        'Your organization is nearing its storage limit. Consider cleaning up or upgrading your plan soon.',
      );
    }

    // ------------------------------------------------------
    // FREE COURSES CHECK
    // ------------------------------------------------------
    const freeCoursesUsage = await getOrganizationFreeCoursesUsage({
      supabase,
      organizationId,
      maxFreeCourses: limits.max_free_courses_per_org,
    });

    if (freeCoursesUsage.exceeded_limit) {
      errorCount++;
      issues.push(
        'You have reached the maximum number of free courses allowed on your plan. Upgrade to add more.',
      );
    } else if (freeCoursesUsage.approaching_limit) {
      warningCount++;
      issues.push(
        'You are close to reaching the free courses limit. Plan ahead if you want to publish more free courses.',
      );
    }

    // ------------------------------------------------------
    // OVERALL STATUS
    // ------------------------------------------------------
    let status: TierStatus = 'success';
    if (errorCount > 0) status = 'error';
    else if (warningCount > 0) status = 'warning';

    // ------------------------------------------------------
    // SUMMARY MESSAGE (more specific wording)
    // ------------------------------------------------------
    let message: string;

    if (issues.length === 0) {
      message = `All systems are within your plan limits. You're good to go!`;
    } else {
      const firstIssue = issues[0] ?? '';
      const remaining = issues.length - 1;

      if (remaining > 0) {
        const issueWord = remaining === 1 ? 'issue' : 'issues';

        if (errorCount > 0 && warningCount > 0) {
          message = `${firstIssue} And ${remaining} more ${issueWord} (mix of warnings and errors).`;
        } else if (errorCount > 0) {
          message = `${firstIssue} And ${remaining} more ${issueWord} requiring attention.`;
        } else {
          message = `${firstIssue} And ${remaining} more ${issueWord} to review.`;
        }
      } else {
        message = firstIssue;
      }
    }

    return {
      success: status !== 'error',
      status,
      message,
      data: {
        subscription,
        limits,
        storageLimits,
        freeCoursesUsage,
        warningCount,
        errorCount,
        allIssues: issues,
      },
    };
  } catch (err) {
    console.error('[organizationTierLimitsSummary] Unexpected error:', err);
    return {
      success: false,
      status: 'error',
      message:
        'Something went wrong while checking your organization limits. Please try again shortly.',
      data: null,
    };
  }
};
