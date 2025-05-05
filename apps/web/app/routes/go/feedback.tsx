import { Form } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { FeedbackFormSchema } from '@gonasi/schemas/feedback';

import type { Route } from './+types/feedback';
import { submitUserFeedback } from '../../../../../shared/database/src/feedback/submitUserFeedback';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { ErrorList, RadioButtonField, TextareaField } from '~/components/ui/forms';
import { SliderField } from '~/components/ui/forms/SliderInputField';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: FeedbackFormSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await submitUserFeedback(supabase, {
    ...submission.value,
  });

  return success
    ? redirectWithSuccess(`/dashboard/change-team`, message)
    : dataWithError(null, message);
}

export default function Feedback() {
  const [form, fields] = useForm({
    id: 'new-course-chapter-form',
    constraint: getZodConstraint(FeedbackFormSchema),
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: FeedbackFormSchema }),
  });

  const isPending = useIsPending();

  return (
    <div className='mx-auto max-w-lg py-8'>
      <Card className='bg-background border-input w-full border'>
        <CardHeader>
          <CardTitle className='text-center text-2xl font-bold'>
            Help Us Make Gonasi Even Better
          </CardTitle>
          <CardDescription className='font-secondary text-center'>
            We&apos;d love your quick feedback! It will help us improve Go Nasi and shape what comes
            next. Takes only 2 minutes!
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <RadioButtonField
              labelProps={{
                children: 'How was your experience with Gonasi?',
                required: true,
              }}
              field={fields.experience}
              errors={fields.experience.errors}
              description=''
              options={[
                { value: 'Loved it', label: 'Loved it 🧡' },
                { value: 'It was okay', label: 'It was okay 👍' },
                { value: 'I struggled', label: 'I struggled 😕' },
              ]}
            />
            <TextareaField
              labelProps={{ children: 'What was the hardest part for you?', required: true }}
              textareaProps={{
                ...getInputProps(fields.hardestPart, { type: 'text' }),
                disabled: isPending,
              }}
              errors={fields.hardestPart?.errors}
              description='Tell us anything that felt confusing, annoying, or slow...'
            />
            <TextareaField
              labelProps={{ children: 'What did you enjoy the most?', required: true }}
              textareaProps={{
                ...getInputProps(fields.bestPart, { type: 'text' }),
                disabled: isPending,
              }}
              errors={fields.bestPart?.errors}
              description='Share something you liked or that made you happy!'
            />
            <SliderField
              labelProps={{ children: 'Would you recommend Gonasi to a friend?', required: true }}
              sliderProps={{
                name: 'npsScore',
                form: form.id,
                min: 0,
                max: 10,
                defaultValue: [5],
              }}
              description='0 = Not at all - 10 = Absolutely!'
            />
            <RadioButtonField
              labelProps={{
                children: 'Can we share your feedback publicly (like on our website)?',
                required: true,
              }}
              field={fields.shareFeedback}
              errors={fields.shareFeedback.errors}
              description=''
              options={[
                { value: 'Yes', label: 'Yes, you can share it' },
                { value: 'No', label: 'No, keep it private' },
              ]}
            />
            <ErrorList errors={form.errors} id={form.errorId} />
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Submit Feedback
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
