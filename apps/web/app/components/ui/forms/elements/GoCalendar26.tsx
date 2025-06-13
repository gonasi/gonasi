import { useState } from 'react';
import { Controller, get } from 'react-hook-form';
import { ChevronDownIcon } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';

import { Button } from '../../button';
import { Calendar } from '../../calendar';
import { Input } from '../../input';
import { Label, type LabelProps } from '../../label';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover';
import { ErrorDisplay, FormDescription } from './Common';

import { cn } from '~/lib/utils';

interface GoCalendar26Props {
  name: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function GoCalendar26({
  name,
  labelProps,
  description,
  className,
  disabled,
}: GoCalendar26Props) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const [openFrom, setOpenFrom] = useState(false);

  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date('2025-06-01'));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn('w-full', className)}>
          <div className='flex space-x-4'>
            <div className='flex-1'>
              <Label htmlFor={name} error={hasError} {...labelProps} />
              <Popover open={openFrom} onOpenChange={setOpenFrom}>
                <PopoverTrigger asChild>
                  <Button
                    id={field.name}
                    className={cn(
                      'border-input font-secondary w-full justify-between border bg-transparent font-normal',
                      'text-foreground',
                      hasError && 'border-danger',
                    )}
                    rightIcon={<ChevronDownIcon />}
                    rightIconAtEdge
                    childrenAlign='left'
                  >
                    {dateFrom
                      ? dateFrom.toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={dateFrom}
                    captionLayout='dropdown'
                    className='font-secondary'
                    onSelect={(date) => {
                      setDateFrom(date);
                      setOpenFrom(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='pt-7.5'>
              <Input
                type='time'
                id='time-from'
                step='1'
                defaultValue='10:30:00'
                className={cn(
                  'bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
                  'w-22',
                )}
              />
            </div>
          </div>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && (
              <FormDescription id={`${name}-description`}>{description}</FormDescription>
            )}
          </div>
        </div>
      )}
    />
  );
}
