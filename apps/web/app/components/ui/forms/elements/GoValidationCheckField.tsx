import { Controller, get } from 'react-hook-form';
import { NavLink } from 'react-router';
import { Check, CircleX, ExternalLink, LoaderCircle } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';

import GoParsedContent from './GoParsedContent';

import { cn } from '~/lib/utils';

interface GoValidationCheckFieldProps {
  name: string;
  disabled?: boolean;
  className?: string;
  fixLink?: string;
  loading?: boolean;
}

export function GoValidationCheckField({
  name,
  disabled = false,
  className,
  fixLink,
  loading,
}: GoValidationCheckFieldProps) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

  const error = get(errors, name);
  const hasError = !!error;

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div>
          {hasError && fixLink ? (
            <NavLink
              to={fixLink}
              className={({ isPending }) =>
                cn(
                  'font-secondary flex items-center justify-between px-4 py-2',
                  fixLink && 'hover:underline',
                  hasError && 'text-danger',
                  !hasError && 'text-success',
                  disabled && 'opacity-50 hover:cursor-not-allowed',
                  isPending && 'animate-pulse cursor-not-allowed opacity-50',
                  className,
                )
              }
            >
              {({ isPending }) => (
                <div>
                  <div className='flex items-start space-x-2'>
                    <div className='pt-1'>
                      {loading || isPending ? (
                        <LoaderCircle size={16} className='flex-shrink-0 animate-spin' />
                      ) : hasError ? (
                        <CircleX size={16} className='text-danger flex-shrink-0' />
                      ) : (
                        <Check size={16} className='text-success flex-shrink-0' />
                      )}
                    </div>
                    <p>
                      <GoParsedContent html={error?.message ?? ''} variant='overview' />
                      {hasError && fixLink && <ExternalLink size={12} className='-mt-4 inline' />}
                    </p>
                  </div>
                </div>
              )}
            </NavLink>
          ) : null}
        </div>
      )}
    />
  );
}
