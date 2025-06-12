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
}

export interface SelectOptionProps {
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

interface GoSelectInputFieldProps {
  name: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  description?: string;
  className?: string;
  disabled?: boolean;
  selectProps: SelectOptionProps;
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

  const { options, placeholder = 'Select an option...' } = selectProps;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={className}>
          <Label htmlFor={name} error={hasError} {...labelProps} />
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
            disabled={disabled}
          >
            <SelectTrigger className='h-12 w-full' error={error} disabled={disabled}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
      )}
    />
  );
}
