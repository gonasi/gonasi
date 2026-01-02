import type { JSX } from 'react';
import { useEffect, useState } from 'react';
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
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import AudioPlugin from './plugins/Files/AudioPlugin';
import ImagesPlugin from './plugins/Files/ImagesPlugin';
import Model3DPlugin from './plugins/Files/Model3DPlugin';
import FilesPlugin from './plugins/FilesPlugin';
import { AutoFocusPlugin } from './plugins/LexicalAutoFocusPlugin';
import { ListPlugin } from './plugins/LexicalListPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ContentEditable from './ui/ContentEditable';
import { CAN_USE_DOM } from './utils/canUseDOM';

interface Props {
  placeholder?: string;
  hasError?: boolean;
}

export default function Editor({ placeholder = 'Enter text', hasError }: Props): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const { settings } = useSettings();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false);

  const [editor] = useLexicalComposerContext();

  const [activeEditor, setActiveEditor] = useState(editor);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  return (
    <>
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />

      <ShortcutsPlugin editor={activeEditor} setIsLinkEditMode={setIsLinkEditMode} />

      {settings.isMaxLength && <MaxLengthPlugin maxLength={30} />}
      <AutoFocusPlugin />
      {settings.selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
      <ClearEditorPlugin />
      <HistoryPlugin externalHistoryState={historyState} />
      <RichTextPlugin
        contentEditable={
          <div ref={onRef} className='relative mx-auto max-w-xl'>
            <ContentEditable placeholder={placeholder} hasError={hasError} />
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />

      <FilesPlugin />
      <AudioPlugin />
      <ImagesPlugin />
      <Model3DPlugin />
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

      {settings.showTreeView && <TreeViewPlugin />}
      {floatingAnchorElem && !isSmallWidthViewport && (
        <>
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        </>
      )}
    </>
  );
}
