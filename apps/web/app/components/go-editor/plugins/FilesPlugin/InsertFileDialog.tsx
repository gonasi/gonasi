import { type JSX, useEffect, useRef } from 'react';
import type { LexicalEditor } from 'lexical';

import { InsertFileDialogBody } from './InsertFileDialogBody';
import { INSERT_FILE_COMMAND, type InsertFilePayload } from '.';

export default function InsertFileDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const handleFileInsert = (payload: InsertFilePayload) => {
    activeEditor.dispatchCommand(INSERT_FILE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      <InsertFileDialogBody handleFileInsert={handleFileInsert} />
    </>
  );
}
