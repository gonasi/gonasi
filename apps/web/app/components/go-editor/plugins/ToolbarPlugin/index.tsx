import type { Dispatch, JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import type { LexicalEditor } from 'lexical';
import { FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from 'lexical';
import { Bold, Code, Italic, Link, Redo, Underline, Undo } from 'lucide-react';

import { blockTypeToBlockName, useToolbarState } from '../../context/ToolbarContext';
import { IconTooltipButton } from '../../ui/IconTooltipButton';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import { BlockFormatDropDown } from './BlockFormatDropDown';
import { ElementFormatDropdown } from './ElementFormatDropdown';
import { FontDropDown } from './FontDropDown';
import FontSize from './fontSize';
import { InsertDropdown } from './InsertDropdown';
import { TextStyleDropdown } from './TextStyleDropdown';
import { useToolbarUpdates } from './useToolbarUpdates';

import { IS_APPLE } from '~/components/go-editor/utils/environment';
import { sanitizeUrl } from '~/components/go-editor/utils/url';
import { cn } from '~/lib/utils';

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element {
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();

  // Use the custom hook for toolbar updates
  useToolbarUpdates({
    editor,
    activeEditor,
    setActiveEditor,
    updateToolbarState,
  });

  // Handle editor editable state
  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable);
    });
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'));
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  return (
    <div className={cn('toolbar')}>
      {canViewerSeeInsertDropdown && (
        <InsertDropdown
          activeEditor={activeEditor}
          isEditable={isEditable}
          toolbarState={toolbarState}
        />
      )}

      <IconTooltipButton
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
        type='button'
        aria-label='Undo'
        icon={Undo}
      />
      <IconTooltipButton
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
        type='button'
        className='toolbar-item'
        aria-label='Redo'
        icon={Redo}
      />

      {toolbarState.blockType in blockTypeToBlockName && activeEditor === editor && (
        <BlockFormatDropDown
          disabled={!isEditable}
          blockType={toolbarState.blockType}
          editor={activeEditor}
        />
      )}

      <FontDropDown
        disabled={!isEditable}
        style='font-family'
        value={toolbarState.fontFamily}
        editor={activeEditor}
      />

      <FontSize
        selectionFontSize={toolbarState.fontSize.slice(0, -2)}
        editor={activeEditor}
        disabled={!isEditable}
      />

      <IconTooltipButton
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        active={toolbarState.isBold}
        title={`Bold (${SHORTCUTS.BOLD})`}
        type='button'
        aria-label={`Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`}
        icon={Bold}
      />

      <IconTooltipButton
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        active={toolbarState.isItalic}
        title={`Italic (${SHORTCUTS.ITALIC})`}
        type='button'
        aria-label={`Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`}
        icon={Italic}
      />
      <IconTooltipButton
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        active={toolbarState.isUnderline}
        title={`Underline (${SHORTCUTS.UNDERLINE})`}
        type='button'
        aria-label={`Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`}
        icon={Underline}
      />
      {canViewerSeeInsertCodeButton && (
        <IconTooltipButton
          disabled={!isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          }}
          active={toolbarState.isCode}
          title={`Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`}
          type='button'
          aria-label='Insert code block'
          icon={Code}
        />
      )}
      <IconTooltipButton
        disabled={!isEditable}
        onClick={insertLink}
        active={toolbarState.isLink}
        aria-label='Insert link'
        title={`Insert link (${SHORTCUTS.INSERT_LINK})`}
        type='button'
        icon={Link}
      />

      <TextStyleDropdown
        activeEditor={activeEditor}
        isEditable={isEditable}
        toolbarState={toolbarState}
      />

      <ElementFormatDropdown
        disabled={!isEditable}
        value={toolbarState.elementFormat}
        editor={activeEditor}
      />
    </div>
  );
}
