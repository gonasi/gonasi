import type { Dispatch, JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { $isCodeNode, CODE_LANGUAGE_MAP } from '@lexical/code';
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
  mergeRegister,
} from '@lexical/utils';
import type { ElementFormatType, LexicalEditor, NodeKey } from 'lexical';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CaseUpper,
  ChevronDown,
  Code,
  Eraser,
  Highlighter,
  IndentIncrease,
  Italic,
  Link,
  Plus,
  Redo,
  SquareSplitVertical,
  Strikethrough,
  Subscript,
  Superscript,
  Tag,
  Type,
  Underline,
  Undo,
} from 'lucide-react';

import {
  blockTypeToBlockName,
  blockTypeToIconComponent,
  useToolbarState,
} from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
import { BlockTypeDropdownItem } from '../../ui/BlockTypeDropdownItem';
import { IconTooltipButton } from '../../ui/IconTooltipButton';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import FontSize from './fontSize';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';

import { IS_APPLE } from '~/components/go-editor/utils/environment';
import { getSelectedNode } from '~/components/go-editor/utils/getSelectedNode';
import { sanitizeUrl } from '~/components/go-editor/utils/url';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align',
  },
};

function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  const Icon = blockTypeToIconComponent[blockType];

  return (
    <div className='flex-shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            disabled={disabled}
            leftIcon={Icon ? <Icon className='text-muted-foreground h-4 w-4' /> : null}
            rightIcon={<ChevronDown />}
          >
            {blockTypeToBlockName[blockType]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <BlockTypeDropdownItem
              blockType='paragraph'
              onClick={() => formatParagraph(editor)}
              shortcut={SHORTCUTS.NORMAL}
              label='Normal'
              active={blockType === 'paragraph'}
            />
            <BlockTypeDropdownItem
              blockType='h1'
              onClick={() => formatHeading(editor, blockType, 'h1')}
              shortcut={SHORTCUTS.HEADING1}
              label='Heading 1'
              active={blockType === 'h1'}
            />
            <BlockTypeDropdownItem
              blockType='h2'
              onClick={() => formatHeading(editor, blockType, 'h2')}
              shortcut={SHORTCUTS.HEADING2}
              label='Heading 2'
              active={blockType === 'h2'}
            />
            <BlockTypeDropdownItem
              blockType='h3'
              onClick={() => formatHeading(editor, blockType, 'h3')}
              shortcut={SHORTCUTS.HEADING3}
              label='Heading 3'
              active={blockType === 'h3'}
            />
            <BlockTypeDropdownItem
              blockType='bullet'
              onClick={() => formatBulletList(editor, blockType)}
              shortcut={SHORTCUTS.BULLET_LIST}
              label='Bullet list'
              active={blockType === 'bullet'}
            />
            <BlockTypeDropdownItem
              blockType='number'
              onClick={() => formatNumberedList(editor, blockType)}
              shortcut={SHORTCUTS.NUMBERED_LIST}
              label='Number list'
              active={blockType === 'number'}
            />
            <BlockTypeDropdownItem
              blockType='check'
              onClick={() => formatCheckList(editor, blockType)}
              shortcut={SHORTCUTS.CHECK_LIST}
              label='Check list'
              active={blockType === 'check'}
            />
            <BlockTypeDropdownItem
              blockType='quote'
              onClick={() => formatQuote(editor, blockType)}
              shortcut={SHORTCUTS.QUOTE}
              label='Quote'
              active={blockType === 'quote'}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family'
      ? 'Formatting options for font family'
      : 'Formatting options for font size';

  return (
    <div className='flex-shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            disabled={disabled}
            leftIcon={<Type />}
            rightIcon={<ChevronDown />}
            aria-label={buttonAriaLabel}
          >
            {value}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className=''>
          <DropdownMenuGroup>
            {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
              ([option, text]) => (
                <DropdownMenuItem
                  active={value === option}
                  onClick={() => handleClick(option)}
                  key={option}
                >
                  {text}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ElementFormatDropdown({
  editor,
  value,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <div className='flex-shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            disabled={disabled}
            leftIcon={<Type />}
            rightIcon={<ChevronDown />}
            aria-label='Formatting options for text alignment'
          >
            {formatOption.name}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className=''>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
              }}
            >
              <AlignLeft /> Left Align
              <DropdownMenuShortcut>{SHORTCUTS.LEFT_ALIGN}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
              }}
            >
              <AlignCenter /> Center Align
              <DropdownMenuShortcut>{SHORTCUTS.CENTER_ALIGN}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
              }}
            >
              <AlignRight /> Right Align
              <DropdownMenuShortcut>{SHORTCUTS.RIGHT_ALIGN}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
              }}
            >
              <AlignJustify /> Justify Align
              <DropdownMenuShortcut>{SHORTCUTS.JUSTIFY_ALIGN}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
              }}
            >
              <AlignLeft /> Start Align
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
              }}
            >
              <AlignRight /> End Align
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              }}
            >
              <IndentIncrease /> Outdent
              <DropdownMenuShortcut>{SHORTCUTS.OUTDENT}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
              }}
            >
              <IndentIncrease /> Indent
              <DropdownMenuShortcut>{SHORTCUTS.INDENT}</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [modal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();

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
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

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
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            updateToolbarState('blockType', type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            updateToolbarState(
              'codeLanguage',
              language ? CODE_LANGUAGE_MAP[language] || language : '',
            );
            return;
          }
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
  }, [activeEditor, editor, updateToolbarState]);

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
        <>
          <BlockFormatDropDown
            disabled={!isEditable}
            blockType={toolbarState.blockType}
            // rootType={toolbarState.rootType}
            editor={activeEditor}
          />
          <Separator orientation='vertical' />
        </>
      )}

      <>
        <FontDropDown
          disabled={!isEditable}
          style='font-family'
          value={toolbarState.fontFamily}
          editor={activeEditor}
        />
        <Separator orientation='vertical' />
        <FontSize
          selectionFontSize={toolbarState.fontSize.slice(0, -2)}
          editor={activeEditor}
          disabled={!isEditable}
        />
        <Separator orientation='vertical' />
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
            <Separator orientation='vertical' />
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

      <Separator orientation='vertical' />
      <ElementFormatDropdown
        disabled={!isEditable}
        value={toolbarState.elementFormat}
        editor={activeEditor}
      />
      {modal}
    </div>
  );
}
