import type { Route } from './+types/upsert-block-api';

import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement API route for saving blocks
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate block data with Zod schema
  // TODO: Check user can edit session
  // TODO: If blockId exists, update; else create new
  // TODO: Handle position assignment for new blocks
  // TODO: Return success with block ID

  return { success: true, blockId: null };
}
