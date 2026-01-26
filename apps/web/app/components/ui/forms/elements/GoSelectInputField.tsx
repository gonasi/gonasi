import { Controller, get } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../select';
import { ErrorDisplay, FormDescription } from './Common';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  imageUrl?: string;
  status?: string;
}

interface GoSelectInputFieldProps {
  name: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  description?: string;
  className?: string;
  disabled?: boolean;
  selectProps: SelectOptionProps;
}

export interface SelectOptionProps {
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  imageContainerClassName?: string;
  imageClassName?: string;
}

export function GoSelectInputField({
  name,
  labelProps,
  description,
  className,
  disabled,
  selectProps,
}: GoSelectInputFieldProps) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const {
    options,
    placeholder = 'Select an option...',
    imageContainerClassName = 'h-5 w-5 rounded-full',
    imageClassName = 'h-full w-full rounded-full object-cover',
  } = selectProps;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedOption = options.find((opt) => opt.value === field.value);

        return (
          <div className={className}>
            <Label htmlFor={name} error={hasError} {...labelProps} />
            <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
              <SelectTrigger className='h-12 w-full' error={error} disabled={disabled}>
                <SelectValue placeholder={placeholder}>
                  {selectedOption ? (
                    <div className='flex items-center gap-2'>
                      {selectedOption.imageUrl && (
                        <div className={imageContainerClassName}>
                          <img
                            src={selectedOption.imageUrl}
                            alt={selectedOption.label}
                            className={imageClassName}
                          />
                        </div>
                      )}
                      <span>{selectedOption.label}</span>
                    </div>
                  ) : (
                    placeholder
                  )}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.status === 'not active'}
                    >
                      <div className='flex flex-col gap-0.5 py-1'>
                        <div className='flex items-center gap-2'>
                          {option.imageUrl && (
                            <div className={imageContainerClassName}>
                              <img
                                src={option.imageUrl}
                                alt={option.label}
                                className={imageClassName}
                              />
                            </div>
                          )}
                          <span className='font-medium'>{option.label}</span>
                        </div>
                        {option.description && (
                          <span className='text-muted-foreground text-xs leading-snug'>
                            {option.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

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
