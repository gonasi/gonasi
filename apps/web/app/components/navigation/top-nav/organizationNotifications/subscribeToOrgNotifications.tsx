import type { Database } from '@gonasi/database/schema';

import { supabaseClient } from '~/lib/supabase/supabaseClient';

export interface OrgNotification {
  id: string;
  organization_id: string;
  key: Database['public']['Enums']['org_notification_key'];
  category: Database['public']['Enums']['org_notification_category'];
  title: string;
  body: string;
  link: string | null;
  payload: Record<string, any>;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  visibility: {
    owner: boolean;
    admin: boolean;
    editor: boolean;
  };
}

// ============================================================================
// Subscribe to notifications for a specific organization
// ============================================================================
export function subscribeToOrgNotifications(
  organizationId: string,
  memberRole: 'owner' | 'admin' | 'editor',
  onNotification: (notification: OrgNotification) => void,
) {
  const channelTopic = `org-notifications:${organizationId}`;

  // Create a private channel with RLS authorization
  const channel = supabaseClient.channel(channelTopic, {
    config: {
      private: true, // Enable RLS-based authorization
    },
  });

  channel
    .on('broadcast', { event: 'new_notification' }, (payload) => {
      const notification = payload.payload as OrgNotification;

      // Client-side double-check: verify this role should see this notification
      // (Server RLS already enforces this, but good for UI consistency)
      const visibility = notification.visibility;
      const canView =
        (memberRole === 'owner' && visibility.owner) ||
        (memberRole === 'admin' && visibility.admin) ||
        (memberRole === 'editor' && visibility.editor);

      if (canView) {
        onNotification(notification);
      }
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${channelTopic}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error:', organizationId, err);
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Connection timed out');
      } else if (status === 'CLOSED') {
        console.log('🔌 Channel closed');
      }
    });

  // Return cleanup function
  return () => {
    supabaseClient.removeChannel(channel);
  };
}
