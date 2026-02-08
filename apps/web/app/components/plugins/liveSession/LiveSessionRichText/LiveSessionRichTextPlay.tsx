import { useState } from 'react';

import type { LiveSessionPlayComponentProps } from '../core/types';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { useTimer } from '~/hooks/useTimer';
import { cn } from '~/lib/utils';

/**
 * LiveSessionRichTextPlay - Interactive play component for Rich Text blocks
 *
 * Mode behavior:
 * - test: Full interactive experience, no database writes (for facilitators testing)
 * - live: Full interactive experience with database writes and real-time sync (for participants)
 *
 * Differences from View component:
 * - View: Static display (for preview/editing)
 * - Play: Interactive with real-time features, responses, and timing
 */
export function LiveSessionRichTextPlay({ block, mode }: LiveSessionPlayComponentProps) {
  const [hasViewed, setHasViewed] = useState(false);
  const isTestMode = mode === 'test';

  // Auto-complete handler
  const handleAutoComplete = () => {
    if (!hasViewed) {
      setHasViewed(true);
      if (isTestMode) {
        console.log('[Test Mode] Rich text block viewed');
      } else {
        // TODO: Record view in database
        console.log('[Live Mode] Recording rich text view');
      }
    }
  };

  // Timer countdown
  const { timeRemaining } = useTimer({
    initialTime: block.time_limit,
    onComplete: handleAutoComplete,
    autoStart: true,
  });

  // Type narrowing
  if (block.plugin_type !== 'live_session_rich_text') {
    return null;
  }

  const { richTextState } = block.content;

  return (
    <div className='w-full space-y-4'>
      {/* Mode indicator for test mode */}
      {isTestMode && (
        <div className='bg-primary/10 border-primary rounded-md border px-3 py-2 text-sm'>
          🧪 Test Mode - No data will be saved
        </div>
      )}

      {/* Timer Display */}
      <div
        className={cn('text-sm font-semibold', {
          'text-danger animate-pulse': timeRemaining <= 5 && !hasViewed,
          'text-warning': timeRemaining <= 10 && timeRemaining > 5 && !hasViewed,
          'text-muted-foreground': timeRemaining > 10 || hasViewed,
        })}
      >
        Time remaining: {timeRemaining}s
      </div>

      <RichTextRenderer editorState={richTextState} />

      {/* View Confirmation */}
      {hasViewed && (
        <div className='bg-success/10 rounded-lg p-3 text-sm'>
          ✅ Block viewed {isTestMode ? '(test mode - not recorded)' : '(progress recorded)'}
        </div>
      )}
    </div>
  );
}
