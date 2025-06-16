import { Controller, get } from 'react-hook-form';
import { NavLink } from 'react-router';
import type { DOMNode, Element as DomElement, HTMLReactParserOptions } from 'html-react-parser';
import parse, { domToReact } from 'html-react-parser';
import { Check, CircleX, ExternalLink, LoaderCircle } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';

import { cn } from '~/lib/utils';

interface GoValidationCheckFieldProps {
  name: string;
  disabled?: boolean;
  className?: string;
  fixLink?: string;
  loading?: boolean;
}

const options: HTMLReactParserOptions = {
  replace: (domNode: DOMNode) => {
    if (domNode.type === 'tag' && (domNode as DomElement).name === 'span') {
      const el = domNode as DomElement;
      return (
        <span className='bg-danger/10 rounded-sm px-1 py-0.5 font-medium'>
          {domToReact(el.children as unknown as DOMNode[], options)}
        </span>
      );
    }

    return undefined;
  },
};

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
                  'font-secondary flex items-center justify-between py-0.5 pl-4',
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
                      {parse(error?.message ?? '', options)}
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
