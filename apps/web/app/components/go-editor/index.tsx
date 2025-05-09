import { Suspense, useEffect, useRef } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type {
  DOMConversionMap,
  DOMExportOutput,
  DOMExportOutputMap,
  Klass,
  LexicalEditor,
  LexicalNode,
} from 'lexical';
import { $isTextNode, isHTMLElement, ParagraphNode, TextNode } from 'lexical';
import debounce from 'lodash/debounce';

import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import { Spinner } from '../loaders';
import GoEditorTheme from './GoEditorTheme';
import { parseAllowedColor, parseAllowedFontSize } from './styleConfig';
import './styles.css';

const removeStylesExportDOM = (editor: LexicalEditor, target: LexicalNode): DOMExportOutput => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class],[dir="ltr"]'),
    ]) {
      el.removeAttribute('class');
      el.removeAttribute('style');
      if (el.getAttribute('dir') === 'ltr') {
        el.removeAttribute('dir');
      }
    }
  }
  return output;
};

const exportMap: DOMExportOutputMap = new Map<
  Klass<LexicalNode>,
  (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput
>([
  [ParagraphNode, removeStylesExportDOM],
  [TextNode, removeStylesExportDOM],
]);

const getExtraStyles = (element: HTMLElement): string => {
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
};

const constructImportMap = (): DOMConversionMap => {
  const importMap: DOMConversionMap = {};

  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
};

interface BaseEditorProps {
  editorState: string | null;
  loading: boolean;
  placeholder: string;
}

type EditorProps =
  | (BaseEditorProps & {
      readOnly: true;
      setEditorState?: never;
    })
  | (BaseEditorProps & {
      readOnly?: false;
      setEditorState: (state: string) => void;
    });

export default function GoEditor({
  editorState,
  setEditorState,
  loading,
  readOnly = false,
  placeholder = 'Enter some text',
}: EditorProps) {
  const editorConfig = {
    html: {
      export: exportMap,
      import: constructImportMap(),
    },
    namespace: 'go-editor',
    nodes: [ParagraphNode, TextNode],
    editorState,
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    theme: GoEditorTheme,
    editable: !readOnly || (!loading && !readOnly),
  };

  const debouncedSetEditorStateRef = useRef<((state: string) => void) | null>(null);

  useEffect(() => {
    if (readOnly || !setEditorState) return;

    const debounced = debounce((state: string) => {
      setEditorState(state);
    }, 500);

    debouncedSetEditorStateRef.current = debounced;

    return () => {
      debounced.cancel();
    };
  }, [readOnly, setEditorState]);

  return (
    <Suspense fallback={<Spinner />}>
      <LexicalComposer initialConfig={editorConfig}>
        <div className='editor-container'>
          {!readOnly && <ToolbarPlugin />}
          <div className='editor-inner'>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className='editor-input'
                  aria-placeholder={placeholder}
                  placeholder={<div className='editor-placeholder'>{placeholder}</div>}
                  readOnly={readOnly}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <TreeViewPlugin />
            {!readOnly && setEditorState ? (
              <OnChangePlugin
                onChange={(editorState) => {
                  editorState.read(() => {
                    const json = JSON.stringify(editorState);
                    debouncedSetEditorStateRef.current?.(json);
                  });
                }}
              />
            ) : null}
          </div>
        </div>
      </LexicalComposer>
    </Suspense>
  );
}
