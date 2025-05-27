import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import type { z } from 'zod';

import { submitUserFeedback } from '@gonasi/database/feedback';
import { FeedbackFormSchema } from '@gonasi/schemas/feedback';

import type { Route } from './+types/feedback';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { GoRadioGroupField, GoSliderField, GoTextAreaField } from '~/components/ui/forms/elements';
import { GoInputField } from '~/components/ui/forms/elements/GoInputField';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(FeedbackFormSchema);
type FormData = z.infer<typeof FeedbackFormSchema>;

export const action = async ({ request }: Route.ActionArgs) => {
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<FormData>(request, resolver);
  if (errors) {
    // The keys "errors" and "defaultValues" are picked up automatically by useRemixForm
    return { errors, defaultValues };
  }

  const { supabase } = createClient(request);

  const { success, message } = await submitUserFeedback(supabase, {
    ...data,
  });

  return success
    ? redirectWithSuccess(`/dashboard/change-team`, message)
    : dataWithError(null, message);
};

export default function Feedback() {
  const isPending = useIsPending();

  const methods = useRemixForm<FormData>({
    mode: 'all',
    resolver,
  });

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
          <RemixFormProvider {...methods}>
            <form onSubmit={methods.handleSubmit} method='POST'>
              <HoneypotInputs />

              <GoRadioGroupField
                labelProps={{ children: 'How did this feel?', required: true }}
                name='experience'
                description='Give us the vibe check! 📚'
                options={[
                  { value: 'Loved it', label: 'Loved it 💖' },
                  { value: 'It was okay', label: 'It was okay 😐' },
                  { value: 'I struggled', label: 'I struggled 😵' },
                ]}
              />

              <GoTextAreaField
                labelProps={{ children: 'Toughest Bit', required: true }}
                name='hardestPart'
                textareaProps={{ placeholder: 'Where did things get tricky?' }}
                description='What tripped you up the most? Be honest—we want to fix it!'
              />

              <GoTextAreaField
                labelProps={{ children: 'Favorite Moment', required: true }}
                name='bestPart'
                textareaProps={{ placeholder: 'What made you smile?' }}
                description='Tell us what rocked 🙌'
              />

              <GoSliderField
                labelProps={{ children: 'How likely to recommend?', required: true }}
                name='npsScore'
                min={1}
                max={10}
                description="Slide to rate how likely you'd tell a friend about this 💬"
              />

              <GoRadioGroupField
                labelProps={{ children: 'Can we share your feedback?', required: true }}
                name='shareFeedback'
                description='Help others by letting us share your thoughts!'
                options={[
                  { value: 'Yes', label: 'Yes! Spread the word 📣' },
                  { value: 'No', label: 'Nope, keep it private 🔒' },
                ]}
              />

              <GoInputField
                labelProps={{ children: 'Email (optional)' }}
                name='email'
                description='Only if you want us to reach out for more high-fives 👋'
              />

              <Button type='submit' isLoading={isPending}>
                Send It 🚀
              </Button>
            </form>
          </RemixFormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
