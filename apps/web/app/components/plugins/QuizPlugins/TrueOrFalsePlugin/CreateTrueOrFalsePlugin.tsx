import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { type PluginTypeId, TrueOrFalseContentSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import {
  ErrorList,
  RadioButtonField,
  RichTextFieldWrapper,
  TextareaField,
} from '~/components/ui/forms';
import { useIsPending } from '~/utils/misc';

interface CreateTrueOrFalsePluginProps {
  pluginTypeId: PluginTypeId;
}

export function CreateTrueOrFalsePlugin({ pluginTypeId }: CreateTrueOrFalsePluginProps) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: `create-${pluginTypeId}-form`,
    constraint: getZodConstraint(TrueOrFalseContentSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TrueOrFalseContentSchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <HoneypotInputs />

      <RichTextFieldWrapper
        fieldMeta={fields.questionState as FieldMetadata<string>}
        label='Question'
        placeholder='Type the true or false statement here'
        description='The main statement students will evaluate as true or false.'
        required
      />

      <RadioButtonField
        field={fields.correctAnswer}
        labelProps={{ children: 'Choose the correct answer', required: true }}
        options={[
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ]}
        errors={fields.correctAnswer.errors}
        description='Answer that is correct'
      />

      <RichTextFieldWrapper
        fieldMeta={fields.explanationState as FieldMetadata<string>}
        label='Explanation'
        placeholder='Explain the reasoning behind the answer'
        description='Help learners understand the logic or facts that support the answer.'
        required
      />

      <TextareaField
        labelProps={{ children: 'Hint' }}
        textareaProps={{
          ...getInputProps(fields.hint, { type: 'text' }),
          placeholder: 'Optional hint to guide learners',
        }}
        errors={fields.hint?.errors}
        description='Give learners a nudge or context clue (optional).'
      />

      <ErrorList errors={Object.values(form.allErrors).flat()} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button
          type='submit'
          rightIcon={<Save />}
          disabled={isPending}
          isLoading={isPending}
          name='intent'
          value={pluginTypeId}
        >
          Save
        </Button>
      </div>
    </Form>
  );
}
