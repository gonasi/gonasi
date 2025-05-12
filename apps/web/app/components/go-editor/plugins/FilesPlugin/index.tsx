import type React from 'react';
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import type { LexicalCommand } from 'lexical';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';

import type { FilePayload } from '../../nodes/FileNode';
import { $createFileNode, FileNode } from '../../nodes/FileNode';

export type InsertFilePayload = Readonly<FilePayload>;

export const INSERT_FILE_COMMAND: LexicalCommand<InsertFilePayload> =
  createCommand('INSERT_FILE_COMMAND');

export default function FilesPlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilesPlugin: FileNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertFilePayload>(
        INSERT_FILE_COMMAND,
        (payload) => {
          const fileNode = $createFileNode(payload);
          $insertNodes([fileNode]);

          // Wrap in paragraph if at root level
          if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
            $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}

// File Upload Dialog Component
export function InsertFileDialogBody({
  handleFileInsert,
}: {
  handleFileInsert: (payload: InsertFilePayload) => void;
}): React.JSX.Element {
  const [fileId, setFileId] = useState('');

  return (
    <div>
      <input type='text' onChange={(e) => setFileId(e.target.value)} />
      <button onClick={() => handleFileInsert({ fileId })} disabled={!fileId}>
        Upload File
      </button>
    </div>
  );
}
