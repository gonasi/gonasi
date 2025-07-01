import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';

import { Spinner } from '~/components/loaders';
import { useStore } from '~/store';

export default function ProfileWrapperLayout() {
  const navigate = useNavigate();
  const params = useParams(); // expecting :username from route
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  const shouldRedirectToCorrectUsername =
    !!params.username &&
    !!activeUserProfile?.username &&
    params.username !== activeUserProfile.username;

  const shouldBlockRender =
    isActiveUserProfileLoading ||
    !activeUserProfile ||
    !activeUserProfile.username ||
    shouldRedirectToCorrectUsername;

  useEffect(() => {
    if (isActiveUserProfileLoading) return;

    if (!activeUserProfile) {
      navigate('/login');
      return;
    }

    if (!activeUserProfile.username) {
      navigate(`/go/onboarding/${activeUserProfile.id}`);
      return;
    }

    if (shouldRedirectToCorrectUsername) {
      navigate(`/go/${activeUserProfile.username}`);
    }
  }, [
    isActiveUserProfileLoading,
    activeUserProfile,
    navigate,
    params.username,
    shouldRedirectToCorrectUsername,
  ]);

  if (shouldBlockRender) {
    return <Spinner />;
  }

  return <Outlet />;
}
