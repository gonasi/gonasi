import type { JSX } from 'react';
import type { LexicalEditor } from 'lexical';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import {
  AlignLeft,
  AlignRight,
  CaseUpper,
  ChevronDown,
  Eraser,
  Highlighter,
  Strikethrough,
  Subscript,
  Superscript,
} from 'lucide-react';

import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
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

interface TextStyleDropdownProps {
  activeEditor: LexicalEditor;
  isEditable: boolean;
  toolbarState: {
    isLowercase: boolean;
    isUppercase: boolean;
    isCapitalize: boolean;
    isStrikethrough: boolean;
    isSubscript: boolean;
    isSuperscript: boolean;
    isHighlight: boolean;
  };
}

export function TextStyleDropdown({
  activeEditor,
  isEditable,
  toolbarState,
}: TextStyleDropdownProps): JSX.Element {
  return (
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
              <AlignLeft className={cn({ 'text-primary': toolbarState.isLowercase })} /> Lowercase
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
              <AlignRight className={cn({ 'text-primary': toolbarState.isUppercase })} /> Uppercase
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
              <CaseUpper className={cn({ 'text-primary': toolbarState.isCapitalize })} /> Capitalize
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
              <Subscript className={cn({ 'text-primary': toolbarState.isSubscript })} /> Subscript
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
              <Highlighter className={cn({ 'text-primary': toolbarState.isHighlight })} /> Highlight
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => clearFormatting(activeEditor)}>
              <Eraser className='text-muted-foreground' /> Clear Formatting
              <DropdownMenuShortcut>{SHORTCUTS.CLEAR_FORMATTING}</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
