import type { ComponentProps, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Badge } from '../badge';
import { CloseIconNavLink } from '../button';

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
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'bg-card/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50',
        )}
      />
      <div
        className={cn('fixed inset-0 z-50 flex h-screen items-center justify-center px-4', {
          'px-0': size === 'full',
        })}
      >
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          className={cn(
            'border-card bg-background font-mont max-h-screen w-full overflow-hidden overflow-y-auto rounded-lg border shadow-sm duration-200',
            sizeClasses[size],
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'max-h-[90%]',
            className,
          )}
          aria-describedby={undefined}
        >
          {/* Screen-reader accessible title */}
          <div
            className={cn({
              'container mx-auto': size === 'full',
            })}
          >
            <Dialog.Title asChild>
              <h1>{title}</h1>
            </Dialog.Title>
            {children}
          </div>
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  );
};

const Header = ({
  leadingIcon,
  title,
  subTitle,
  hasClose = true,
  closeRoute,
  settingsPopover,
}: {
  leadingIcon?: React.ReactNode;
  title?: string;
  subTitle?: string;
  hasClose?: boolean;
  closeRoute?: string;
  settingsPopover?: React.ReactNode;
}) => {
  return (
    <div className='bg-background/95 sticky top-0 z-10 flex items-center justify-between p-4'>
      <div className='flex flex-1 items-center gap-2'>
        {leadingIcon ?? null}
        {title ? (
          <div className='flex w-full items-center justify-between'>
            <h2 className='mt-1 line-clamp-1 text-lg font-semibold text-ellipsis'>{title}</h2>
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

      <div className='flex items-center space-x-2'>
        {settingsPopover ? settingsPopover : null}
        {closeRoute ? (
          <CloseIconNavLink to={closeRoute} />
        ) : hasClose ? (
          <Dialog.Close asChild className='hover:cursor-pointer'>
            <X size={22} />
          </Dialog.Close>
        ) : null}
      </div>
    </div>
  );
};

const Body = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={cn('px-4 pb-4', className)}>{children}</div>;
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
