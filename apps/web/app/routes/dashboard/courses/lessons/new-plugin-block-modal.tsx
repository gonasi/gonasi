import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { getPluginGroupNameByPluginGroupId, type PluginGroupId } from '@gonasi/schemas/plugins';

import type { Route } from './plugins/+types/view-plugins-by-category-id-modal';

import { Modal } from '~/components/ui/modal';

export default function NewPluginBlockModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const basePath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`;

  const handleClose = () => navigate(basePath);

  const pluginGroupTitle = getPluginGroupNameByPluginGroupId(params.pluginTypeId as PluginGroupId);

  console.log('params: ', params.pluginTypeId);

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='lg'>
        <Modal.Header
          title={pluginGroupTitle}
          leadingIcon={
            <Link to={`${basePath}/plugins`}>
              <ArrowLeft />
            </Link>
          }
        />
        <Modal.Body>
          <h1>new plugin</h1>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
