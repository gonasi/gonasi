import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../command';
import { Label, type LabelProps } from '../../label';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover';
import { ErrorDisplay, FormDescription } from './Common';

import { cn } from '~/lib/utils';

export interface SearchableDropdownItem {
  description?: string;
  imageUrl?: string;
  value: string;
  label: string;
}

export interface SearchableDropdownProps {
  options: SearchableDropdownItem[];
  disabled?: boolean;
  searchPlaceholder?: string;
  selectPlaceholder?: string;
  notFoundPlaceholder?: string;
  className?: string;
}

interface GoSearchableDropDownProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  disabled?: boolean;
  searchDropdownProps: SearchableDropdownProps;
}

export function GoSearchableDropDown({
  name,
  description,
  className,
  labelProps,
  disabled,
  searchDropdownProps,
}: GoSearchableDropDownProps) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

  const id = name;
  const descriptionId = `${id}-description`;
  const error = errors[name];
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const {
    options,
    searchPlaceholder = 'Search for an option...',
    selectPlaceholder = 'Select an option...',
    notFoundPlaceholder = 'No options available',
  } = searchDropdownProps;

  const [open, setOpen] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedOption = options.find((option) => option.value === field.value);

        return (
          <div className={className}>
            <Label htmlFor={id} error={hasError} {...labelProps} />
            <Popover open={open} onOpenChange={(isOpen) => !disabled && setOpen(isOpen)}>
              <PopoverTrigger asChild>
                <button
                  role='combobox'
                  aria-controls='command-list'
                  aria-expanded={open}
                  disabled={disabled}
                  aria-label={name}
                  title={name}
                  className={cn(
                    `bg-background flex ${selectedOption?.description ? 'h-20' : 'h-12'} w-full items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors`,
                    'font-secondary text-foreground',
                    'hover:bg-muted',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
                    !field.value && 'text-muted-foreground',
                    hasError ? 'border-danger text-danger' : 'border-input',
                    disabled
                      ? 'hover:bg-background cursor-not-allowed opacity-50'
                      : 'cursor-pointer',
                  )}
                  onClick={(e) => {
                    if (disabled) {
                      e.preventDefault();
                      return;
                    }
                    e.stopPropagation();
                  }}
                >
                  <div className='flex w-full items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {field.value && selectedOption ? (
                        <>
                          {selectedOption.imageUrl && (
                            <div className='border-border h-6 w-6 rounded-full border'>
                              <img
                                src={selectedOption.imageUrl}
                                alt=''
                                className='h-full w-full rounded-full object-cover'
                              />
                            </div>
                          )}
                          <div className='flex flex-col space-y-1'>
                            <div className='text-left'>{selectedOption.label}</div>
                            {selectedOption.description && (
                              <div className='text-muted-foreground text-xs'>
                                {selectedOption.description}
                              </div>
                            )}
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
              <PopoverContent
                className='z-50 p-0'
                style={{ width: 'var(--radix-popover-trigger-width)' }}
                onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto focus which can cause issues in modals
                onInteractOutside={(e) => {
                  // Only close if clicking outside the popover content itself
                  const target = e.target as Element;
                  if (!target.closest('[data-radix-popover-content]')) {
                    setOpen(false);
                  }
                }}
              >
                <Command
                  onClick={(e) => e.stopPropagation()} // Prevent clicks inside from bubbling up
                >
                  <CommandInput
                    placeholder={searchPlaceholder}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent event bubbling
                    onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                    onFocus={(e) => e.stopPropagation()} // Prevent event bubbling
                  />
                  <CommandList
                    id='command-list'
                    onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
                  >
                    <CommandEmpty>{notFoundPlaceholder}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          value={option.label}
                          key={option.value}
                          onSelect={() => {
                            field.onChange(option.value);
                            setOpen(false);
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            field.onChange(option.value);
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
                              {option.description && (
                                <div className='text-muted-foreground text-xs'>
                                  {option.description}
                                </div>
                              )}
                            </div>
                            <Check
                              className={cn(
                                'h-4 w-4',
                                option.value === field.value ? 'opacity-100' : 'opacity-0',
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
            <div className='min-h-[32px] pt-1 pb-3'>
              {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
              {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
            </div>
          </div>
        );
      }}
    />
  );
}
