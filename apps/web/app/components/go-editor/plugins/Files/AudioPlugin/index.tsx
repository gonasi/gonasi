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

import type { AudioPayload } from '../../../nodes/AudioNode';
import { $createAudioNode, AudioNode } from '../../../nodes/AudioNode';

export type InsertAudioPayload = Readonly<AudioPayload>;

export const INSERT_AUDIO_COMMAND: LexicalCommand<InsertAudioPayload> =
  createCommand('INSERT_AUDIO_COMMAND');

export default function AudioPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([AudioNode])) {
      throw new Error('AudioPlugin: AudioNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertAudioPayload>(
        INSERT_AUDIO_COMMAND,
        (payload) => {
          const audioNode = $createAudioNode(payload);
          $insertNodes([audioNode]);
          if ($isRootOrShadowRoot(audioNode.getParentOrThrow())) {
            $wrapNodeInElement(audioNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
