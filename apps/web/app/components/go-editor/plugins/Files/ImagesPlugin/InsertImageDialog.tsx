import { type JSX, useEffect, useRef } from 'react';
import type { LexicalEditor } from 'lexical';

import { FileType } from '@gonasi/schemas/file';

import { InsertFileDialog } from '../InsertFileDialog';
import { INSERT_IMAGE_COMMAND, type InsertImagePayload } from '.';

export default function InsertImageDialog({
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

  const handleFileInsert = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      <InsertFileDialog handleFileInsert={handleFileInsert} fileType={FileType.IMAGE} />
    </>
  );
}
