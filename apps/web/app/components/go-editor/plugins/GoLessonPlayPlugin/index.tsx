import { useEffect, useMemo, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import type { NodeType } from '@gonasi/database/lessons';
import { nodeTypes } from '@gonasi/database/lessons';

import { useStore } from '~/store';

export interface LexicalNode {
  type: string;
  version?: number;
  uuid?: string;
  children?: any[];
  direction?: string | null;
  format?: string;
  indent?: number;
}

export interface LexicalContent {
  root: {
    children: LexicalNode[];
    direction: string;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

export const EMPTY_LEXICAL: LexicalContent = {
  root: {
    children: [],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const defaultLessonContent = JSON.stringify(EMPTY_LEXICAL);

export default function GoLessonPlayPlugin() {
  const [editor] = useLexicalComposerContext();
  const { lessonContent, lessonContentToDisplay, nodeProgress } = useStore();

  // Memoize the parsed content to avoid unnecessary re-parsing
  const parsedLessonContent: LexicalContent = useMemo(() => {
    try {
      return JSON.parse(lessonContent ?? defaultLessonContent);
    } catch (error) {
      console.error('Failed to parse lesson content:', error, { lessonContent });
      return EMPTY_LEXICAL;
    }
  }, [lessonContent]);

  // Memoize the nodes
  const nodes = useMemo(() => parsedLessonContent.root.children, [parsedLessonContent]);

  // Store the last updated content
  const lastUpdatedContentRef = useRef<string | null>(null);
  // Track when we should trigger scrolling
  const shouldScrollRef = useRef<boolean>(false);

  useEffect(() => {
    let updatedContentString = lessonContent; // Default

    if (!nodeProgress || Object.keys(nodeProgress).length === 0) {
      const firstRelevantNodeIndex = nodes.findIndex(
        (node) => nodeTypes.includes(node.type as NodeType) && node.uuid !== undefined,
      );

      if (firstRelevantNodeIndex !== -1) {
        updatedContentString = JSON.stringify({
          ...parsedLessonContent,
          root: {
            ...parsedLessonContent.root,
            children: nodes.slice(0, firstRelevantNodeIndex + 1),
          },
        });
      }
    } else {
      const unplayedRelevantNodes = nodes.filter((node) => {
        const uuid = node.uuid;
        return (
          nodeTypes.includes(node.type as NodeType) &&
          uuid !== undefined &&
          nodeProgress[uuid] === undefined
        );
      });

      if (unplayedRelevantNodes.length > 0) {
        const validRelevantNodeIndex = nodes.findIndex(
          (node) =>
            nodeTypes.includes(node.type as NodeType) &&
            node.uuid === unplayedRelevantNodes[0]?.uuid,
        );

        if (validRelevantNodeIndex !== -1) {
          updatedContentString = JSON.stringify({
            ...parsedLessonContent,
            root: {
              ...parsedLessonContent.root,
              children: nodes.slice(0, validRelevantNodeIndex + 1),
            },
          });
        }
      }
    }

    if (lastUpdatedContentRef.current !== updatedContentString) {
      lastUpdatedContentRef.current = updatedContentString;

      try {
        editor.update(() => {
          const editorState = editor.parseEditorState(updatedContentString ?? '');
          editor.setEditorState(editorState);
        });

        // Set flag to trigger scrolling after content update
        shouldScrollRef.current = true;
      } catch (error) {
        console.error('Failed to update editor state:', error, { updatedContentString });
      }
    }
  }, [editor, lessonContent, nodes, nodeProgress, parsedLessonContent]);

  // Scroll after lessonContent updates
  useEffect(() => {
    if (!shouldScrollRef.current) return;

    shouldScrollRef.current = false;
  }, [lessonContentToDisplay, nodes, nodeProgress]);

  return null;
}
