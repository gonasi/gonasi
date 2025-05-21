import type { ComponentProps, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { Badge } from '../badge';

import { cn } from '~/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ContentProps {
  children: ReactNode;
  title?: string;
  size?: ModalSize;
  className?: string;
}

const Modal = (props: ComponentProps<typeof Dialog.Root>) => {
  return <Dialog.Root {...props} />;
};

const Content = ({ children, title = '', size = 'md', className }: ContentProps) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    full: 'min-w-full min-h-full rounded-none',
  };

  return (
    <Dialog.Portal forceMount>
      <AnimatePresence>
        <Dialog.Overlay asChild>
          <motion.div
            key='overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('bg-card/80 fixed inset-0 z-50')}
          />
        </Dialog.Overlay>

        <div
          className={cn('fixed inset-0 z-50 flex h-screen items-center justify-center px-4', {
            'px-0': size === 'full',
          })}
        >
          <Dialog.Content asChild onPointerDownOutside={(e) => e.preventDefault()}>
            <motion.div
              key='modal'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'border-card bg-background font-mont max-h-screen w-full overflow-hidden overflow-y-auto rounded-lg border shadow-sm',
                sizeClasses[size],
                'max-h-[96%]',
                className,
              )}
              aria-describedby={undefined}
            >
              <div className={cn({ 'container mx-auto': size === 'full' })}>
                <Dialog.Title asChild>
                  <h1>{title}</h1>
                </Dialog.Title>
                {children}
              </div>
            </motion.div>
          </Dialog.Content>
        </div>
      </AnimatePresence>
    </Dialog.Portal>
  );
};

const Header = ({
  leadingIcon,
  title,
  subTitle,
  hasClose = true,
}: {
  leadingIcon?: React.ReactNode;
  title?: string;
  subTitle?: string;
  hasClose?: boolean;
}) => {
  return (
    <div className='bg-background sticky top-0 z-10 flex items-center justify-between p-4'>
      <div className='flex flex-1 items-center gap-2'>
        {leadingIcon ?? null}
        {title ? (
          <div className='flex w-full items-center justify-between'>
            <h2 className='line-clamp-1 text-lg font-semibold text-ellipsis'>{title}</h2>
            {subTitle ? (
              <Badge variant='outline' className='font-secondary mr-4 hidden text-sm md:flex'>
                {subTitle}
              </Badge>
            ) : (
              <div />
            )}
          </div>
        ) : (
          <div />
        )}
      </div>

      {hasClose ? (
        <Dialog.Close asChild className='hover:cursor-pointer'>
          <X size={26} />
        </Dialog.Close>
      ) : null}
    </div>
  );
};

const Body = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={cn('px-4 pt-2 pb-4', className)}>{children}</div>;
};

const Footer = ({ children }: { children: ReactNode }) => {
  return (
    <div className='border-card bg-background/95 fixed bottom-0 left-0 z-10 max-h-fit w-full border p-4 shadow-lg'>
      {children}
    </div>
  );
};

Modal.Trigger = Dialog.Trigger;
Modal.Header = Header;
Modal.Body = Body;
Modal.Content = Content;
Modal.Footer = Footer;

export { Modal };
