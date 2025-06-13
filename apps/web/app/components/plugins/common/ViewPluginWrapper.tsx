import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, RotateCcw, Weight } from 'lucide-react';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Badge } from '~/components/ui/badge';
import { BlockActionButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { IconTooltipButton } from '~/components/ui/tooltip';
import { useStore } from '~/store';

export interface ViewPluginWrapperProps {
  children: ReactNode;
  isComplete?: boolean;
  playbackMode?: 'inline' | 'standalone';
  weight: number;
  mode: 'preview' | 'play';
  reset?: () => void;
}

export function ViewPluginWrapper({
  children,
  isComplete = false,
  playbackMode = 'inline',
  weight,
  mode,
  reset = () => {},
}: ViewPluginWrapperProps) {
  const [open, setOpen] = useState(true);
  const { isExplanationBottomSheetOpen, storeExplanationState, closeExplanation } = useStore();
  const isStandalone = playbackMode === 'standalone';

  const animatedContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );

  let content: ReactNode;

  if (mode === 'preview') {
    content = (
      <div>
        <div className='flex w-full items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Badge className='text-xs' variant='outline'>
              <LayoutTemplate />
              {playbackMode}
            </Badge>
            <Badge className='text-xs' variant='outline'>
              <Weight />
              {weight}
            </Badge>
          </div>
          {isComplete ? (
            <IconTooltipButton title='Reset' icon={RotateCcw} onClick={() => reset()} />
          ) : null}
        </div>
        {animatedContent}
      </div>
    );
  } else if (!open && isStandalone) {
    content = (
      <BlockActionButton onClick={() => setOpen(true)} loading={false} isLastBlock={false} />
    );
  } else if (isStandalone && !isComplete) {
    content = (
      <Modal open={open} onOpenChange={(newOpen) => newOpen || setOpen(false)}>
        <Modal.Content size='full'>
          <Modal.Header title='' />
          <Modal.Body className='mx-auto max-w-xl'>{animatedContent}</Modal.Body>
        </Modal.Content>
      </Modal>
    );
  } else {
    content = animatedContent;
  }

  return (
    <div>
      {content}
      <Sheet open={isExplanationBottomSheetOpen} onOpenChange={() => closeExplanation()}>
        <SheetContent
          side='bottom'
          className='bg-card/96 mx-auto flex max-h-[85vh] min-h-[25vh] max-w-xl flex-col gap-0 space-y-0 rounded-t-xl border-0 shadow-xs'
        >
          <SheetHeader className='flex-shrink-0'>
            <SheetTitle className='text-lg'>Explanation</SheetTitle>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-4'>
            <SheetDescription />
            <RichTextRenderer editorState={storeExplanationState} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
