import * as React from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { unstable_useControl as useControl } from '@conform-to/react';
import { Check, ChevronsUpDown } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';

export interface SearchableDropdownItem {
  description?: string;
  imageUrl?: string;
  value: string;
  label: string;
}

export interface SearchableDropdownProps {
  meta: FieldMetadata<string>;
  options: SearchableDropdownItem[];
  error?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  selectPlaceholder?: string;
  notFoundPlaceholder?: string;
  className?: string;
}

export function SearchableDropdown({
  meta,
  options = [],
  error,
  disabled,
  searchPlaceholder = 'Search for an option...',
  selectPlaceholder = 'Select an option...',
  notFoundPlaceholder = 'No options available',
  className,
}: SearchableDropdownProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const control = useControl(meta);
  const [triggerWidth, setTriggerWidth] = React.useState<number | null>(null);

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, []);

  const selectedOption = options.find((language) => language.value === control.value);

  return (
    <div>
      <input
        className='sr-only'
        aria-hidden
        tabIndex={-1}
        ref={control.register}
        name={meta.name}
        defaultValue={meta.initialValue}
        onFocus={() => {
          triggerRef.current?.focus();
        }}
        aria-label={meta.name}
      />
      <Popover open={open} onOpenChange={(isOpen) => !disabled && setOpen(isOpen)}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            role='combobox'
            aria-controls='command-list'
            aria-expanded={Boolean(open)}
            disabled={disabled}
            aria-label={meta.name}
            title={meta.name}
            className={cn(
              `bg-background flex ${selectedOption?.description ? 'h-20' : 'h-12'} w-full items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors`,
              'font-secondary text-foreground',
              'hover:bg-muted',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
              !control.value && 'text-muted-foreground',
              error ? 'border-danger text-danger' : 'border-input',
              disabled ? 'hover:bg-background cursor-not-allowed opacity-50' : 'cursor-pointer',
              className,
            )}
            onClick={(e) => disabled && e.preventDefault()} // Prevent click if disabled
          >
            <div className='flex w-full items-center justify-between'>
              <div className='flex items-center gap-2'>
                {control.value ? (
                  <>
                    {options.find((language) => language.value === control.value)?.imageUrl && (
                      <div className='border-border h-6 w-6 rounded-full border'>
                        <img
                          src={
                            options.find((language) => language.value === control.value)?.imageUrl
                          }
                          alt=''
                          className='h-full w-full rounded-full object-cover'
                        />
                      </div>
                    )}
                    <div className='flex flex-col space-y-1'>
                      <div className='text-left'>
                        {options.find((language) => language.value === control.value)?.label}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {options.find((language) => language.value === control.value)?.description}
                      </div>
                    </div>
                  </>
                ) : (
                  selectPlaceholder
                )}
              </div>
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className='p-0' style={{ width: triggerWidth ?? 'auto' }}>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList id='command-list'>
              <CommandEmpty>{notFoundPlaceholder}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    value={option.label}
                    key={option.value}
                    onSelect={() => {
                      control.change(option.value);
                      setOpen(false);
                    }}
                  >
                    <div className='flex w-full items-center justify-between'>
                      <div className='flex flex-col space-y-1'>
                        <div className='flex items-center space-x-2'>
                          {option.imageUrl && (
                            <img
                              src={option.imageUrl}
                              alt={option.label}
                              className='mr-2 h-5 w-5 rounded-full'
                            />
                          )}
                          {option.label}
                        </div>
                        {option.description ? (
                          <div className='text-muted-foreground text-xs'>{option.description}</div>
                        ) : null}
                      </div>

                      <Check
                        className={cn(
                          'h-4 w-4',
                          option.value === control.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
