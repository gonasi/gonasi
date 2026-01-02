import type { JSX } from 'react';
import { useEffect } from 'react';
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

import type { Model3DPayload } from '../../../nodes/Model3DNode';
import { $createModel3DNode, Model3DNode } from '../../../nodes/Model3DNode';

export type InsertModel3DPayload = Readonly<Model3DPayload>;

export const INSERT_MODEL3D_COMMAND: LexicalCommand<InsertModel3DPayload> =
  createCommand('INSERT_MODEL3D_COMMAND');

export default function Model3DPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([Model3DNode])) {
      throw new Error('Model3DPlugin: Model3DNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertModel3DPayload>(
        INSERT_MODEL3D_COMMAND,
        (payload) => {
          const model3DNode = $createModel3DNode(payload);
          $insertNodes([model3DNode]);
          if ($isRootOrShadowRoot(model3DNode.getParentOrThrow())) {
            $wrapNodeInElement(model3DNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
