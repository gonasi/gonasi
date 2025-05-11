import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Form } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import type { LexicalCommand, LexicalEditor } from 'lexical';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement,
} from 'lexical';
import { FileImage } from 'lucide-react';

import type { FilePayload } from '../../nodes/FileNode';
import { $createFileNode, $isFileNode, FileNode } from '../../nodes/FileNode';
import { NewEditorFileSchema } from './schema';

import { Button } from '~/components/ui/button';
import { Field } from '~/components/ui/forms';

export type InsertFilePayload = Readonly<FilePayload>;

export const INSERT_FILE_COMMAND: LexicalCommand<InsertFilePayload> =
  createCommand('INSERT_FILE_COMMAND');

export function InsertFileUriDialogBody({
  handleFileInsert,
}: {
  handleFileInsert: (payload: InsertFilePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <Field
        labelProps={{ children: 'Image URL' }}
        inputProps={{
          placeholder: 'i.e. https://source.unsplash.com/random',
          onChange: (e) => setSrc(e.target.value),
          value: src,
        }}
        className="[&_input]:data-test-id='image-modal-url-input'"
      />

      <Field
        labelProps={{ children: 'Alt Text' }}
        inputProps={{
          placeholder: 'Random unsplash image',
          onChange: (e) => setAltText(e.target.value),
          value: altText,
        }}
        className="[&_input]:data-test-id='image-modal-alt-text-input'"
      />
      <Button
        data-test-id='image-modal-confirm-btn'
        disabled={isDisabled}
        onClick={() => handleFileInsert({ altText, src })}
      >
        Confirm
      </Button>
    </>
  );
}

export function InsertFileUploadedDialogBody({
  handleFileInsert,
}: {
  handleFileInsert: (payload: InsertFilePayload) => void;
}) {
  const loadFile = (file: File | null): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        return resolve('');
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  const [form, fields] = useForm({
    id: 'new-editor-file-form',
    constraint: getZodConstraint(NewEditorFileSchema),
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: NewEditorFileSchema }),
    onSubmit: async (event, { formData }) => {
      event.preventDefault();
      const submission = parseWithZod(formData, { schema: NewEditorFileSchema });

      if (submission.status !== 'success') {
        return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
      }
      const src = await loadFile(submission.value.src);
      const imageData = {
        ...submission.value,
        src,
      };
      return handleFileInsert(imageData);
    },
  });

  return (
    <Form encType='multipart/form-data' {...getFormProps(form)}>
      <Field
        labelProps={{ children: 'Image File', required: true }}
        inputProps={{ ...getInputProps(fields.src, { type: 'file' }), autoFocus: true }}
        errors={fields.src?.errors}
        description='Select an image from your device'
      />
      <Field
        labelProps={{ children: 'Alternative Text', required: true }}
        inputProps={{
          ...getInputProps(fields.altText, { type: 'text' }),
        }}
        errors={fields.altText?.errors}
        description='Describe the image for accessibility (e.g. “Team photo at retreat”)'
      />
      <Button type='submit' leftIcon={<FileImage />}>
        Insert Image
      </Button>
    </Form>
  );
}

export default function FilesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilesPlugin: FileNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertFilePayload>(
        INSERT_FILE_COMMAND,
        (payload) => {
          const FileNode = $createFileNode(payload);
          $insertNodes([FileNode]);
          if ($isRootOrShadowRoot(FileNode.getParentOrThrow())) {
            $wrapNodeInElement(FileNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = document.createElement('img');
img.src = TRANSPARENT_IMAGE;

function $onDragStart(event: DragEvent): boolean {
  const node = $getFileNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.__altText,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        src: node.__src,
        width: node.__width,
      },
      type: 'image',
    }),
  );

  return true;
}

function $onDragover(event: DragEvent): boolean {
  const node = $getFileNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropFile(event)) {
    event.preventDefault();
  }
  return true;
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getFileNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragFileData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropFile(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_FILE_COMMAND, data);
  }
  return true;
}

function $getFileNodeInSelection(): FileNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isFileNode(node) ? node : null;
}

function getDragFileData(event: DragEvent): null | InsertFilePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropFile(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest('code, span.editor-file') &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}
