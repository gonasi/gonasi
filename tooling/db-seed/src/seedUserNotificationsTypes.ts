import type { Database } from '@gonasi/database/schema';

import { PASSWORD, SU_EMAIL, supabase } from './constants';

// ============================================================================
// Notification Types Seed (Literal-Safe via `satisfies`)
// ============================================================================

const user_notifications_types = [
  // ============================
  // COMMERCE
  // ============================
  {
    key: 'course_purchase_success',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Purchase successful',
    body_template:
      'You have successfully purchased {{course_name}}. You now have full access to the course.',
  },
  {
    key: 'course_purchase_failed',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Purchase failed',
    body_template:
      'Your attempt to purchase {{course_name}} was unsuccessful. Reason: {{error_message}}.',
  },
  {
    key: 'course_refund_processed',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Refund issued',
    body_template:
      'A refund for {{course_name}} has been processed. Amount refunded: {{amount}} {{currency}}.',
  },
  {
    key: 'course_subscription_started',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription activated',
    body_template:
      'Your subscription for {{course_name}} has started. Billing cycle: {{billing_cycle}}.',
  },
  {
    key: 'course_subscription_renewed',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription renewed',
    body_template: 'Your subscription for {{course_name}} has been renewed successfully.',
  },
  {
    key: 'course_subscription_failed',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription renewal failed',
    body_template:
      'We were unable to renew your subscription for {{course_name}}. Reason: {{error_message}}.',
  },
  {
    key: 'course_subscription_expiring',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Subscription expiring soon',
    body_template: 'Your subscription for {{course_name}} will expire on {{expiry_date}}.',
  },
  {
    key: 'course_enrollment_free_success',
    category: 'commerce',
    default_in_app: true,
    default_email: true,
    title_template: 'Enrollment successful',
    body_template:
      'You have successfully enrolled in the free course {{course_name}}. You now have full access.',
  },

  // ============================
  // LEARNING
  // ============================
  {
    key: 'lesson_completed',
    category: 'learning',
    default_in_app: true,
    default_email: false,
    title_template: 'Lesson completed',
    body_template: 'You just completed {{lesson_name}} in {{course_name}}. Great job!',
  },
  {
    key: 'course_completed',
    category: 'learning',
    default_in_app: true,
    default_email: true,
    title_template: 'Course completed',
    body_template: 'Congratulations! You’ve completed the entire course {{course_name}}.',
  },
  {
    key: 'streak_reminder',
    category: 'learning',
    default_in_app: true,
    default_email: true,
    title_template: 'Keep your streak alive',
    body_template: 'You haven’t learned today. Continue {{course_name}} to keep your streak going.',
  },
  {
    key: 'new_chapter_unlocked',
    category: 'learning',
    default_in_app: true,
    default_email: true,
    title_template: 'New chapter unlocked',
    body_template: 'A new chapter "{{chapter_name}}" is now available in {{course_name}}.',
  },

  // ============================
  // BILLING
  // ============================
  {
    key: 'payment_method_expiring',
    category: 'billing',
    default_in_app: true,
    default_email: true,
    title_template: 'Payment method expiring',
    body_template:
      'Your payment method ending with {{last4}} will expire on {{expiry_date}}. Please update it to avoid interruptions.',
  },
  {
    key: 'invoice_ready',
    category: 'billing',
    default_in_app: true,
    default_email: true,
    title_template: 'New invoice available',
    body_template: 'Your invoice for {{period}} is ready. Amount due: {{amount}} {{currency}}.',
  },
  {
    key: 'account_security_alert',
    category: 'billing',
    default_in_app: true,
    default_email: true,
    title_template: 'Security alert',
    body_template:
      'Your account was accessed from a new device or location: {{location}}. If this was not you, please secure your account.',
  },

  // ============================
  // SOCIAL
  // ============================
  {
    key: 'organization_invite_received',
    category: 'social',
    default_in_app: true,
    default_email: true,
    title_template: 'You’ve been invited to join {{organization_name}}',
    body_template:
      '{{inviter_name}} has invited you to join the organization {{organization_name}}. Accept or decline your invitation in your dashboard.',
  },
  {
    key: 'organization_invite_accepted',
    category: 'social',
    default_in_app: true,
    default_email: true,
    title_template: 'Invitation accepted',
    body_template: '{{user_name}} has accepted your invitation to join {{organization_name}}.',
  },
  {
    key: 'organization_role_changed',
    category: 'social',
    default_in_app: true,
    default_email: true,
    title_template: 'Your role has changed',
    body_template: 'Your role in {{organization_name}} has been updated to {{new_role}}.',
  },

  // ============================
  // SYSTEM
  // ============================
  {
    key: 'announcement',
    category: 'system',
    default_in_app: true,
    default_email: true,
    title_template: 'New announcement',
    body_template: '{{message}}',
  },
  {
    key: 'maintenance_notice',
    category: 'system',
    default_in_app: true,
    default_email: true,
    title_template: 'Scheduled maintenance',
    body_template:
      'Gonasi will undergo scheduled maintenance on {{scheduled_for}}. Some features may be unavailable.',
  },
] satisfies Database['public']['Tables']['user_notifications_types']['Insert'][];

// ============================================================================
// Seed Function
// ============================================================================

export async function seedUserNotificationsTypes() {
  console.log('🌱 Seeding user_notifications_types...');

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: SU_EMAIL,
    password: PASSWORD,
  });

  if (signInError) {
    console.error('❌ Failed to sign in as superadmin:', signInError.message);
    return;
  }

  for (const nt of user_notifications_types) {
    const { key } = nt;

    const { error } = await supabase
      .from('user_notifications_types') // ✅ fixed typo
      .insert(nt);

    if (error) {
      console.log(`❌ Failed to insert ${key}: ${error.message}`);
    } else {
      console.log(`✅ Inserted ${key}`);
    }
  }

  await supabase.auth.signOut();
  console.log('✅ Done seeding user_notifications_types.');
}
