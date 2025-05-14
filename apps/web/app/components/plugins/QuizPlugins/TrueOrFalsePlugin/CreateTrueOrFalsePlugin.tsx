import { useEffect, useState } from 'react';
import { Form, useFetcher } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { type PluginTypeId, TrueOrFalseSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { ErrorList, RadioButtonField, TextareaField } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';

interface CreateTrueOrFalsePluginProps {
  name: PluginTypeId;
}

export function CreateTrueOrFalsePlugin({ name }: CreateTrueOrFalsePluginProps) {
  const fetcher = useFetcher();
  const [loading, setLoading] = useState(false);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const [form, fields] = useForm({
    id: `create-${name}-form`,
    constraint: getZodConstraint(TrueOrFalseSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TrueOrFalseSchema });
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
          disabled={loading}
          isLoading={loading}
          name='intent'
          value={name}
        >
          Save
        </Button>
      </div>
    </Form>
  );
}
