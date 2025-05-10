import type { ReactNode } from 'react';
import { useId } from 'react';
import { useInputControl } from '@conform-to/react';
import { Info } from 'lucide-react';

import { Checkbox, type CheckboxProps } from '../checkbox';
import type { InputProps } from '../input';
import { Input } from '../input';
import type { LabelProps } from '../label';
import { Label } from '../label';
import type { SearchableDropdownProps } from '../searchable-dropdown';
import { SearchableDropdown } from '../searchable-dropdown';
import type { TextareaProps } from '../textarea';
import { Textarea } from '../textarea';

import { cn } from '~/lib/utils';

export type ListOfErrors = (string | null | undefined)[] | null | undefined;

export const hasErrors = (listOfErrors: ListOfErrors) => {
  return Array.isArray(listOfErrors) && listOfErrors.some((error) => error);
};

export function ErrorList({ id, errors }: { errors?: ListOfErrors; id?: string }) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className='flex flex-col gap-1 px-3'>
      {errorsToRender.map((e) => (
        <li key={e} className='font-secondary text-danger text-xs'>
          {e}
        </li>
      ))}
    </ul>
  );
}

export function FormDescription({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className={cn('text-muted-foreground flex items-center pt-1 text-[0.8rem]')}>
      <Info className='h-6 w-6 pr-2' /> <span className='pt-1'>{children}</span>
    </p>
  );
}

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
  description,
  prefix,
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  inputProps: Omit<InputProps, 'error' | 'aria-invalid' | 'aria-describedby'>;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
  prefix?: string;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = `${id}-description`;
  const err = hasErrors(errors);

  return (
    <div className={className}>
      <Label htmlFor={id} error={err} {...labelProps} />
      <div className='flex w-full items-center'>
        {prefix ? (
          <span className='bg-muted font-secondary mr-2 flex h-12 flex-shrink-0 items-center justify-center rounded-md px-2'>
            {prefix}
          </span>
        ) : null}
        <Input
          wrapperClass='flex-grow min-w-0'
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          error={err}
          {...inputProps}
        />
      </div>

      <div className='min-h-[32px] pt-1 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
  description,
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  textareaProps: Omit<TextareaProps, 'error' | 'aria-invalid' | 'aria-describedby'>;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
}) {
  const fallbackId = useId();
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = `${id}-description`;
  const err = hasErrors(errors);

  return (
    <div className={className}>
      <Label htmlFor={id} error={err} {...labelProps} />
      <Textarea
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        error={err}
        {...textareaProps}
      />
      <div className='min-h-[32px] pt-1 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

export function SearchDropdownField({
  labelProps,
  searchDropdownProps,
  errors,
  className,
  description,
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  searchDropdownProps: SearchableDropdownProps;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
}) {
  const fallbackId = useId();
  const id = fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = `${id}-description`;
  const err = hasErrors(errors);

  return (
    <div className={className}>
      <Label htmlFor={id} error={err} {...labelProps} />
      <SearchableDropdown
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        error={err}
        {...searchDropdownProps}
      />
      <div className='min-h-[32px] pt-1 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
  className,
  description,
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  buttonProps: CheckboxProps & {
    name: string;
    form: string;
    value?: string;
  };
  errors?: ListOfErrors;
  className?: string;
  description?: string;
}) {
  const { key, defaultChecked, ...checkboxProps } = buttonProps;
  const fallbackId = useId();
  const checkedValue = buttonProps.value ?? 'on';
  const input = useInputControl({
    key,
    name: buttonProps.name,
    formId: buttonProps.form,
    initialValue: defaultChecked ? checkedValue : undefined,
  });
  const id = buttonProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = `${id}-description`;
  const err = hasErrors(errors);

  return (
    <div className={className}>
      <div className='flex gap-2'>
        <Checkbox
          {...checkboxProps}
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          checked={input.value === checkedValue}
          onCheckedChange={(state) => {
            input.change(state.valueOf() ? checkedValue : '');
            buttonProps.onCheckedChange?.(state);
          }}
          onFocus={(event) => {
            input.focus();
            buttonProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            input.blur();
            buttonProps.onBlur?.(event);
          }}
          type='button'
        />
        <Label
          htmlFor={id}
          error={err}
          {...labelProps}
          className='text-body-xs text-muted-foreground self-center'
        />
      </div>
      <div className='min-h-[32px] pt-0 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}
