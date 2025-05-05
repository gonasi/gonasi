import { lazy, Suspense, useEffect, useState } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { Eye, NotebookPen } from 'lucide-react';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';
import { ClientOnly } from 'remix-utils/client-only';

import { editLessonContent, fetchUserLessonById } from '@gonasi/database/lessons';
import { SubmitEditLessonContentSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/edit-lesson-content';

import { BannerCard } from '~/components/cards';
import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

const LazyGoEditor = lazy(() => import('~/components/go-editor'));

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const lesson = await fetchUserLessonById(supabase, params.lessonId);

  if (!lesson) {
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Course not found',
    );
  }

  return lesson;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const submission = parseWithZod(formData, { schema: SubmitEditLessonContentSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editLessonContent(supabase, {
    ...submission.value,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  return dataWithSuccess({ result: 'Data saved successfully' }, message);
}

// Component
export default function NewLessonTitle({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [editorState, setEditorState] = useState(loaderData.content);
  const [loading, setLoading] = useState(false);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSave = () => {
    const formData = new FormData();
    formData.append('content', editorState || '');
    formData.append('lessonId', params.lessonId);

    fetcher.submit(formData, {
      method: 'post',
    });
  };

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  return (
    <>
      <Modal open onOpenChange={(open) => open || handleClose()}>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={<NotebookPen />}
            title={loaderData.name}
            subTitle={loaderData.lesson_types?.name}
          />

          <BannerCard
            message='Editing this lesson will reset progress for all users.'
            variant='warning'
          />
          <ClientOnly fallback={<Spinner />}>
            {() => (
              <>
                <Modal.Body>
                  <Suspense
                    fallback={
                      <div className='editor-shell'>
                        <div className='toolbar animate-pulse' />
                        <p className='font-secondary text-muted-foreground animate-pulse px-6 py-2'>
                          Loading...
                        </p>
                      </div>
                    }
                  >
                    <LazyGoEditor
                      editorState={editorState}
                      setEditorState={setEditorState}
                      loading={loading}
                    />
                  </Suspense>
                </Modal.Body>

                <Modal.Footer>
                  <div className='mx-auto flex max-w-[1100px] items-center justify-between'>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      isLoading={loading}
                      leftIcon={<Eye />}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant='secondary'
                      disabled={loading}
                      leftIcon={<Eye />}
                    >
                      Preview
                    </Button>
                  </div>
                </Modal.Footer>
              </>
            )}
          </ClientOnly>
        </Modal.Content>
      </Modal>
    </>
  );
}
