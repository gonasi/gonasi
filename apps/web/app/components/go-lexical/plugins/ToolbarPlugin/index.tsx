import type { Dispatch, JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $isHeadingNode } from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection';
import { $isTableNode, $isTableSelection } from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE,
  mergeRegister,
} from '@lexical/utils';
import type { LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import {
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  HISTORIC_TAG,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import {
  AlignLeft,
  AlignRight,
  CaseUpper,
  ChevronDown,
  Eraser,
  Highlighter,
  Plus,
  SquareSplitVertical,
  Strikethrough,
  Subscript,
  Superscript,
  Tag,
} from 'lucide-react';

import useModal from '../../hooks/useModal';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../../utils/url';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import { BlockFormatDropDown } from './BlockFormatDropdown';
import { ElementFormatDropdown } from './ElementFormatDropdown';
import { FontDropDown } from './FontDropDown';
import FontSize, { parseFontSizeForToolbar } from './fontSize';
import { blockTypeToBlockName, useToolbarState } from './ToolbarContext';
import { clearFormatting } from './utils';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

function Divider(): JSX.Element {
  return <div className='divider' />;
}

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

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
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState('blockType', type as keyof typeof blockTypeToBlockName);
      }
    },
    [updateToolbarState],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains('image-caption-container'),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();

          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
        }
      }

      // Handle buttons
      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(selection, 'background-color', '#fff'),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState('isStrikethrough', selection.hasFormat('strikethrough'));
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(selectedNode, ListNode);
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);

          // Update elementFormat for node selection (e.g., images)
          if ($isElementNode(selectedElement)) {
            updateToolbarState('elementFormat', selectedElement.getFormatType());
          }
        }
      }
    }
  }, [activeEditor, editor, updateToolbarState, $handleHeadingNode]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      $updateToolbar();
    });
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistoryStack?: boolean) => {
      activeEditor.update(
        () => {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? { tag: HISTORIC_TAG } : {},
      );
    },
    [activeEditor],
  );

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
    <div className='toolbar'>
      <button
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
        type='button'
        className='toolbar-item spaced'
        aria-label='Undo'
      >
        <i className='format undo' />
      </button>
      <button
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
        type='button'
        className='toolbar-item'
        aria-label='Redo'
      >
        <i className='format redo' />
      </button>
      <Divider />
      {toolbarState.blockType in blockTypeToBlockName && activeEditor === editor && (
        <>
          <BlockFormatDropDown
            disabled={!isEditable}
            blockType={toolbarState.blockType}
            editor={activeEditor}
          />
          <Divider />
        </>
      )}

      <>
        <FontDropDown
          disabled={!isEditable}
          style='font-family'
          value={toolbarState.fontFamily}
          editor={activeEditor}
        />
        <Divider />
        <FontSize
          selectionFontSize={parseFontSizeForToolbar(toolbarState.fontSize).slice(0, -2)}
          editor={activeEditor}
          disabled={!isEditable}
        />
        <Divider />
        <button
          disabled={!isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={`toolbar-item spaced ${toolbarState.isBold ? 'active' : ''}`}
          title={`Bold (${SHORTCUTS.BOLD})`}
          type='button'
          aria-label={`Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`}
        >
          <i className='format bold' />
        </button>
        <button
          disabled={!isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={`toolbar-item spaced ${toolbarState.isItalic ? 'active' : ''}`}
          title={`Italic (${SHORTCUTS.ITALIC})`}
          type='button'
          aria-label={`Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`}
        >
          <i className='format italic' />
        </button>
        <button
          disabled={!isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={`toolbar-item spaced ${toolbarState.isUnderline ? 'active' : ''}`}
          title={`Underline (${SHORTCUTS.UNDERLINE})`}
          type='button'
          aria-label={`Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`}
        >
          <i className='format underline' />
        </button>
        {canViewerSeeInsertCodeButton && (
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }}
            className={`toolbar-item spaced ${toolbarState.isCode ? 'active' : ''}`}
            title={`Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`}
            type='button'
            aria-label='Insert code block'
          >
            <i className='format code' />
          </button>
        )}
        <button
          disabled={!isEditable}
          onClick={insertLink}
          className={`toolbar-item spaced ${toolbarState.isLink ? 'active' : ''}`}
          aria-label='Insert link'
          title={`Insert link (${SHORTCUTS.INSERT_LINK})`}
          type='button'
        >
          <i className='format link' />
        </button>

        <div className='flex-shrink-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                disabled={!isEditable}
                rightIcon={<ChevronDown />}
                aria-label='Formatting options for additional text styles'
              >
                Aa
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className=''>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase');
                  }}
                  active={toolbarState.isLowercase}
                >
                  <AlignLeft className={cn({ 'text-primary': toolbarState.isLowercase })} />{' '}
                  Lowercase
                  <DropdownMenuShortcut active={toolbarState.isLowercase}>
                    {SHORTCUTS.LOWERCASE}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase');
                  }}
                  active={toolbarState.isUppercase}
                >
                  <AlignRight className={cn({ 'text-primary': toolbarState.isUppercase })} />{' '}
                  Uppercase
                  <DropdownMenuShortcut active={toolbarState.isUppercase}>
                    {SHORTCUTS.UPPERCASE}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize');
                  }}
                  active={toolbarState.isCapitalize}
                >
                  <CaseUpper className={cn({ 'text-primary': toolbarState.isCapitalize })} />{' '}
                  Capitalize
                  <DropdownMenuShortcut active={toolbarState.isCapitalize}>
                    {SHORTCUTS.CAPITALIZE}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                  }}
                  active={toolbarState.isStrikethrough}
                >
                  <Strikethrough className={cn({ 'text-primary': toolbarState.isStrikethrough })} />{' '}
                  Strikethrough
                  <DropdownMenuShortcut active={toolbarState.isStrikethrough}>
                    {SHORTCUTS.STRIKETHROUGH}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
                  }}
                  active={toolbarState.isSubscript}
                >
                  <Subscript className={cn({ 'text-primary': toolbarState.isSubscript })} />{' '}
                  Subscript
                  <DropdownMenuShortcut active={toolbarState.isSubscript}>
                    {SHORTCUTS.SUBSCRIPT}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
                  }}
                  active={toolbarState.isSuperscript}
                >
                  <Superscript className={cn({ 'text-primary': toolbarState.isSuperscript })} />{' '}
                  Superscript
                  <DropdownMenuShortcut active={toolbarState.isSuperscript}>
                    {SHORTCUTS.SUPERSCRIPT}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
                  }}
                  active={toolbarState.isHighlight}
                >
                  <Highlighter className={cn({ 'text-primary': toolbarState.isHighlight })} />{' '}
                  Highlight
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => clearFormatting(activeEditor)}>
                  <Eraser className='text-muted-foreground' /> Clear Formatting
                  <DropdownMenuShortcut>{SHORTCUTS.CLEAR_FORMATTING}</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {canViewerSeeInsertDropdown && (
          <>
            <div className='flex-shrink-0'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={!isEditable}
                    leftIcon={<Plus />}
                    rightIcon={<ChevronDown />}
                    aria-label='Insert specialized editor node'
                  >
                    Insert
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className=''>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
                      }}
                      active={toolbarState.isLowercase}
                    >
                      <Tag />
                      Tag
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
                      }}
                      active={toolbarState.isLowercase}
                    >
                      <SquareSplitVertical />
                      Horizontal Rule
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </>

      <Divider />
      <ElementFormatDropdown
        disabled={!isEditable}
        value={toolbarState.elementFormat}
        editor={activeEditor}
      />

      {modal}
    </div>
  );
}
