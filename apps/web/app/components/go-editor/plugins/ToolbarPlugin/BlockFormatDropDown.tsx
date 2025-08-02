import type { JSX } from 'react';
import type { LexicalEditor } from 'lexical';
import { ChevronDown } from 'lucide-react';

import { blockTypeToBlockName, blockTypeToIconComponent } from '../../context/ToolbarContext';
import { BlockTypeDropdownItem } from '../../ui/BlockTypeDropdownItem';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import {
  formatBulletList,
  formatCheckList,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface BlockFormatDropDownProps {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled?: boolean;
}

export function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: BlockFormatDropDownProps): JSX.Element {
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
