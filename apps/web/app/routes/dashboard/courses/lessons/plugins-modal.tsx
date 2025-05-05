import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import type { Route } from './+types/plugins-modal';

import { AppLogo } from '~/components/app-logo';
import { GoPluginsMenuDialog } from '~/components/plugins/GoPluginsMenuDialog';
import { getPluginNameById, getPluginTypeNameById } from '~/components/plugins/pluginData';
import { Modal } from '~/components/ui/modal';
import { useStore } from '~/store';

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
      <AppLogo sizeClass='h-4 md:h-6' />
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
          <GoPluginsMenuDialog />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
