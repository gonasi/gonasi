import type { InitialEditorStateType } from '@lexical/react/LexicalComposer';
import type {
  EditorThemeClasses,
  HTMLConfig,
  Klass,
  LexicalEditor,
  LexicalNode,
  LexicalNodeReplacement,
} from 'lexical';

export interface INITIAL_CONFIG {
  namespace: string;
  nodes?: readonly (Klass<LexicalNode> | LexicalNodeReplacement)[];
  onError: (error: Error, editor: LexicalEditor) => void;
  editable?: boolean;
  theme?: EditorThemeClasses;
  editorState?: InitialEditorStateType;
  html?: HTMLConfig;
}
