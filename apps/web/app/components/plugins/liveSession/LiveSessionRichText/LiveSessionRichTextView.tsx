import type { LiveSessionViewComponentProps } from '../core/types';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';

export function LiveSessionRichTextView({ block }: LiveSessionViewComponentProps) {
  // Type narrowing: when plugin_type is 'live_session_rich_text',
  // TypeScript knows content has richTextState
  if (block.plugin_type !== 'live_session_rich_text') {
    return null;
  }

  const { richTextState } = block.content;

  return (
    <div className='w-full space-y-4'>
      <RichTextRenderer editorState={richTextState} />
    </div>
  );
}
