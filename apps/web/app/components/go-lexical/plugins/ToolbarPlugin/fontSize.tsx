import * as React from 'react';
import type { LexicalEditor } from 'lexical';

import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import { MAX_ALLOWED_FONT_SIZE, MIN_ALLOWED_FONT_SIZE } from './ToolbarContext';
import { updateFontSize, updateFontSizeInSelection, UpdateFontSizeType } from './utils';

import { cn } from '~/lib/utils'; // Adjust import based on your setup

function parseFontSize(input: string): [number, string] | null {
  const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
  if (!match || match[1] === undefined || match[2] === undefined) {
    return null;
  }

  return [Number(match[1]), match[2]];
}

function normalizeToPx(fontSize: number, unit: string): number {
  return unit === 'pt' ? Math.round((fontSize * 4) / 3) : fontSize;
}

function isValidFontSize(fontSizePx: number): boolean {
  return fontSizePx >= MIN_ALLOWED_FONT_SIZE && fontSizePx <= MAX_ALLOWED_FONT_SIZE;
}

export function parseFontSizeForToolbar(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }
  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return `${fontSizePx}px`;
}

export function parseAllowedFontSize(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }
  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return isValidFontSize(fontSizePx) ? input : '';
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = React.useState<string>(selectionFontSize);
  const [inputChangeFlag, setInputChangeFlag] = React.useState<boolean>(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValueNumber = Number(inputValue);

    if (e.key === 'Tab') return;
    if (['e', 'E', '+', '-'].includes(e.key) || isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue('');
      return;
    }
    setInputChangeFlag(true);
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  const handleInputBlur = () => {
    if (inputValue !== '' && inputChangeFlag) {
      const inputValueNumber = Number(inputValue);
      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  const updateFontSizeByInputValue = (inputValueNumber: number) => {
    let updatedFontSize = inputValueNumber;
    if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
      updatedFontSize = MAX_ALLOWED_FONT_SIZE;
    } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
      updatedFontSize = MIN_ALLOWED_FONT_SIZE;
    }

    setInputValue(String(updatedFontSize));
    updateFontSizeInSelection(editor, `${String(updatedFontSize)}px`, null);
    setInputChangeFlag(false);
  };

  React.useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  return (
    <>
      <button
        type='button'
        disabled={
          disabled || (selectionFontSize !== '' && Number(inputValue) <= MIN_ALLOWED_FONT_SIZE)
        }
        onClick={() => updateFontSize(editor, UpdateFontSizeType.decrement, inputValue)}
        className={cn('toolbar-item mr-[3px] p-0', disabled ? 'cursor-not-allowed opacity-20' : '')}
        aria-label='Decrease font size'
        title={`Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`}
      >
        <i
          className='format block h-4 w-4 bg-center bg-no-repeat'
          style={{ backgroundImage: "url('/images/icons/minus-sign.svg')" }}
        />
      </button>

      <input
        type='number'
        title='Font size'
        value={inputValue}
        disabled={disabled}
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        className={cn(
          'toolbar-item h-[15px] w-[20px] self-center rounded border border-gray-500 px-1 text-center text-[14px] font-bold text-[#777]',
          disabled ? 'cursor-not-allowed opacity-20' : '',
          'appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
          '[&::-moz-appearance]:textfield',
        )}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleInputBlur}
      />

      <button
        type='button'
        disabled={
          disabled || (selectionFontSize !== '' && Number(inputValue) >= MAX_ALLOWED_FONT_SIZE)
        }
        onClick={() => updateFontSize(editor, UpdateFontSizeType.increment, inputValue)}
        className={cn('toolbar-item ml-[3px] p-0', disabled ? 'cursor-not-allowed opacity-20' : '')}
        aria-label='Increase font size'
        title={`Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`}
      >
        <i
          className='format block h-4 w-4 bg-center bg-no-repeat'
          style={{ backgroundImage: "url('/images/icons/add-sign.svg')" }}
        />
      </button>
    </>
  );
}
