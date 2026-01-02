import { updateFileSettings } from '@gonasi/database/files';
import { Model3DSettingsSchema } from '@gonasi/schemas/file';

import type { Route } from './+types/configure-model';

import { createClient } from '~/lib/supabase/supabase.server';

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  const fileId = formData.get('fileId') as string;
  const settingsJson = formData.get('settings') as string;

  try {
    const settings = Model3DSettingsSchema.parse(JSON.parse(settingsJson));

    const result = await updateFileSettings(supabase, {
      fileId,
      settings,
    });

    return result;
  } catch (error) {
    console.error('[configure-model] Validation error:', error);
    return {
      success: false,
      message: 'Invalid settings format',
    };
  }
}
