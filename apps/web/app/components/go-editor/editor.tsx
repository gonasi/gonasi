import type { JSX } from 'react';
import { useState } from 'react';
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
import FilesPlugin from './plugins/FilesPlugin';
import { ListPlugin } from './plugins/LexicalListPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ContentEditable from './ui/ContentEditable';

import { cn } from '~/lib/utils';

interface Props {
  placeholder?: string;
  hasError?: boolean;
}

export default function Editor({ placeholder = 'Enter text', hasError }: Props): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const { settings } = useSettings();
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

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
                <ContentEditable placeholder={placeholder} hasError={hasError} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <FilesPlugin />
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
