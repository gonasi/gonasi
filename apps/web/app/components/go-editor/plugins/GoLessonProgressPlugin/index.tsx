import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher, useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, FileCheck2 } from 'lucide-react';

import { type NodeType, nodeTypes } from '@gonasi/database/lessons';

import type { LexicalContent, LexicalNode } from '../GoLessonPlayPlugin';
import { defaultLessonContent, EMPTY_LEXICAL } from '../GoLessonPlayPlugin';
import { countObjectAndChildren } from './countObjectAndChildren';

import { Button, OutlineButton } from '~/components/ui/button';
import { useStore } from '~/store';

/**
 * Returns the nodes that appear before the last played node.
 * @param nodes - The full list of nodes in the lesson.
 * @param playedNodes - The list of nodes that have been played.
 * @returns An array of nodes before the last played node.
 */
function getNodesBeforeLastPlayed(nodes: LexicalNode[], playedNodes: LexicalNode[]) {
  const lastPlayedUUID = playedNodes.at(-1)?.uuid;
  if (!lastPlayedUUID) return nodes;

  const lastPlayedIndex = nodes.findIndex((node) => node.uuid === lastPlayedUUID);
  return lastPlayedIndex !== -1 ? nodes.slice(0, lastPlayedIndex) : nodes;
}

export default function GoLessonProgressPlugin() {
  const fetcher = useFetcher();
  const params = useParams();
  const navigate = useNavigate();

  const { lessonContent, nodeProgress, updateLessonProgress, lessonComplete, nextLessonChapter } =
    useStore();
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  /**
   * Parses the lesson content from JSON format.
   * Falls back to default content if parsing fails.
   */
  const parsedContent: LexicalContent = useMemo(() => {
    try {
      return JSON.parse(lessonContent ?? defaultLessonContent);
    } catch (error) {
      console.error('Failed to parse lesson content:', error, { lessonContent });
      return EMPTY_LEXICAL;
    }
  }, [lessonContent]);

  const nodes = useMemo(() => parsedContent.root.children, [parsedContent]);
  const totalNodes = useMemo(() => countObjectAndChildren(nodes), [nodes]);

  /**
   * Filters out nodes that are of type 'page-break' or 'true-or-false' etc.
   * These nodes are used to track lesson progress.
   */
  const progressNodesList = useMemo(
    () => nodes.filter((node) => nodeTypes.includes(node.type as NodeType)),
    [nodes],
  );

  /**
   * Determines which progress-tracking nodes have been played,
   * based on the UUIDs stored in `nodeProgress`.
   */

  const playedNodes = useMemo(() => {
    return progressNodesList.filter((node) => {
      const progress = nodeProgress?.[node.uuid as string];
      return progress && progress.type === node.type;
    });
  }, [progressNodesList, nodeProgress]);

  /**
   * Updates the lesson progress percentage based on completed nodes.
   * Also determines whether to show the "Complete lesson" button.
   */
  // Reset progress when there's no nodeProgress
  useEffect(() => {
    if (!nodeProgress) {
      updateLessonProgress(0);
      setShowCompleteButton(false);
    }
  }, [nodeProgress, updateLessonProgress]);

  // If lesson is complete, set progress to 100%
  useEffect(() => {
    if (lessonComplete) {
      updateLessonProgress(100);
    }
  }, [lessonComplete, updateLessonProgress]);

  // Update progress based on played nodes
  useEffect(() => {
    if (!nodeProgress || lessonComplete) return;

    const nodesBeforeLastPlayed = playedNodes.length
      ? getNodesBeforeLastPlayed(nodes, playedNodes)
      : [];

    const completedNodes = countObjectAndChildren(nodesBeforeLastPlayed);

    updateLessonProgress(Math.round((completedNodes / totalNodes) * 100));
  }, [lessonComplete, nodeProgress, nodes, playedNodes, totalNodes, updateLessonProgress]);

  // Toggle complete button visibility
  useEffect(() => {
    if (!nodeProgress || lessonComplete) {
      setShowCompleteButton(false);
      return;
    }

    setShowCompleteButton(playedNodes.length === progressNodesList.length);
  }, [nodeProgress, lessonComplete, playedNodes.length, progressNodesList.length]);

  const handleCompleteLesson = useCallback(() => {
    const formData = new FormData();
    formData.append('intent', 'completeLesson');

    fetcher.submit(formData, {
      method: 'post',
      action: `/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/api-interactive`,
    });
  }, [fetcher, params.chapterId, params.courseId, params.lessonId]);

  const nudgeAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: [0, -4, 0], // subtle up-down movement
      transition: {
        opacity: { duration: 0.3, ease: 'easeOut' },
        y: {
          duration: 1.2,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
        },
      },
    },
  };

  return (
    <div className='fixed bottom-4 px-4 md:px-0'>
      {showCompleteButton ? (
        <motion.div initial={nudgeAnimation.initial} animate={nudgeAnimation.animate}>
          <Button
            onClick={handleCompleteLesson}
            disabled={loading}
            isLoading={loading}
            rightIcon={<FileCheck2 />}
          >
            Complete lesson
          </Button>
        </motion.div>
      ) : lessonComplete && nextLessonChapter ? (
        <motion.div initial={nudgeAnimation.initial} animate={nudgeAnimation.animate}>
          <OutlineButton
            variant='secondary'
            onClick={() =>
              navigate(
                `/go/course/${params.courseId}/${nextLessonChapter?.nextChapterId}/${nextLessonChapter?.nextLessonId}`,
              )
            }
            disabled={loading}
            isLoading={loading}
            rightIcon={<ArrowRight />}
            className='rounded-full'
          >
            {nextLessonChapter?.nextChapterId === params.chapterId ? 'Next lesson' : 'Next chapter'}
          </OutlineButton>
        </motion.div>
      ) : null}
    </div>
  );
}
