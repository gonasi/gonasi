import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { ArrowLeft } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { createLessonBlock } from '@gonasi/database/lessons';
import {
  getContentSchemaByType,
  getPluginNameById,
  getPluginTypeNameById,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/plugins-modal';

import { AppLogo } from '~/components/app-logo';
import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';
import { checkHoneypot } from '~/utils/honeypot.server';

// Lazy load the dialog component
const GoPluginsMenuDialog = lazy(() => import('~/components/plugins/GoPluginsMenuDialog'));

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const pluginType = formData.get('intent') as PluginTypeId;

  const PluginTypeSchema = getContentSchemaByType(pluginType);

  const { supabase } = createClient(request);

  const submission = parseWithZod(formData, { schema: PluginTypeSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await createLessonBlock(supabase, {
    content: submission.value,
    lesson_id: params.lessonId,
    plugin_type: pluginType,
    weight: 1, // User can update weight on edit
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`,
        message,
      )
    : dataWithError(null, message);
}

export default function PluginsModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { activePlugin, activeSubPlugin, updateActivePlugin, updateActiveSubPlugin } = useStore();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`,
    );
  };

  const handlePrevious = () => {
    if (activeSubPlugin) {
      updateActiveSubPlugin(null);
    } else if (activePlugin) {
      updateActivePlugin(null);
    }
  };

  const leadingIcon =
    activePlugin || activeSubPlugin ? (
      <ArrowLeft onClick={handlePrevious} className='hover:cursor-pointer' />
    ) : (
      <AppLogo sizeClass='h-4 md:h-5 -mt-1' />
    );

  const title =
    activePlugin && activeSubPlugin
      ? getPluginTypeNameById(activePlugin, activeSubPlugin)
      : activePlugin
        ? getPluginNameById(activePlugin)
        : 'All Gonasi Plugins';

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header leadingIcon={leadingIcon} title={title} />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <GoPluginsMenuDialog />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
