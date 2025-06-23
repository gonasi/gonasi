import type { PropsWithChildren, ReactNode } from 'react';

import { AppLogo } from '~/components/app-logo';
import { BackArrowNavLink } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface Props extends PropsWithChildren {
  backLink: string;
  title: string;
  navigation?: ReactNode;
  border?: boolean;
  rightComponent?: React.ReactNode;
  thumbnail?: React.ReactNode;
}

export function PlainLayout({
  children,
  backLink,
  title,
  navigation,
  border = true,
  rightComponent,
  thumbnail,
}: Props) {
  return (
    <div className={cn('flex flex-col space-y-4 p-4 md:space-y-8')}>
      <div className='hidden w-full items-center justify-center md:flex'>
        <AppLogo />
      </div>

      <div className='bg-background sticky top-0 z-10 mb-2 pt-2'>
        <div className='flex w-full items-center justify-between'>
          <div className='flex w-full items-center justify-between'>
            <div className='flex items-center space-x-2 md:space-x-4'>
              <BackArrowNavLink to={backLink} />
              {thumbnail ? thumbnail : null}
              <h3 className='text-header mt-1 line-clamp-1 text-lg md:text-xl'>{title}</h3>
            </div>
            {rightComponent ? <div className='flex-shrink-0'>{rightComponent}</div> : null}
          </div>
        </div>
        {navigation && navigation}
      </div>
      <div
        className={cn(
          'border-card border-0 md:border',
          'rounded-md px-0 py-4 shadow-none md:px-4',
          {
            'rounded-none border-0 px-0 md:border-0 md:px-0': !border,
          },
        )}
      >
        {children}
      </div>
    </div>
  );
}
