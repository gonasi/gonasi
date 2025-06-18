import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useStore } from '~/store';

/**
 * Redirects users to appropriate pages based on their authentication
 * and onboarding status.
 */
export function useAuthGuard() {
  const { activeUserProfile } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!activeUserProfile) {
      const redirectTo = location.pathname + location.search;
      navigate(`/login?${new URLSearchParams({ redirectTo })}`, { replace: true });
      return;
    }

    // Redirect to onboarding if onboarding is not complete
    if (activeUserProfile.is_onboarding_complete === false) {
      const redirectTo = location.pathname + location.search;
      navigate(
        `/go/${activeUserProfile.id}/basic-information?${new URLSearchParams({ redirectTo })}`,
        { replace: true },
      );
    }
  }, [activeUserProfile, location, navigate]);

  // Indicate loading state until onboarding is complete
  const isLoading = !activeUserProfile || !activeUserProfile.is_onboarding_complete;

  return { isLoading };
}
