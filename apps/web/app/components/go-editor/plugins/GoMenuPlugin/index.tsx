import type { JSX, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import { ArrowLeft } from 'lucide-react';

import { GoPluginsMenuDialog } from './GoPluginsMenuDialog';
import { getPluginNameById, getPluginTypeNameById } from './pluginData';

import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { useStore } from '~/store';

interface Props {
  activeEditor: LexicalEditor;
  showModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
    className?: string,
    leadingIcon?: ReactNode,
  ) => void;
}

export default function GoMenuPlugin({ activeEditor, showModal }: Props) {
  const { activePlugin, activeSubPlugin, updateActivePlugin, updateActiveSubPlugin } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBackClick = useCallback(() => {
    if (activeSubPlugin) {
      updateActiveSubPlugin(null);
    } else {
      updateActivePlugin(null);
    }
  }, [activeSubPlugin, updateActivePlugin, updateActiveSubPlugin]);

  const openPluginsMenu = useCallback(() => {
    setIsModalOpen(true);
    showModal(
      activePlugin && activeSubPlugin
        ? getPluginTypeNameById(activePlugin, activeSubPlugin)
        : activePlugin
          ? getPluginNameById(activePlugin)
          : 'Go Plugins',
      (onClose) => {
        const handleModalClose = () => {
          setIsModalOpen(false);
          onClose();
        };

        return <GoPluginsMenuDialog activeEditor={activeEditor} onClose={handleModalClose} />;
      },
      'h-fit',
      activePlugin ? <ArrowLeft onClick={handleBackClick} className='cursor-pointer' /> : null,
    );
  }, [showModal, activePlugin, activeSubPlugin, handleBackClick, activeEditor]);

  // This effect will re-render the modal when activePlugin changes
  useEffect(() => {
    if (isModalOpen) {
      // Close and reopen the modal to update the leading icon
      openPluginsMenu();
    }
  }, [activePlugin, isModalOpen, openPluginsMenu]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size='sm' variant='ghost' onClick={openPluginsMenu} className='flex-shrink-0'>
            <img src='/assets/images/logo.png' alt='gonasi' className='h-4 w-4 object-cover' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Go Plugins Menu</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
