import { useEffect } from 'react';
import { registerList } from '@lexical/list';
import type { LexicalEditor } from 'lexical';

export function useList(editor: LexicalEditor): void {
  useEffect(() => {
    return registerList(editor);
  }, [editor]);
}
