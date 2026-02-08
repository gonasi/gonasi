import { ToggleRight } from 'lucide-react';

import { LiveSessionRichTextSchema } from '@gonasi/schemas/liveSessions/schemas/liveRichText';
import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';

import { createLiveSessionPlugin } from '../core/createLiveSessionPlugin';
import { LiveSessionRichTextPlay } from './LiveSessionRichTextPlay';
import { LiveSessionRichTextView } from './LiveSessionRichTextView';

import { DifficultyField } from '~/components/plugins/common/settings/DifficultyField';
import { GoRichTextInputField } from '~/components/ui/forms/elements';

export const LiveSessionRichTextPlugin = createLiveSessionPlugin({
  pluginType: 'live_session_rich_text',

  metadata: {
    name: 'Rich Text Editor',
    description: 'Edit rich text content.',
    icon: ToggleRight,
  },

  schema: LiveSessionRichTextSchema,

  defaults: {
    content: { richTextState: EMPTY_LEXICAL_STATE },
    settings: {},
    difficulty: 'easy',
    time_limit: 10,
  },

  renderFields: () => (
    <>
      <GoRichTextInputField
        name='content.richTextState'
        labelProps={{ children: 'Rich Text', required: true }}
        placeholder='Type your statement here...'
      />
    </>
  ),

  renderSettings: ({ methods }) => {
    const difficulty = methods.getValues('difficulty');

    return (
      <>
        <DifficultyField name='difficulty' watchValue={difficulty} />
      </>
    );
  },

  ViewComponent: LiveSessionRichTextView,
  PlayComponent: LiveSessionRichTextPlay,
});
