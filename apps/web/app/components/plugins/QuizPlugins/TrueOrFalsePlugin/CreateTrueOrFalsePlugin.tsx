import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

// Schema for the True/False quiz plugin
const TrueOrFalseSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  correctAnswer: z.enum(['true', 'false'], {
    required_error: 'Correct answer is required',
  }),
  explanation: z.string().optional(),
});

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
    id: `${name}-form`,
    constraint: getZodConstraint(TrueOrFalseSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TrueOrFalseSchema });
    },
    onSubmit(event, { formData }) {
      event.preventDefault();

      if (form.errors?.length) return;

      fetcher.submit(formData, {
        method: 'post',
      });
    },
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} className='space-y-6' noValidate>
      <HoneypotInputs />

      <div className='space-y-2'>
        <RadioGroup name='correctAnswer' className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='true' id='true-option' />
            <label htmlFor='true-option'>True</label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='false' id='false-option' />
            <label htmlFor='false-option'>False</label>
          </div>
        </RadioGroup>
        {fields.correctAnswer.errors?.map((error) => (
          <p key={error} className='text-sm text-red-500'>
            {error}
          </p>
        ))}
        <p className='text-muted-foreground text-sm'>
          Select the correct answer for this statement
        </p>
      </div>

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
    </form>
  );
}
