import { BuilderSchema } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

export const fetchSingleBlockByBlockId = async (supabase: TypedSupabaseClient, blockId: string) => {
  try {
    const { data, error } = await supabase
      .from('lesson_blocks')
      .select(
        'id, organization_id, course_id, chapter_id, lesson_id, plugin_type, content, settings',
      )
      .eq('id', blockId)
      .single();

    if (error || !data) {
      console.error('Could not get block:', error);
      return {
        success: false,
        message: 'Couldn’t load that block.',
        data: null,
      };
    }

    const parsed = BuilderSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Block validation failed:', parsed.error.flatten());
      return {
        success: false,
        message: 'Block data was malformed or unsupported.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Got the block!',
      data: parsed.data,
    };
  } catch (err) {
    console.error('Error grabbing block:', err);
    return {
      success: false,
      message: 'Something went wrong while loading the block.',
      data: null,
    };
  }
};
