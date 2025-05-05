import type { JSX } from 'react';
import { useEffect } from 'react';
import { useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalCommand, LexicalEditor, NodeKey, SerializedEditorState } from 'lexical';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { Plus } from 'lucide-react';

import type { MatchConceptItem } from '../../../../nodes/GoNodes/MatchConceptsNode';
import {
  $createMatchConceptsNode,
  $isMatchConceptsNode,
  MatchConceptsNode,
} from '../../../../nodes/GoNodes/MatchConceptsNode';
import type { MatchConceptsParams } from './schema';
import { schema } from './schema';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';

export const INSERT_MATCH_CONCEPTS_COMMAND: LexicalCommand<MatchConceptsParams> = createCommand(
  'INSERT_MATCH_CONCEPTS_COMMAND',
);

export const EDIT_MATCH_CONCEPTS_COMMAND: LexicalCommand<{
  nodeKey: NodeKey;
  params: MatchConceptsParams;
}> = createCommand('EDIT_MATCH_CONCEPTS_COMMAND');

export function InsertMatchConceptsDialog({
  activeEditor,
  onClose,
  defaultData,
  mode = 'create',
  nodeKey,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
  defaultData?: MatchConceptsParams;
  mode?: 'create' | 'edit';
  nodeKey?: NodeKey;
}): JSX.Element {
  const [form, fields] = useForm({
    id: 'match-concepts-form',
    constraint: getZodConstraint(schema),
    defaultValue: defaultData,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit(event) {
      event.preventDefault();
      if (form.errors?.length) return;

      const params: MatchConceptsParams = {
        titleState: fields.titleState.value || '',
        itemsState: Array.isArray(fields.itemsState.value)
          ? fields.itemsState.value
          : JSON.parse(fields.itemsState.value || '[]'),
        uuid: fields.uuid?.value || undefined,
      };

      if (mode === 'edit' && nodeKey) {
        activeEditor.dispatchCommand(EDIT_MATCH_CONCEPTS_COMMAND, {
          nodeKey,
          params,
        });
      } else {
        activeEditor.dispatchCommand(INSERT_MATCH_CONCEPTS_COMMAND, params);
      }

      onClose();
    },
  });

  const items = fields.itemsState.getFieldList();

  // Function to add a new item
  const handleAddItem = () => {
    // Create a new item
    const newItem = { itemState: '', valueState: '' };

    // Get current items array or initialize it
    const currentItems = fields.itemsState.getFieldList().map((item) => {
      const itemFields = item.getFieldset();
      return {
        itemState: itemFields.itemState.value || '',
        valueState: itemFields.valueState.value || '',
      };
    });

    // Update the form with the new item added
    form.update({
      name: fields.itemsState.name,
      value: [...currentItems, newItem],
    });
  };

  // Function to remove an item
  const handleRemoveItem = (index: number) => {
    // Get current items
    const currentItems = fields.itemsState.getFieldList().map((item) => {
      const itemFields = item.getFieldset();
      return {
        itemState: itemFields.itemState.value || '',
        valueState: itemFields.valueState.value || '',
      };
    });

    // Remove the item at the specified index
    const updatedItems = currentItems.filter((_, i) => i !== index);

    // Update the form with the filtered items
    form.update({
      name: fields.itemsState.name,
      value: updatedItems,
    });
  };

  return (
    <form id={form.id} onSubmit={form.onSubmit} className='space-y-4' noValidate>
      <RichTextInputField
        labelProps={{ children: 'Title', required: true }}
        meta={fields.titleState}
        placeholder='Enter the title here'
        errors={fields.titleState.errors}
        description='This is the title for the matching concept.'
      />

      <div className='space-y-4'>
        {items.map((item, index) => {
          const itemFields = item.getFieldset();

          return (
            <div key={item.key} className='flex flex-col gap-4 rounded border p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium'>Item {index + 1}</h3>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemoveItem(index)}
                  className='text-red-500 hover:text-red-700'
                >
                  Remove
                </Button>
              </div>

              <RichTextInputField
                labelProps={{ children: `Item ${index + 1}`, required: true }}
                meta={itemFields.itemState}
                placeholder='Enter the item'
                errors={itemFields.itemState.errors}
                description='The item that will be matched.'
              />
              <RichTextInputField
                labelProps={{ children: `Value ${index + 1}`, required: true }}
                meta={itemFields.valueState}
                placeholder='Enter the value'
                errors={itemFields.valueState.errors}
                description='The correct match for the item.'
              />
            </div>
          );
        })}
      </div>
      <ErrorList errors={form.allErrors.itemsState} id={form.errorId} />
      <Button type='button' variant='secondary' size='sm' onClick={handleAddItem}>
        <Plus /> Add
      </Button>

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

export default function MatchConceptsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MatchConceptsNode])) {
      throw new Error('MatchConceptsPlugin: MatchConceptsNode not registered on editor');
    }

    const insertListener = editor.registerCommand<MatchConceptsParams>(
      INSERT_MATCH_CONCEPTS_COMMAND,
      (payload) => {
        editor.update(() => {
          const titleState = JSON.parse(payload.titleState) as SerializedEditorState;

          const items: MatchConceptItem[] = payload.itemsState.map(({ itemState, valueState }) => ({
            item: JSON.parse(itemState) as SerializedEditorState,
            value: JSON.parse(valueState) as SerializedEditorState,
          }));

          const matchConceptsNode = $createMatchConceptsNode(titleState, items);

          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const topLevelNode = anchorNode.getTopLevelElement();

            if (topLevelNode) {
              topLevelNode.insertAfter(matchConceptsNode);
            } else {
              $getRoot().append(matchConceptsNode);
            }
          } else {
            $getRoot().append(matchConceptsNode);
          }

          const newParagraph = $createParagraphNode();
          matchConceptsNode.insertAfter(newParagraph);
          newParagraph.selectStart();
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    const editListener = editor.registerCommand<{
      nodeKey: string;
      params: MatchConceptsParams;
    }>(
      EDIT_MATCH_CONCEPTS_COMMAND,
      ({ nodeKey, params }) => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);

          if ($isMatchConceptsNode(node)) {
            const titleState = JSON.parse(params.titleState) as SerializedEditorState;

            const items: MatchConceptItem[] = params.itemsState.map(
              ({ itemState, valueState }) => ({
                item: JSON.parse(itemState) as SerializedEditorState,
                value: JSON.parse(valueState) as SerializedEditorState,
              }),
            );

            const newNode = $createMatchConceptsNode(titleState, items);
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
