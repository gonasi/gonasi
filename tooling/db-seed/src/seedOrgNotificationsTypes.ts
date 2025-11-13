import type { Database } from '@gonasi/database/schema';

import { PASSWORD, SU_EMAIL, supabase } from './constants';

// ============================================================================
// Organization Notification Types Seed (Literal-Safe via `satisfies`)
// ============================================================================

const org_notifications_types = [
  // ============================
  // BILLING
  // ============================
  {
    key: 'org_subscription_started',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription activated',
    body_template:
      'Your organization is now subscribed to the {{tier_name}} plan at {{amount}}/{{interval}}.',
  },
  {
    key: 'org_subscription_renewed',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription renewed',
    body_template:
      'Your {{tier_name}} subscription has been renewed. Next billing date: {{next_billing_date}}.',
  },
  {
    key: 'org_subscription_failed',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Payment failed',
    body_template:
      "We couldn't process your payment for the {{tier_name}} plan. Please update your payment method.",
  },
  {
    key: 'org_subscription_expiring',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription expiring soon',
    body_template:
      'Your {{tier_name}} subscription expires on {{expiry_date}}. Renew to keep access to premium features.',
  },
  {
    key: 'org_payment_method_expiring',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Payment method expiring',
    body_template:
      'Your payment method ending in {{last4}} expires on {{expiry_date}}. Please update it to avoid service interruption.',
  },
  {
    key: 'org_invoice_ready',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Invoice ready',
    body_template: 'Your invoice for {{amount}} is ready. Download it from your billing dashboard.',
  },
  {
    key: 'org_tier_upgraded',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Plan upgraded! 🎉',
    body_template: 'Your organization has been upgraded to {{tier_name}}. Enjoy your new features!',
  },
  {
    key: 'org_tier_downgraded',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Plan changed',
    body_template:
      'Your organization has been moved to the {{tier_name}} plan. Changes take effect on {{effective_date}}.',
  },
  {
    key: 'org_tier_downgrade_activated',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Downgrade completed',
    body_template:
      'Your organization is now on the {{tier_name}} plan. The downgrade took effect on {{effective_date}}.',
  },
  {
    key: 'org_downgrade_cancelled',
    category: 'billing',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Downgrade cancelled',
    body_template:
      'Your scheduled downgrade to the {{tier_name}} plan has been cancelled. Your organization will remain on the {{current_tier_name}} plan.',
  },

  // ============================
  // MEMBERS
  // ============================
  {
    key: 'org_member_invited',
    category: 'members',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: false,
    title_template: 'Member invited',
    body_template: '{{invited_by_name}} invited {{member_email}} to join as {{role}}.',
  },
  {
    key: 'org_member_joined',
    category: 'members',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'New member joined',
    body_template: '{{member_name}} has joined your organization as {{role}}.',
  },
  {
    key: 'org_member_left',
    category: 'members',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: false,
    title_template: 'Member left',
    body_template: '{{member_name}} has left your organization.',
  },
  {
    key: 'org_member_role_changed',
    category: 'members',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: false,
    title_template: 'Member role updated',
    body_template:
      "{{member_name}}'s role has been changed from {{old_role}} to {{new_role}} by {{changed_by_name}}.",
  },
  {
    key: 'org_member_removed',
    category: 'members',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: false,
    title_template: 'Member removed',
    body_template: '{{member_name}} was removed from the organization by {{removed_by_name}}.',
  },
  {
    key: 'org_ownership_transferred',
    category: 'members',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Ownership transferred',
    body_template:
      'Organization ownership has been transferred from {{previous_owner_name}} to {{new_owner_name}}.',
  },

  // ============================
  // COURSES
  // ============================
  {
    key: 'org_course_created',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'New course created',
    body_template: '{{created_by_name}} created a new course: "{{course_title}}".',
  },
  {
    key: 'org_course_updated',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Course updated',
    body_template: '{{updated_by_name}} updated the course "{{course_title}}".',
  },
  {
    key: 'org_course_published',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Course published',
    body_template: '{{course_title}} has been published by {{published_by_name}}.',
  },
  {
    key: 'org_course_unpublished',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Course unpublished',
    body_template: '{{course_title}} has been unpublished by {{unpublished_by_name}}.',
  },
  {
    key: 'org_course_archived',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Course archived',
    body_template: '{{course_title}} has been archived.',
  },
  {
    key: 'org_course_deleted',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Course deleted',
    body_template: '{{course_title}} has been permanently deleted.',
  },
  {
    key: 'org_course_milestone_reached',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'Milestone reached! 🎯',
    body_template: '{{course_title}} has reached {{milestone_count}} {{milestone_type}}!',
  },
  {
    key: 'org_course_review_posted',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: 'New course review',
    body_template: '{{reviewer_name}} rated "{{course_title}}" {{rating}}★: "{{review_excerpt}}".',
  },
  {
    key: 'org_course_review_flagged',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Course review flagged',
    body_template: 'A review for "{{course_title}}" was flagged for {{reason}}. Please review.',
  },
  {
    key: 'org_content_flagged',
    category: 'courses',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Content flagged for review',
    body_template:
      '{{content_type}} "{{content_title}}" has been flagged for {{reason}}. Please review.',
  },

  // ============================
  // PURCHASES
  // ============================
  {
    key: 'org_course_purchase_completed',
    category: 'purchases',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Course purchase completed 💰',
    body_template: '{{buyer_name}} purchased "{{course_title}}" for {{amount}}.',
  },
  {
    key: 'org_course_purchase_refunded',
    category: 'purchases',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Course refunded',
    body_template: 'A refund was issued for "{{course_title}}" ({{amount}}) to {{buyer_name}}.',
  },
  {
    key: 'org_course_purchase_failed',
    category: 'purchases',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Course purchase failed',
    body_template:
      'Purchase attempt for "{{course_title}}" by {{buyer_name}} failed. Reason: {{failure_reason}}.',
  },
  {
    key: 'org_course_subscription_started',
    category: 'purchases',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Course subscription started',
    body_template: '{{buyer_name}} subscribed to "{{course_title}}" ({{plan_name}} plan).',
  },
  {
    key: 'org_course_subscription_renewed',
    category: 'purchases',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Course subscription renewed',
    body_template:
      '{{buyer_name}}\'s subscription for "{{course_title}}" has renewed successfully.',
  },
  {
    key: 'org_course_subscription_canceled',
    category: 'purchases',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Course subscription canceled',
    body_template: '{{buyer_name}} canceled their subscription for "{{course_title}}".',
  },

  // ============================
  // COMPLIANCE
  // ============================
  {
    key: 'org_verification_approved',
    category: 'compliance',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Organization verified ✓',
    body_template:
      'Congratulations! Your organization has been verified. You now have access to verified features.',
  },
  {
    key: 'org_verification_rejected',
    category: 'compliance',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Verification unsuccessful',
    body_template:
      'Your verification request was not approved. Reason: {{reason}}. You can resubmit with updated information.',
  },
  {
    key: 'org_policy_update_required',
    category: 'compliance',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: false,
    default_in_app: true,
    default_email: true,
    title_template: 'Action required: Policy update',
    body_template:
      'Our {{policy_name}} has been updated. Please review and accept the changes by {{deadline}}.',
  },

  // ============================
  // SYSTEM
  // ============================
  {
    key: 'org_announcement',
    category: 'system',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: false,
    title_template: '{{announcement_title}}',
    body_template: '{{announcement_body}}',
  },
  {
    key: 'org_maintenance_notice',
    category: 'system',
    visible_to_owner: true,
    visible_to_admin: true,
    visible_to_editor: true,
    default_in_app: true,
    default_email: true,
    title_template: 'Scheduled maintenance',
    body_template:
      'Gonasi will be undergoing maintenance on {{maintenance_date}} from {{start_time}} to {{end_time}}. Some features may be unavailable.',
  },
] satisfies Database['public']['Tables']['org_notifications_types']['Insert'][];

// ============================================================================
// Seed Function
// ============================================================================
export async function seedOrgNotificationsTypes() {
  console.log('🌱 Seeding org_notifications_types...');

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: SU_EMAIL,
    password: PASSWORD,
  });

  if (signInError) {
    console.error('❌ Failed to sign in as superadmin:', signInError.message);
    return;
  }

  for (const nt of org_notifications_types) {
    const { key } = nt;
    const { error } = await supabase.from('org_notifications_types').insert(nt);

    if (error) {
      console.log(`❌ Failed to insert ${key}: ${error.message}`);
    } else {
      console.log(`✅ Inserted ${key}`);
    }
  }

  await supabase.auth.signOut();
  console.log('✅ Done seeding org_notifications_types.');
}
