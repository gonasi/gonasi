import { useState } from 'react';
import { Controller, get } from 'react-hook-form';
import { ChevronDownIcon, X } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';

import { Button, IconTooltipButton } from '../../button';
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
  showClearButton?: boolean;
}

// Helper function to combine date and time into UTC timestamp
const combineDateTimeToUTC = (date: Date | undefined, time: string): string | null => {
  if (!date || !time) return null;

  // Create a new date object with the selected date
  const combined = new Date(date);

  // Parse the time string (HH:MM:SS format)
  const timeParts = time.split(':');
  const hours = parseInt(timeParts[0] || '0', 10);
  const minutes = parseInt(timeParts[1] || '0', 10);
  const seconds = parseInt(timeParts[2] || '0', 10);

  // Set the time components
  combined.setHours(hours, minutes, seconds, 0);

  // Return as UTC ISO string
  return combined.toISOString();
};

// Helper function to extract date and time from UTC timestamp
const extractDateTimeFromUTC = (
  utcString: string | null,
): { date: Date | undefined; time: string } => {
  if (!utcString) {
    return { date: undefined, time: '10:30:00' };
  }

  const date = new Date(utcString);
  const timeString = date.toTimeString().split(' ')[0];
  const time = timeString || '10:30:00'; // Fallback if split returns undefined

  return { date, time };
};

export function GoCalendar26({
  name,
  labelProps,
  description,
  className,
  disabled,
  showClearButton = false,
}: GoCalendar26Props) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const [openFrom, setOpenFrom] = useState(false);

  // Watch the field value to get current date and time
  const fieldValue = watch(name);
  const { date: currentDate, time: currentTime } = extractDateTimeFromUTC(fieldValue);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const handleDateChange = (date: Date | undefined) => {
          const utcTimestamp = combineDateTimeToUTC(date, currentTime);
          field.onChange(utcTimestamp);
          setOpenFrom(false);
        };

        const handleTimeChange = (time: string) => {
          const utcTimestamp = combineDateTimeToUTC(currentDate, time);
          field.onChange(utcTimestamp);
        };

        return (
          <div className={cn('w-full', className)}>
            <div className='flex space-x-4'>
              <div className='flex-1'>
                <Label htmlFor={name} error={hasError} {...labelProps} />
                <div className='relative'>
                  <Popover open={openFrom} onOpenChange={setOpenFrom}>
                    <PopoverTrigger asChild>
                      <Button
                        id={field.name}
                        type='button'
                        disabled={disabled}
                        className={cn(
                          'border-input font-secondary w-full justify-between border bg-transparent font-normal',
                          'text-foreground',
                          hasError && 'border-danger',
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                        rightIcon={<ChevronDownIcon />}
                        rightIconAtEdge
                        childrenAlign='left'
                      >
                        {currentDate
                          ? currentDate.toLocaleDateString('en-US', {
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
                        selected={currentDate}
                        captionLayout='dropdown'
                        className='font-secondary'
                        onSelect={handleDateChange}
                        disabled={disabled}
                      />
                    </PopoverContent>
                  </Popover>
                  {showClearButton && currentDate && (
                    <IconTooltipButton
                      disabled={disabled}
                      aria-label='Clear date'
                      className='absolute -top-2 -right-2 rounded-full px-0.5 py-0.5 disabled:cursor-not-allowed disabled:opacity-50'
                      onClick={() => field.onChange(null)}
                      title='Clear date'
                      icon={X}
                      size='fit'
                      variant='danger'
                    />
                  )}
                </div>
              </div>
              <div>
                <Label required>Time</Label>
                <Input
                  type='time'
                  id={`${name}-time`}
                  step='1'
                  value={currentTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={disabled}
                  className={cn(
                    'bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
                    'w-22',
                    hasError && 'border-danger',
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
        );
      }}
    />
  );
}
