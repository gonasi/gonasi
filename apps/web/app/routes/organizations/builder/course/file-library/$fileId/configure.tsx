import { useState } from 'react';
import { data, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Save } from 'lucide-react';
import { redirectWithError } from 'remix-toast';
import { toast } from 'sonner';

import { fetchFileById } from '@gonasi/database/files';
import { DEFAULT_MODEL_SETTINGS, type Model3DSettings } from '@gonasi/schemas/file';

import type { Route } from './+types/configure';

import { ModelConfigurator } from '~/components/file-renderers/model-configurator';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);

  const [file, canEdit] = await Promise.all([
    fetchFileById({ supabase, fileId: params.fileId, mode: 'preview' }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'You are not authorized to configure this file',
    );
  }

  if (file.data === null) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'File does not exist',
    );
  }

  if (file.data.file_type !== 'model3d') {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'This file is not a 3D model',
    );
  }

  return data(file.data, { headers });
}

export default function ConfigureModel({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<Model3DSettings>(
    (loaderData.settings as any)?.model3d ?? DEFAULT_MODEL_SETTINGS,
  );

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('fileId', loaderData.id);
      formData.append('settings', JSON.stringify(currentSettings));

      const response = await fetch('/api/files/configure-model', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to save configuration');
      }

      toast.success('3D model configuration updated!');
      setIsRedirecting(true);

      requestAnimationFrame(() => {
        navigate(`/${params.organizationId}/builder/${params.courseId}/file-library`);
      });
    } catch (error) {
      console.error('Configuration save failed:', error);
      toast.error(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isSaving || isRedirecting;

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <Modal.Header
          title='Configure 3D Model'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/file-library`}
        />

        <Modal.Body>
          <AnimatePresence mode='wait'>
            {isRedirecting ? (
              <motion.div
                key='redirecting'
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className='flex flex-col items-center justify-center gap-4 py-12'
              >
                <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                <p className='text-muted-foreground text-sm'>Saving configuration...</p>
              </motion.div>
            ) : (
              <motion.div
                key='configurator'
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className='mb-4'>
                  <h3 className='font-semibold'>{loaderData.name}</h3>
                  <p className='text-muted-foreground text-sm'>
                    Adjust camera, lighting, and scale to configure how your 3D model appears
                  </p>
                </div>

                <ModelConfigurator
                  url={loaderData.signed_url!}
                  extension={loaderData.extension}
                  initialSettings={currentSettings}
                  onSettingsChange={setCurrentSettings}
                />

                <div className='mt-6 flex justify-end'>
                  <Button
                    onClick={handleSave}
                    disabled={isDisabled}
                    isLoading={isDisabled}
                    rightIcon={<Save />}
                  >
                    Save Configuration
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
