import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  TrueOrFalseContentSchema,
  type TrueOrFalseContentSchemaType,
} from '@gonasi/schemas/plugins';

import type { EditPluginComponentProps } from '../../EditPluginTypesRenderer';

import { Button } from '~/components/ui/button';
import { ErrorList, RadioButtonField, TextareaField } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { useIsPending } from '~/utils/misc';

export function EditTrueOrFalsePlugin({ block }: EditPluginComponentProps) {
  const isPending = useIsPending();

  const blockContent = block.content as TrueOrFalseContentSchemaType;

  console.log('block: ', block);

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-form`,
    constraint: getZodConstraint(TrueOrFalseContentSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    defaultValue: {
      ...blockContent,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TrueOrFalseContentSchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <HoneypotInputs />

      <RichTextInputField
        labelProps={{ children: 'Question', required: true }}
        meta={fields.questionState as FieldMetadata<string>}
        placeholder='Type the true or false statement here'
        errors={fields.questionState.errors}
        description='The main statement students will evaluate as true or false.'
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
      <RichTextInputField
        labelProps={{ children: 'Explanation', required: true }}
        meta={fields.explanationState as FieldMetadata<string>}
        placeholder='Explain the reasoning behind the answer'
        errors={fields.explanationState?.errors}
        description='Help learners understand the logic or facts that support the answer.'
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
      <ErrorList errors={form.errors} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button
          type='submit'
          rightIcon={<Save />}
          disabled={isPending}
          isLoading={isPending}
          name='intent'
          value={block.plugin_type}
        >
          Save
        </Button>
      </div>
    </Form>
  );
}
