import type { JSX } from 'react';
import { useEffect } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { getInputProps, useForm } from '@conform-to/react';
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
  $createTrueOrFalseNode,
  $isTrueOrFalseNode,
  TrueOrFalseNode,
} from '../../../../nodes/GoNodes/TrueOrFalseNode';
import type { TrueOrFalseParams } from './schema';
import { schema } from './schema';

import { Button } from '~/components/ui/button';
import { ErrorList, RadioButtonField, TextareaField } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';

// Define Lexical commands for inserting and editing a TrueOrFalseNode
export const INSERT_TRUE_OR_FALSE_COMMAND: LexicalCommand<TrueOrFalseParams> = createCommand(
  'INSERT_TRUE_OR_FALSE_COMMAND',
);

export const EDIT_TRUE_OR_FALSE_COMMAND: LexicalCommand<{
  nodeKey: NodeKey;
  params: TrueOrFalseParams;
}> = createCommand('EDIT_TRUE_OR_FALSE_COMMAND');

export function InsertTrueOrFalseDialog({
  activeEditor,
  onClose,
  defaultData,
  mode = 'create',
  nodeKey,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
  defaultData?: TrueOrFalseParams;
  mode?: 'create' | 'edit';
  nodeKey?: NodeKey;
}): JSX.Element {
  const [form, fields] = useForm({
    id: 'true-or-false-form',
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
      const params: TrueOrFalseParams = {
        questionState: fields.questionState.value || '',
        correctAnswer: fields.correctAnswer.value as 'true' | 'false',
        hint: fields.hint.value || undefined,
        explanationState: fields.explanationState.value || '',
        uuid: fields.uuid.value || undefined,
      };

      // Dispatch appropriate Lexical command based on mode
      if (mode === 'edit' && !!nodeKey) {
        activeEditor.dispatchCommand(EDIT_TRUE_OR_FALSE_COMMAND, {
          nodeKey,
          params,
        });
      } else {
        activeEditor.dispatchCommand(INSERT_TRUE_OR_FALSE_COMMAND, params);
      }

      onClose();
    },
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} className='space-y-4' noValidate>
      <RichTextInputField
        labelProps={{ children: 'Question', required: true }}
        meta={fields.questionState as FieldMetadata<string>}
        placeholder='Type the true or false statement here'
        errors={fields.questionState.errors}
        description='The main statement students will evaluate as true or false.'
      />
      <RadioButtonField
        field={fields.correctAnswer}
        labelProps={{ children: 'Choose the correct answer', required: true }}
        options={[
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ]}
        errors={fields.correctAnswer.errors}
        description='Answer that is correct'
      />
      <RichTextInputField
        labelProps={{ children: 'Explanation', required: true }}
        meta={fields.explanationState as FieldMetadata<string>}
        placeholder='Explain the reasoning behind the answer'
        errors={fields.explanationState?.errors}
        description='Help learners understand the logic or facts that support the answer.'
      />
      <TextareaField
        labelProps={{ children: 'Hint' }}
        textareaProps={{
          ...getInputProps(fields.hint, { type: 'text' }),
          placeholder: 'Optional hint to guide learners',
        }}
        errors={fields.hint?.errors}
        description='Give learners a nudge or context clue (optional).'
      />
      <ErrorList errors={form.errors} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button variant='ghost' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit'>{mode === 'edit' ? 'Update Question' : 'Add Question'}</Button>
      </div>
    </form>
  );
}

export default function TrueOrFalsePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([TrueOrFalseNode])) {
      throw new Error('TrueOrFalsePlugin: TrueOrFalseNode not registered on editor');
    }

    const insertListener = editor.registerCommand<TrueOrFalseParams>(
      INSERT_TRUE_OR_FALSE_COMMAND,
      (payload) => {
        editor.update(() => {
          const questionState = JSON.parse(payload.questionState);
          const explanationState = JSON.parse(payload.explanationState);

          const trueOrFalseNode = $createTrueOrFalseNode(
            questionState,
            explanationState,
            payload.correctAnswer === 'true',
            payload.hint,
          );

          // Get the current selection
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            // If there's a valid selection, insert at the anchor point
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              // If text node, insert after its parent (typically paragraph)
              const topLevelNode = anchorNode.getTopLevelElement();
              if (topLevelNode) {
                topLevelNode.insertAfter(trueOrFalseNode);
              } else {
                // Fallback to root insertion
                $getRoot().append(trueOrFalseNode);
              }
            } else if (anchorNode.isInline()) {
              // If inline element, insert after its parent
              const topLevelNode = anchorNode.getTopLevelElement();
              if (topLevelNode) {
                topLevelNode.insertAfter(trueOrFalseNode);
              } else {
                $getRoot().append(trueOrFalseNode);
              }
            } else {
              // Direct insertion after the node
              anchorNode.insertAfter(trueOrFalseNode);
            }
          } else {
            // Fallback to root insertion if no valid selection
            $getRoot().append(trueOrFalseNode);
          }

          // Create a new paragraph after the true/false node and focus it
          const newParagraph = $createParagraphNode();
          trueOrFalseNode.insertAfter(newParagraph);
          newParagraph.selectStart();
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    const editListener = editor.registerCommand<{
      nodeKey: string;
      params: {
        questionState: string;
        explanationState: string;
        correctAnswer: string;
        hint?: string;
      };
    }>(
      EDIT_TRUE_OR_FALSE_COMMAND,
      ({ nodeKey, params }) => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);

          if ($isTrueOrFalseNode(node)) {
            const newNode = $createTrueOrFalseNode(
              JSON.parse(params.questionState),
              JSON.parse(params.explanationState),
              params.correctAnswer === 'true',
              params.hint,
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
