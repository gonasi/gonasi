import { useEffect, useState } from 'react';
import { Outlet, redirect } from 'react-router';
import { Info } from 'lucide-react';

import { verifyAndSetActiveOrganization } from '@gonasi/database/organizations';

import type { Route } from './+types/organizations-layout';

import { ProfileTopNav } from '~/components/navigation/top-nav/profile-top-nav';
import { DesktopNav } from '~/components/navigation/top-nav/responsive-nav/desktop-nav';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { useDashboardLinks } from '~/hooks/useDashboardLinks';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export function links() {
  return [{ rel: 'icon', type: 'image/x-icon', href: '/favicon_dash.ico' }];
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: 'Organization Dashboard • Gonasi' }];

  const { organization } = data;
  const orgName = organization.name || 'Organization';

  return [
    { title: `${orgName} Dashboard • Gonasi` },
    {
      name: 'description',
      content: organization.is_public
        ? `${orgName} public dashboard on Gonasi. View and manage the organization’s profile, members, and content.`
        : `${orgName} private dashboard. Only authorized members can view and manage organization settings.`,
    },
    {
      name: 'robots',
      content: organization.is_public ? 'index, follow' : 'noindex, nofollow',
    },
  ];
}

type LoaderData = Awaited<ReturnType<typeof loader>>;
export type OrganizationLoaderData = LoaderData['organization'];
export type MemberLoaderData = LoaderData['member'];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const organizationId = params.organizationId;

  if (!organizationId) {
    throw new Response('Organization ID is required', { status: 400 });
  }

  const result = await verifyAndSetActiveOrganization({ supabase, organizationId });

  if (!result.success || !result.data) {
    throw redirect('/');
  }

  return { ...result.data, message: result.message };
}

export default function OrganizationsPlainLayout({ loaderData }: Route.ComponentProps) {
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();
  const { organization, member, message: organizationSwitchMessage } = loaderData;
  const [showOrgSwitchModal, setShowOrgSwitchModal] = useState(!!organizationSwitchMessage);

  useEffect(() => {
    if (organizationSwitchMessage) setShowOrgSwitchModal(true);
  }, [organizationSwitchMessage]);

  const filteredLinks = useDashboardLinks({
    organizationId: organization.id,
    role: member.role,
  });

  return (
    <div className='min-h-screen'>
      <DesktopNav links={filteredLinks} />
      <div className='md:pl-64'>
        <ProfileTopNav
          user={activeUserProfile}
          organization={organization}
          member={member}
          loading={isActiveUserProfileLoading}
        />
        <Outlet context={{ organization, member }} />
      </div>

      <Modal open={showOrgSwitchModal} onOpenChange={setShowOrgSwitchModal}>
        <Modal.Content size='sm'>
          <Modal.Body className='p-6'>
            <div className='flex w-full items-center justify-center py-4'>
              <Info size={36} className='text-info' />
            </div>
            <p className='font-secondary text-md text-center'>
              {organizationSwitchMessage} to <span className='font-bold'>{organization.name}</span>
            </p>
            <div className='mt-6 text-right'>
              <Button variant='ghost' onClick={() => setShowOrgSwitchModal(false)}>
                Close
              </Button>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </div>
  );
}
