import { fetchFileById } from '@gonasi/database/files';

import type { Route } from './+types/get-signed-url';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const modeParam = url.searchParams.get('mode');

  if (modeParam !== 'play' && modeParam !== 'preview') {
    throw new Response('Invalid mode', { status: 400 });
  }

  if (!params.fileId) {
    throw new Response('Missing fileId', { status: 400 });
  }

  const { supabase } = createClient(request);
  const data = await fetchFileById({
    supabase,
    fileId: params.fileId,
    mode: modeParam,
  });

  return data;
}
