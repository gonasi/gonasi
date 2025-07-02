import {
  type LoaderFunctionArgs,
  type MetaFunction,
  Outlet,
  redirect,
  useNavigate,
  useParams,
} from 'react-router';

import { verifyAndSetActiveOrganization } from '@gonasi/database/organizations';
import type { VerifyAndSetActiveOrgResponse } from '@gonasi/schemas/organizations';

import { ProfileTopNav } from '~/components/navigation/top-nav/profile-top-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

type LoaderData = NonNullable<VerifyAndSetActiveOrgResponse['data']>;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: 'Organization Dashboard • Gonasi' }];
  }

  const { organization } = data;
  const orgName = organization.name || 'Organization';
  const isPublic = organization.is_public;

  return [
    { title: `${orgName} Dashboard • Gonasi` },
    {
      name: 'description',
      content: isPublic
        ? `${orgName} public dashboard on Gonasi. View and manage the organization’s profile, members, and content.`
        : `${orgName} private dashboard. Only authorized members can view and manage organization settings.`,
    },
    {
      name: 'robots',
      content: isPublic ? 'index, follow' : 'noindex, nofollow',
    },
  ];
};

export async function loader({ params, request }: LoaderFunctionArgs): Promise<LoaderData> {
  const { supabase } = createClient(request);
  const organizationId = params.organizationId;

  if (!organizationId) {
    throw new Response('Organization ID is required', { status: 400 });
  }

  const result = await verifyAndSetActiveOrganization({
    supabase,
    organizationId,
  });

  if (!result.success || !result.data) {
    throw redirect('/');
  }

  return result.data;
}

export default function OrganizationsPlainLayout() {
  const navigate = useNavigate();
  const params = useParams();
  const { activeUserProfile } = useStore();

  return (
    <div>
      <ProfileTopNav user={activeUserProfile} />
      <Outlet />
    </div>
  );
}
