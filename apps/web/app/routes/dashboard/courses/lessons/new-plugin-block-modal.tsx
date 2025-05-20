import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { getPluginNameById, type PluginId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/new-plugin-block-modal';

import { Modal } from '~/components/ui/modal';

export default function NewPluginBlockModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const basePath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`;

  const handleClose = () => navigate(basePath);

  const title = getPluginNameById(params.pluginTypeId as PluginId);

  console.log('params: ', params.pluginTypeId);

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='lg'>
        <Modal.Header
          title={title}
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
