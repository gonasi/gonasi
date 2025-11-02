insert into public.user_notifications_types
  (key, category, default_in_app, default_email, title_template, body_template)
values
  -- Commerce
  (
    'course_purchase_success',
    'commerce',
    true, true,
    'Purchase successful',
    'You have successfully purchased {{course_name}}. You now have full access to the course.'
  ),
  (
    'course_purchase_failed',
    'commerce',
    true, true,
    'Purchase failed',
    'Your attempt to purchase {{course_name}} was unsuccessful. Reason: {{error_message}}.'
  ),
  (
    'course_refund_processed',
    'commerce',
    true, true,
    'Refund issued',
    'A refund for {{course_name}} has been processed. Amount refunded: {{amount}} {{currency}}.'
  ),
  (
    'course_subscription_started',
    'commerce',
    true, true,
    'Subscription activated',
    'Your subscription for {{course_name}} has started. Billing cycle: {{billing_cycle}}.'
  ),
  (
    'course_subscription_renewed',
    'commerce',
    true, true,
    'Subscription renewed',
    'Your subscription for {{course_name}} has been renewed successfully.'
  ),
  (
    'course_subscription_failed',
    'commerce',
    true, true,
    'Subscription renewal failed',
    'We were unable to renew your subscription for {{course_name}}. Reason: {{error_message}}.'
  ),
  (
    'course_subscription_expiring',
    'commerce',
    true, true,
    'Subscription expiring soon',
    'Your subscription for {{course_name}} will expire on {{expiry_date}}.'
  ),
    (
    'course_enrollment_free_success',
    'commerce',
    true, true,
    'Enrollment successful',
    'You have successfully enrolled in the free course {{course_name}}. You now have full access.'
  ),


  -- Learning
  (
    'lesson_completed',
    'learning',
    true, false,
    'Lesson completed',
    'You just completed {{lesson_name}} in {{course_name}}. Great job!'
  ),
  (
    'course_completed',
    'learning',
    true, true,
    'Course completed',
    'Congratulations! You’ve completed the entire course {{course_name}}.'
  ),
  (
    'streak_reminder',
    'learning',
    true, true,
    'Keep your streak alive',
    'You haven’t learned today. Continue {{course_name}} to keep your streak going.'
  ),
  (
    'new_chapter_unlocked',
    'learning',
    true, true,
    'New chapter unlocked',
    'A new chapter "{{chapter_name}}" is now available in {{course_name}}.'
  ),

  -- Billing
  (
    'payment_method_expiring',
    'billing',
    true, true,
    'Payment method expiring',
    'Your payment method ending with {{last4}} will expire on {{expiry_date}}. Please update it to avoid interruptions.'
  ),
  (
    'invoice_ready',
    'billing',
    true, true,
    'New invoice available',
    'Your invoice for {{period}} is ready. Amount due: {{amount}} {{currency}}.'
  ),
  (
    'account_security_alert',
    'billing',
    true, true,
    'Security alert',
    'Your account was accessed from a new device or location: {{location}}. If this was not you, please secure your account.'
  ),

  -- Social
  (
    'organization_invite_received',
    'social',
    true, true,
    'You’ve been invited to join {{organization_name}}',
    '{{inviter_name}} has invited you to join the organization {{organization_name}}. Accept or decline your invitation in your dashboard.'
  ),
  (
    'organization_invite_accepted',
    'social',
    true, true,
    'Invitation accepted',
    '{{user_name}} has accepted your invitation to join {{organization_name}}.'
  ),
  (
    'organization_role_changed',
    'social',
    true, true,
    'Your role has changed',
    'Your role in {{organization_name}} has been updated to {{new_role}}.'
  ),

  -- System
  (
    'announcement',
    'system',
    true, true,
    'New announcement',
    '{{message}}'
  ),
  (
    'maintenance_notice',
    'system',
    true, true,
    'Scheduled maintenance',
    'Gonasi will undergo scheduled maintenance on {{scheduled_for}}. Some features may be unavailable.'
  )
on conflict (key) do nothing;
