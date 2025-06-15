import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { Switch } from '../../switch';
import { FormDescription } from './Common';

interface GoSwitchFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  disabled?: boolean;
}

export function GoSwitchField({
  name,
  description,
  className,
  labelProps,
  disabled = false,
}: GoSwitchFieldProps) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

  const id = name;
  const descriptionId = `${id}-description`;
  const error = errors[name];
  const hasError = !!error;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={className}>
          <div className='flex items-center space-x-2'>
            <Switch
              id={id}
              disabled={disabled}
              aria-invalid={hasError}
              aria-describedby={description ? descriptionId : undefined}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
              }}
              error={hasError}
            />
            <Label htmlFor={id} error={hasError} {...labelProps} />
          </div>
          <div className='-mt-1 min-h-[32px] pb-3'>
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>
        </div>
      )}
    />
  );
}
