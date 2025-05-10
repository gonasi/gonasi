import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { getSettingsSchemaByType } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

export const fetchBlockSettingsByBlockId = async (
  supabase: TypedSupabaseClient,
  blockId: string,
) => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('id, plugin_type, settings, weight')
      .eq('id', blockId)
      .single();

    if (error) {
      return {
        success: false,
        message: 'Unable to fetch block settings.',
        data: null,
      };
    }

    const settingsSchema = getSettingsSchemaByType(data.plugin_type as PluginTypeId);
    const parsedSettings = settingsSchema.safeParse(data.settings);

    if (!parsedSettings.success) {
      return {
        success: false,
        message: 'Wrong settings schema.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Block settings retrieved successfully.',
      data: {
        ...data,
        plugin_type: data.plugin_type as PluginTypeId,
        settings: parsedSettings.data,
      },
    };
  } catch (err) {
    console.error('Error in fetchBlockSettingsByBlockId:', err);
    return {
      success: false,
      message: 'Unexpected error while fetching block settings.',
      data: null,
    };
  }
};
