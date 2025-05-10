import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { useSettings } from './context/SettingsContext';
import { useSharedHistoryContext } from './context/SharedHistoryContext';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import { ListPlugin } from './plugins/LexicalListPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ContentEditable from './ui/ContentEditable';

import { CAN_USE_DOM } from '~/components/go-editor/utils/canUseDOM';
import { cn } from '~/lib/utils';

interface Props {
  placeholder?: string;
}

export default function Editor({ placeholder = 'Enter text' }: Props): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const { settings } = useSettings();
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState(false);

  useEffect(() => {
    const updateViewportWidth = () => {
      if (!CAN_USE_DOM) return;
      const isSmall = window.matchMedia('(max-width: 1025px)').matches;
      setIsSmallWidthViewport(isSmall);
    };
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  return (
    <>
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={() => {}}
      />
      <ShortcutsPlugin editor={activeEditor} setIsLinkEditMode={() => {}} />
      <div className={cn('editor-container', settings.showTreeView && 'tree-view')}>
        {settings.isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <AutoFocusPlugin />
        {settings.selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
        <ClearEditorPlugin />
        <HistoryPlugin externalHistoryState={historyState} />
        <RichTextPlugin
          contentEditable={
            <div className='editor-scroller mx-auto max-w-xl'>
              <div className='editor'>
                <ContentEditable placeholder={placeholder} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <CheckListPlugin />
        <TablePlugin
          hasCellMerge={settings.tableCellMerge}
          hasCellBackgroundColor={settings.tableCellBackgroundColor}
          hasHorizontalScroll={settings.tableHorizontalScroll}
        />
        <TabFocusPlugin />
        {(settings.isCharLimit || settings.isCharLimitUtf8) && (
          <CharacterLimitPlugin charset={settings.isCharLimit ? 'UTF-16' : 'UTF-8'} maxLength={5} />
        )}
        {settings.isAutocomplete && <AutocompletePlugin />}
      </div>
      {settings.showTreeView && <TreeViewPlugin />}
    </>
  );
}
