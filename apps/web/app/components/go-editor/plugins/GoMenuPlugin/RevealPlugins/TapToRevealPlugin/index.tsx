import type { JSX } from 'react';
import { useEffect } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalCommand, LexicalEditor, NodeKey } from 'lexical';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';

import {
  $createTapToRevealNode,
  $isTapToRevealNode,
  TapToRevealNode,
} from '../../../../nodes/GoNodes/TapToRevealNode';
import type { TapToRevealParams } from './schema';
import { schema } from './schema';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';

export const INSERT_TAP_TO_REVEAL_COMMAND: LexicalCommand<TapToRevealParams> = createCommand(
  'INSERT_TAP_TO_REVEAL_COMMAND',
);

export const EDIT_TAP_TO_REVEAL_COMMAND: LexicalCommand<{
  nodeKey: NodeKey;
  params: TapToRevealParams;
}> = createCommand('EDIT_TAP_TO_REVEAL_COMMAND');

export function InsertTapToRevealDialog({
  activeEditor,
  onClose,
  defaultData,
  mode = 'create',
  nodeKey,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
  defaultData?: TapToRevealParams;
  mode?: 'create' | 'edit';
  nodeKey?: NodeKey;
}): JSX.Element {
  const [form, fields] = useForm({
    id: 'tap-to-reveal-form',
    constraint: getZodConstraint(schema),
    defaultValue: { ...defaultData },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },

    onSubmit(event) {
      event.preventDefault();

      if (form.errors?.length) return;

      // Prepare data from form fields
      const params: TapToRevealParams = {
        frontSideState: fields.frontSideState.value || '',
        backSideState: fields.backSideState.value || '',
        uuid: fields.uuid.value || undefined,
      };

      // Dispatch appropriate Lexical command based on mode
      if (mode === 'edit' && !!nodeKey) {
        activeEditor.dispatchCommand(EDIT_TAP_TO_REVEAL_COMMAND, {
          nodeKey,
          params,
        });
      } else {
        activeEditor.dispatchCommand(INSERT_TAP_TO_REVEAL_COMMAND, params);
      }

      onClose();
    },
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} className='space-y-4' noValidate>
      <RichTextInputField
        labelProps={{ children: 'Question', required: true }}
        meta={fields.frontSideState as FieldMetadata<string>}
        placeholder='Type your question here'
        errors={fields.frontSideState.errors}
        description='The question or prompt that students will evaluate.'
      />
      <RichTextInputField
        labelProps={{ children: 'Answer Explanation', required: true }}
        meta={fields.backSideState as FieldMetadata<string>}
        placeholder='Provide the correct answer and reasoning'
        errors={fields.backSideState?.errors}
        description='Provide the answer to the question along with an explanation or supporting details.'
      />
      <ErrorList errors={form.errors} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button variant='ghost' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit'>{mode === 'edit' ? 'Edit' : 'Add'}</Button>
      </div>
    </form>
  );
}

export default function TapToRevealPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([TapToRevealNode])) {
      throw new Error('TapToRevealPlugin: TapToRevealNode not registered on editor');
    }

    const insertListener = editor.registerCommand<TapToRevealParams>(
      INSERT_TAP_TO_REVEAL_COMMAND,
      (payload) => {
        editor.update(() => {
          const frontSideState = JSON.parse(payload.frontSideState);
          const backSideState = JSON.parse(payload.backSideState);

          const tapToRevealNode = $createTapToRevealNode(frontSideState, backSideState);

          // Get the current selection
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            // If there's a valid selection, insert at the anchor point
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              // If text node, insert after its parent (typically paragraph)
              const topLevelNode = anchorNode.getTopLevelElement();
              if (topLevelNode) {
                topLevelNode.insertAfter(tapToRevealNode);
              } else {
                // Fallback to root insertion
                $getRoot().append(tapToRevealNode);
              }
            } else if (anchorNode.isInline()) {
              // If inline element, insert after its parent
              const topLevelNode = anchorNode.getTopLevelElement();
              if (topLevelNode) {
                topLevelNode.insertAfter(tapToRevealNode);
              } else {
                $getRoot().append(tapToRevealNode);
              }
            } else {
              // Direct insertion after the node
              anchorNode.insertAfter(tapToRevealNode);
            }
          } else {
            // Fallback to root insertion if no valid selection
            $getRoot().append(tapToRevealNode);
          }

          // Create a new paragraph after the tap-to-reveal node and focus it
          const newParagraph = $createParagraphNode();
          tapToRevealNode.insertAfter(newParagraph);
          newParagraph.selectStart();
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    const editListener = editor.registerCommand<{
      nodeKey: string;
      params: {
        frontSideState: string;
        backSideState: string;
      };
    }>(
      EDIT_TAP_TO_REVEAL_COMMAND,
      ({ nodeKey, params }) => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);

          if ($isTapToRevealNode(node)) {
            const newNode = $createTapToRevealNode(
              JSON.parse(params.frontSideState),
              JSON.parse(params.backSideState),
            );
            // Preserve UUID
            (newNode as any).__uuid = node.getUuid();
            node.replace(newNode);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    return () => {
      insertListener();
      editListener();
    };
  }, [editor]);

  return null;
}
