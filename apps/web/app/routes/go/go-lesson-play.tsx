import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router';
import isEqual from 'fast-deep-equal';
import { redirectWithError } from 'remix-toast';
import { ClientOnly } from 'remix-utils/client-only';

import { fetchNextChapterAndLessonId } from '@gonasi/database/courses';
import { fetchPublishedLessonContentById } from '@gonasi/database/lessons';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

// Load the editor component lazily to improve initial load time
const LazyGoEditor = lazy(() => import('~/components/go-editor'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

/**
 * Loader function to fetch lesson content by ID.
 * Redirects to course page if the lesson is not found.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // Fetch data in parallel
  const [lesson, nextChapterAndLessonId] = await Promise.all([
    fetchPublishedLessonContentById(supabase, params.lessonId),
    fetchNextChapterAndLessonId(supabase, params.courseId, params.chapterId, params.lessonId),
  ]);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  if (!lesson.content) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson has no content');
  }

  return { lesson, nextChapterAndLessonId };
}

// Move outside component to avoid recreation on each render
interface EditorProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  editorState: any; // Replace 'any' with a more specific type if possible
  setEditorState: React.Dispatch<React.SetStateAction<any>>; // Replace 'any' with a more specific type
}

const Editor = ({ courseId, chapterId, lessonId, editorState, setEditorState }: EditorProps) => (
  <section className='mx-auto max-w-xl overflow-hidden py-10'>
    <LazyGoEditor
      key={`${courseId}-${chapterId}-${lessonId}`}
      editorState={editorState}
      setEditorState={setEditorState}
      loading={false}
      readOnly
    />
  </section>
);

/**
 * Component to display the lesson content using LazyGoEditor.
 * Optimized to prevent unnecessary re-renders.
 */
export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const {
    lessonContent,
    lessonContentToDisplay,
    nodeProgress,
    lessonProgress,
    lessonComplete,
    updateLessonContent,
    updateLessonContentToDisplay,
    updateNodeProgress,
    updateLessonComplete,
    updateNextLessonChapter,
  } = useStore();

  // Memoize the new content to prevent unnecessary updates
  const newContent = useMemo(() => loaderData.lesson.content, [loaderData.lesson.content]);

  // Memoize the node progress
  const newNodeProgress = useMemo(
    () => loaderData.lesson.lessons_progress?.node_progress ?? {},
    [loaderData.lesson.lessons_progress?.node_progress],
  );

  // Memoize completion status
  const isComplete = useMemo(
    () => loaderData.lesson.lessons_progress?.is_complete ?? false,
    [loaderData.lesson.lessons_progress?.is_complete],
  );

  const nextChapter = loaderData.nextChapterAndLessonId;

  // 1. Update lesson content
  useEffect(() => {
    if (!isEqual(newContent, lessonContent)) {
      queueMicrotask(() => {
        updateLessonContent(newContent);
      });
    }
  }, [newContent, lessonContent, updateLessonContent]);

  // 2. Update node progress
  useEffect(() => {
    // Skip the first render when newNodeProgress is empty
    // if (Object.keys(newNodeProgress).length === 0) return;

    // Use a proper deep comparison
    if (!isEqual(newNodeProgress, nodeProgress)) {
      // Update directly without queueMicrotask
      updateNodeProgress(newNodeProgress);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNodeProgress]); // Remove nodeProgress from dependencies

  // 3. Update lesson complete
  useEffect(() => {
    if (isComplete !== lessonComplete) {
      queueMicrotask(() => {
        updateLessonComplete(isComplete);
      });
    }
  }, [isComplete, lessonComplete, updateLessonComplete]);

  useEffect(() => {
    updateNextLessonChapter(nextChapter);
  }, [nextChapter, updateNextLessonChapter]);

  // Memoize the editor component to prevent recreation on every render
  const editorComponent = useMemo(
    () => (
      <Editor
        courseId={params.courseId}
        chapterId={params.chapterId}
        lessonId={params.lessonId}
        editorState={lessonContentToDisplay}
        setEditorState={updateLessonContentToDisplay}
      />
    ),
    [
      params.courseId,
      params.chapterId,
      params.lessonId,
      lessonContentToDisplay,
      updateLessonContentToDisplay,
    ],
  );

  return (
    <>
      <CoursePlayLayout to={`/go/courses/${params.courseId}`} progress={lessonProgress}>
        <ClientOnly fallback={<Spinner />}>
          {() => <Suspense fallback={<Spinner />}>{editorComponent}</Suspense>}
        </ClientOnly>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
