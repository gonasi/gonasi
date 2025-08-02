import type { JSX } from 'react';
import type { ElementFormatType, LexicalEditor } from 'lexical';
import { FORMAT_ELEMENT_COMMAND, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  IndentIncrease,
  Type,
} from 'lucide-react';

import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';

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

interface ElementFormatDropdownProps {
  editor: LexicalEditor;
  value: ElementFormatType;
  disabled: boolean;
}

export function ElementFormatDropdown({
  editor,
  value,
  disabled = false,
}: ElementFormatDropdownProps): JSX.Element {
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
