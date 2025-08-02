import { data } from 'react-router';

import { fetchFileById } from '@gonasi/database/files';

import type { Route } from './+types/get-signed-url';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const modeParam = url.searchParams.get('mode');

  const mode = modeParam === 'play' || modeParam === 'preview' ? modeParam : 'preview';

  const { supabase } = createClient(request);
  const file = await fetchFileById({
    supabase,
    fileId: params.fileId,
    mode,
  });

  return data({ file });
}
