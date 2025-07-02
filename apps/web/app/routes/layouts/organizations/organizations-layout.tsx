import { useEffect, useState } from 'react';
import { Outlet, redirect } from 'react-router';
import { Info } from 'lucide-react';

import { verifyAndSetActiveOrganization } from '@gonasi/database/organizations';

import type { Route } from './+types/organizations-layout';

import { ProfileTopNav } from '~/components/navigation/top-nav/profile-top-nav';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export function links() {
  return [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon_dash.ico',
    },
  ];
}

export function meta({ data }: Route.MetaArgs) {
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

  const result = await verifyAndSetActiveOrganization({
    supabase,
    organizationId,
  });

  if (!result.success || !result.data) {
    throw redirect('/');
  }

  return { ...result.data, message: result.message };
}

export default function OrganizationsPlainLayout({ loaderData }: Route.ComponentProps) {
  const { activeUserProfile } = useStore();
  const { organization, member, message: organizationSwitchMessage } = loaderData;

  const [showOrganizationSwitchModal, setShowOrganizationSwitchModal] = useState(false);

  useEffect(() => {
    if (organizationSwitchMessage) {
      setShowOrganizationSwitchModal(true);
    }
  }, [organizationSwitchMessage]);

  return (
    <div>
      <ProfileTopNav user={activeUserProfile} organization={organization} member={member} />
      <Outlet />
      <Modal open={showOrganizationSwitchModal} onOpenChange={setShowOrganizationSwitchModal}>
        <Modal.Content size='sm'>
          <Modal.Body className='p-6'>
            <div className='flex w-full items-center justify-center py-4'>
              <Info size={36} className='text-info' />
            </div>
            <div className='flex items-start gap-4'>
              <div>
                <p className='font-secondary text-md mt-1'>
                  {`${organizationSwitchMessage} to `}
                  <span className='font-bold'>{organization.name}</span>
                </p>
              </div>
            </div>

            <div className='mt-6 text-right'>
              <Button variant='ghost' onClick={() => setShowOrganizationSwitchModal(false)}>
                Close
              </Button>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </div>
  );
}
