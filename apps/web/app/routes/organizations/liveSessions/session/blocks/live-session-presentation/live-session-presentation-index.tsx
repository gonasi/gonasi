import { data as routerData } from 'react-router';
import { TvMinimalPlay } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchLiveSessionBlocks, fetchLiveSessionById } from '@gonasi/database/liveSessions';

import type { Route } from './+types/live-session-presentation-index';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Control Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Crowd views the live session',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const [session, blocksResult] = await Promise.all([
    fetchLiveSessionById({ supabase, sessionId }),
    fetchLiveSessionBlocks({
      supabase,
      liveSessionId: sessionId,
      organizationId: params.organizationId,
    }),
  ]);

  if (!session) {
    return redirectWithError(`/${params.organizationId}/live-sessions`, 'Session not found.', {
      headers,
    });
  }

  if (!blocksResult.success) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions/${sessionId}/blocks`,
      'Unable to load live session blocks.',
      { headers },
    );
  }

  return routerData(
    {
      session,
      blocks: blocksResult.data,
      sessionCode: session.session_code,
      mode: session.mode as 'test' | 'live',
    },
    { headers },
  );
}

export default function LiveSessionPresentationIndex({ params, loaderData }: Route.ComponentProps) {
  const { organizationId, sessionId } = params;
  const { session, blocks, sessionCode, mode } = loaderData;

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={<TvMinimalPlay />}
          closeRoute='/'
          title={session.name}
          className='container mx-auto'
        />
        <Modal.Body className='px-0 md:px-4'>
          <h1>Presentation screen</h1>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
