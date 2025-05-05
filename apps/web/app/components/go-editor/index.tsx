import { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { DOMConversionMap } from 'lexical';
import { $isTextNode, TextNode } from 'lexical';
import debounce from 'lodash/debounce';

import { FlashMessageContext } from './context/FlashMessageContext';
import { SettingsContext, useSettings } from './context/SettingsContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { ToolbarContext } from './context/ToolbarContext';
import { GonasiNodes } from './nodes/GonasiNodes';
import GoLessonPlayPlugin from './plugins/GoLessonPlayPlugin';
import GoLessonProgressPlugin from './plugins/GoLessonProgressPlugin';
import GoScrollPlayPositioningPlugin from './plugins/GoScrollPlayPositioningPlugin';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import { TableContext } from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import { parseAllowedFontSize } from './plugins/ToolbarPlugin/fontSize';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { parseAllowedColor } from './ui/ColorPicker';
import Editor from './editor';
import { isDevPlayground } from './settings';
import type { INITIAL_CONFIG } from './types';
import './index.css';

function getExtraStyles(element: HTMLElement): string {
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
}

export function buildImportMap(): DOMConversionMap {
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
}

interface EditorProps {
  editorState: string | null;
  setEditorState: (state: string) => void;
  loading: boolean;
  readOnly?: boolean;
  showGoPlugins?: boolean;
  placeholder?: string;
}

function GoEditor({
  editorState,
  setEditorState,
  loading,
  readOnly,
  showGoPlugins = true,
  placeholder,
}: EditorProps) {
  const {
    settings: { isCollab },
  } = useSettings();

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

  const initialConfig: INITIAL_CONFIG = {
    namespace: 'go-editor',
    theme: PlaygroundEditorTheme,
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    nodes: [...GonasiNodes],
    editorState: isCollab ? null : editorState,
    html: { import: buildImportMap() },
    editable: !readOnly || (!loading && !readOnly),
  };

  return (
    <SettingsContext>
      <FlashMessageContext>
        <LexicalComposer initialConfig={initialConfig}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <div className='editor-shell'>
                  <Editor
                    readOnly={readOnly}
                    showGoPlugins={showGoPlugins}
                    placeholder={placeholder}
                  />
                  {!readOnly ? (
                    <OnChangePlugin
                      onChange={(editorState) => {
                        editorState.read(() => {
                          const json = JSON.stringify(editorState);
                          debouncedSetEditorStateRef.current?.(json);
                        });
                      }}
                    />
                  ) : (
                    <>
                      <GoLessonPlayPlugin />
                      <GoLessonProgressPlugin />
                      <GoScrollPlayPositioningPlugin />
                    </>
                  )}
                </div>

                {isDevPlayground ? <PasteLogPlugin /> : null}
                {isDevPlayground ? <TestRecorderPlugin /> : null}
              </ToolbarContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}

export default GoEditor;
