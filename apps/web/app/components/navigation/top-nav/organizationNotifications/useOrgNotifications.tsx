import { useEffect, useState } from 'react';

import { type OrgNotification, subscribeToOrgNotifications } from './subscribeToOrgNotifications';

import { supabaseClient } from '~/lib/supabase/supabaseClient';

export function useOrgNotifications(
  organizationId: string,
  memberRole: 'owner' | 'admin' | 'editor',
) {
  const [notifications, setNotifications] = useState<OrgNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial notifications
    const fetchInitialNotifications = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      const { data, error } = await supabaseClient.rpc('get_org_notifications_for_member', {
        p_organization_id: organizationId,
        p_user_id: user?.id,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) {
        console.error('❌ get_org_notifications_for_member:', error);
        return;
      }

      console.log(data);

      if (data) {
        // Safely map/transform JSON to your expected shape
        const formatted = data.map((n) => ({
          ...n,
          payload: (n.payload ?? {}) as Record<string, any>,
          visibility: (n.visibility ?? {
            owner: false,
            admin: false,
            editor: false,
          }) as OrgNotification['visibility'],
        }));

        setNotifications(formatted);
        setUnreadCount(formatted.filter((n) => !n.is_read).length);
      }
    };

    fetchInitialNotifications();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrgNotifications(
      organizationId,
      memberRole,
      (newNotification) => {
        // Add new notification to the top of the list
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Optional: Show toast/notification
      },
    );

    return () => {
      unsubscribe();
    };
  }, [organizationId, memberRole]);

  return { notifications, unreadCount };
}
