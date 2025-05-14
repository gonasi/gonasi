import { Suspense, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

import { GonasiRichTextRendererNodes } from '../nodes/GonasiNodes';
import PlaygroundEditorTheme from '../themes/PlaygroundEditorTheme';
import type { INITIAL_CONFIG } from '../types';

import { buildImportMap } from '~/components/go-editor';
import { Spinner } from '~/components/loaders';
import { cn } from '~/lib/utils';

interface RichTextRendererProps {
  editorState: string | null;
  className?: string;
}

// Handles re-applying editor state when it changes
function EditorStateUpdater({ editorState }: { editorState: string | null }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editorState) return;

    editor.update(() => {
      const parsed = editor.parseEditorState(editorState);
      editor.setEditorState(parsed);
    });
  }, [editorState, editor]);

  return null;
}

export default function RichTextRenderer({ editorState, className }: RichTextRendererProps) {
  const initialConfig: INITIAL_CONFIG = {
    namespace: 'rich-text-renderer',
    theme: PlaygroundEditorTheme,
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    nodes: [...GonasiRichTextRendererNodes],
    editorState, // used on first mount
    html: { import: buildImportMap() },
    editable: false,
  };

  return (
    <Suspense fallback={<Spinner />}>
      <LexicalComposer initialConfig={initialConfig}>
        <EditorStateUpdater editorState={editorState} />
        <div className={cn('h-fit w-full', className)}>
          <div className='editor-inner'>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className='editor-input'
                  aria-placeholder='placeholder'
                  placeholder={<div className='editor-placeholder'>placeholder</div>}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
      </LexicalComposer>
    </Suspense>
  );
}
