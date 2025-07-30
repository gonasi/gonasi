import { useEffect, useRef } from 'react';
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
import debounce from 'lodash.debounce';

import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import { parseAllowedColor, parseAllowedFontSize } from './styleConfig';
import DefaultTheme from './theme';

import { cn } from '~/lib/utils';

const removeStylesExportDOM = (editor: LexicalEditor, target: LexicalNode): DOMExportOutput => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    // Remove all inline styles and classes if the element is an HTMLElement
    // Children are checked as well since TextNode can be nested
    // in i, b, and strong tags.
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
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
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

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
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

interface GoLexicalProps {
  editorState: string | null;
  setEditorState: (state: string) => void;
  loading: boolean;
  placeholder?: string;
  hasError?: boolean;
}

export default function GoLexical({
  editorState,
  setEditorState,
  loading,
  hasError,
  placeholder = '',
}: GoLexicalProps) {
  const debouncedSetEditorStateRef = useRef<((state: string) => void) | null>(null);

  useEffect(() => {
    const debounced = debounce((state: string) => {
      setEditorState(state);
    }, 500);
    debouncedSetEditorStateRef.current = debounced;

    return () => {
      debounced.cancel();
    };
  }, [setEditorState]);

  const editorConfig = {
    html: {
      export: exportMap,
      import: constructImportMap(),
    },
    namespace: 'Gonasi Lexical',
    nodes: [ParagraphNode, TextNode],
    onError(error: Error) {
      throw error;
    },
    theme: DefaultTheme,
    editorState,
    editable: !loading,
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div
        className={cn(
          'text-foreground relative mx-auto mt-5 mb-5 w-full rounded-t-[10px] text-left leading-5 font-normal',
        )}
      >
        <ToolbarPlugin />
        <div className={cn('bg-background relative')}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  'tab-[1] text-md caret-foreground relative min-h-[150px] resize-none px-4 py-4 outline-none',
                )}
                aria-placeholder={placeholder}
                placeholder={
                  <div
                    className={cn(
                      'text-4 text-foreground pointer-events-none absolute top-4 left-4 inline-block overflow-hidden text-ellipsis select-none',
                    )}
                  >
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin
            onChange={(editorState) => {
              editorState.read(() => {
                const json = JSON.stringify(editorState);
                debouncedSetEditorStateRef.current?.(json);
              });
            }}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <TreeViewPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
