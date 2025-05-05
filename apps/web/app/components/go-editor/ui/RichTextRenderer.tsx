import { Suspense } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

import { GonasiRichTextRendererNodes } from '../nodes/GonasiNodes';
import PlaygroundEditorTheme from '../themes/PlaygroundEditorTheme';
import type { INITIAL_CONFIG } from '../types';

import { buildImportMap } from '~/components/go-editor';
import { Spinner } from '~/components/loaders';

interface RichTextRendererProps {
  editorState: string | null;
}

export default function RichTextRenderer({ editorState }: RichTextRendererProps) {
  const initialConfig: INITIAL_CONFIG = {
    namespace: 'rich-text-renderer',
    theme: PlaygroundEditorTheme,
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    nodes: [...GonasiRichTextRendererNodes],
    editorState,
    html: { import: buildImportMap() },
    editable: false,
  };

  return (
    <Suspense fallback={<Spinner />}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className='-mt-2 h-fit w-full'>
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
