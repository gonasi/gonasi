import { type JSX, useEffect, useRef } from 'react';
import type { LexicalEditor } from 'lexical';

import { INSERT_IMAGE_COMMAND, type InsertImagePayload, InsertImageUploadedDialogBody } from '.';

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

  const handleImageInsert = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      <InsertImageUploadedDialogBody handleImageInsert={handleImageInsert} />
    </>
  );
}
