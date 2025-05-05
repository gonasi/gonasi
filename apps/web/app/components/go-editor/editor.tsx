import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { useSettings } from './context/SettingsContext';
import { useSharedHistoryContext } from './context/SharedHistoryContext';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import MatchConceptsPlugin from './plugins/GoMenuPlugin/DragAndDropPlugins/MatchConcepts';
import TrueOrFalsePlugin from './plugins/GoMenuPlugin/QuizPlugins/TrueOrFalsePlugin';
import TapToRevealPlugin from './plugins/GoMenuPlugin/RevealPlugins/TapToRevealPlugin';
// import ActionsPlugin from './plugins/ActionsPlugin';
// import AutocompletePlugin from './plugins/AutocompletePlugin';
// import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
// import AutoLinkPlugin from './plugins/AutoLinkPlugin';
// import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
// import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
// import CollapsiblePlugin from './plugins/CollapsiblePlugin';
// import CommentPlugin from './plugins/CommentPlugin';
// import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
// import ContextMenuPlugin from './plugins/ContextMenuPlugin';
// import DragDropPaste from './plugins/DragDropPastePlugin';
// import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
// import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
// import EmojisPlugin from './plugins/EmojisPlugin';
// import EquationsPlugin from './plugins/EquationsPlugin';
// import ExcalidrawPlugin from './plugins/ExcalidrawPlugin';
// import FigmaPlugin from './plugins/FigmaPlugin';
// import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
// import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import { ListPlugin } from './plugins/LexicalListPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
// import InlineImagePlugin from './plugins/InlineImagePlugin';
// import KeywordsPlugin from './plugins/KeywordsPlugin';
// import { LayoutPlugin } from './plugins/LayoutPlugin/LayoutPlugin';
// import LinkPlugin from './plugins/LinkPlugin';
// import MarkdownShortcutPlugin from './plugins/MarkdownShortcutPlugin';
// import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
// import MentionsPlugin from './plugins/MentionsPlugin';
// import PageBreakPlugin from './plugins/PageBreakPlugin';
// import PollPlugin from './plugins/PollPlugin';
// import ShortcutsPlugin from './plugins/ShortcutsPlugin';
// import SpecialTextPlugin from './plugins/SpecialTextPlugin';
// import SpeechToTextPlugin from './plugins/SpeechToTextPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ContentEditable from './ui/ContentEditable';

import { CAN_USE_DOM } from '~/components/go-editor/utils/canUseDOM';
import { cn } from '~/lib/utils';
// import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
// import TableCellResizer from './plugins/TableCellResizer';
// import TableHoverActionsPlugin from './plugins/TableHoverActionsPlugin';
// import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
// import ToolbarPlugin from './plugins/';
// import TreeViewPlugin from './plugins/TreeViewPlugin';
// import TwitterPlugin from './plugins/TwitterPlugin';
// import YouTubePlugin from './plugins/YouTubePlugin';
// import ContentEditable from './ui/ContentEditable';

interface Props {
  readOnly?: boolean;
  showGoPlugins?: boolean;
  placeholder?: string;
}

export default function Editor({
  readOnly,
  showGoPlugins,
  placeholder = 'Enter text',
}: Props): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      // hasLinkAttributes,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      // showTableOfContents,
      // shouldUseLexicalContextMenu,
      // shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      // shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
    },
  } = useSettings();
  // const isEditable = useLexicalEditable();

  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [, setIsLinkEditMode] = useState<boolean>(false);

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
      {isRichText && !readOnly && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
          showGoPlugins={showGoPlugins}
        />
      )}
      {isRichText && !readOnly && (
        <ShortcutsPlugin editor={activeEditor} setIsLinkEditMode={setIsLinkEditMode} />
      )}
      <div
        className={`editor-container ${showTreeView ? 'tree-view' : ''} ${
          !isRichText ? 'plain-text' : ''
        }`}
      >
        {isMaxLength && !readOnly && <MaxLengthPlugin maxLength={30} />}
        {!readOnly && (
          <>
            <DragDropPaste />
            <AutoFocusPlugin />
          </>
        )}

        {selectionAlwaysOnDisplay && !readOnly && <SelectionAlwaysOnDisplay />}
        {!readOnly && <ClearEditorPlugin />}
        {/* <ComponentPickerPlugin /> */}
        {/* <EmojiPickerPlugin /> */}
        {/* <AutoEmbedPlugin /> */}
        {/* <MentionsPlugin /> */}
        {/* <EmojisPlugin /> */}
        {/* <HashtagPlugin /> */}
        {/* <KeywordsPlugin /> */}
        {/* <SpeechToTextPlugin /> */}
        {/* <AutoLinkPlugin /> */}
        {/* <CommentPlugin providerFactory={isCollab ? createWebsocketProvider : undefined} /> */}
        {isRichText ? (
          <>
            {isCollab && !readOnly ? (
              // <CollaborationPlugin
              //   id='main'
              //   providerFactory={createWebsocketProvider}
              //   shouldBootstrap={!skipCollaborationInit}
              // />
              <h2>collab</h2>
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}

            <RichTextPlugin
              contentEditable={
                <div
                  className={cn('editor-scroller mx-auto max-w-xl', {
                    'min-h-20 rounded-lg py-2': !readOnly,
                  })}
                >
                  <div
                    className={cn('editor', {
                      'min-h-fit pb-[500px]': showGoPlugins,
                    })}
                    ref={onRef}
                  >
                    <ContentEditable placeholder={placeholder} readOnly={readOnly} />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <TrueOrFalsePlugin />
            <TapToRevealPlugin />
            <MatchConceptsPlugin />
            {/* <MarkdownShortcutPlugin /> */}
            {/* <CodeHighlightPlugin /> */}
            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
              hasHorizontalScroll={tableHorizontalScroll}
            />
            {/* <TableCellResizer /> */}
            <ImagesPlugin />
            {/* <InlineImagePlugin /> */}
            {/* <LinkPlugin hasLinkAttributes={hasLinkAttributes} /> */}
            {/* <PollPlugin /> */}
            {/* <TwitterPlugin /> */}
            {/* <YouTubePlugin /> */}
            {/* <FigmaPlugin /> */}
            {/* <ClickableLinkPlugin disabled={isEditable} /> */}
            {/* <HorizontalRulePlugin /> */}
            {/* <EquationsPlugin /> */}
            {/* <ExcalidrawPlugin /> */}
            <TabFocusPlugin />
            {/* <TabIndentationPlugin maxIndent={7} /> */}
            {/* <CollapsiblePlugin /> */}
            <PageBreakPlugin />
            {/* <LayoutPlugin /> */}
            {floatingAnchorElem && (
              <>
                {/* <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                /> */}
                {/* <TableCellActionMenuPlugin anchorElem={floatingAnchorElem} cellMerge /> */}
              </>
            )}
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                {/* <DraggableBlockPlugin anchorElem={floatingAnchorElem} /> */}
                {/* <CodeActionMenuPlugin anchorElem={floatingAnchorElem} /> */}
                {/* <TableHoverActionsPlugin anchorElem={floatingAnchorElem} /> */}
                {/* <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                /> */}
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable placeholder={placeholder} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin charset={isCharLimit ? 'UTF-16' : 'UTF-8'} maxLength={5} />
        )}
        {isAutocomplete && <AutocompletePlugin />}
        {/* <div>{showTableOfContents && <TableOfContentsPlugin />}</div> */}
        {/* {shouldUseLexicalContextMenu && <ContextMenuPlugin />} */}
        {/* {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />} */}
        {/* <ActionsPlugin
          isRichText={isRichText}
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
        /> */}
      </div>
      {showTreeView && !readOnly && <TreeViewPlugin />}
    </>
  );
}
