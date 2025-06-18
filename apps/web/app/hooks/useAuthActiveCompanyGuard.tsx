import { useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';

import type { AppOutletContext } from '~/root';

export function useAuthGuard() {
  const { user } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      const redirectTo = location.pathname + location.search;
      navigate(`/login?${new URLSearchParams({ redirectTo })}`, { replace: true });
      return;
    }

    if (user.is_onboarding_complete === false) {
      const redirectTo = location.pathname + location.search;
      navigate(
        `/go/onboarding/${user.id}/basic-information?${new URLSearchParams({ redirectTo })}`,
        {
          replace: true,
        },
      );
    }
  }, [user, location, navigate]);

  const isLoading = !user || !user.is_onboarding_complete;
  return { isLoading, user };
}
