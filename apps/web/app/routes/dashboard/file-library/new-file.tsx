import { Form } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { createFile } from '@gonasi/database/files';
import { NewFileLibrarySchema } from '@gonasi/schemas/file';

import type { Route } from './+types/new-file';

import { StepperFormLayout } from '~/components/layouts/stepper';
import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: NewFileLibrarySchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await createFile(supabase, {
    ...submission.value,
    companyId: params.companyId,
  });

  return success
    ? redirectWithSuccess(`/dashboard/${params.companyId}/file-library`, message)
    : dataWithError(null, message);
}

export default function NewFile({ actionData, params }: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: 'new-file-form',
    constraint: getZodConstraint(NewFileLibrarySchema),
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: NewFileLibrarySchema }),
  });

  const isPending = useIsPending();

  return (
    <StepperFormLayout
      closeLink={`/dashboard/${params.companyId}/file-library`}
      desktopTitle='Add file or media'
      mobileTitle='Add file or media'
      companyId={params.companyId}
    >
      <Form method='POST' encType='multipart/form-data' {...getFormProps(form)}>
        <Field
          labelProps={{ children: 'Upload File', required: true }}
          inputProps={{
            ...getInputProps(fields.file, { type: 'file' }),
            autoFocus: true,
            disabled: isPending,
          }}
          errors={fields.file?.errors}
          description='Choose a file to upload.'
        />
        <Field
          labelProps={{ children: 'File Name', required: true }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
            disabled: isPending,
          }}
          errors={fields.name?.errors}
          description='Enter a name for your file.'
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <Button type='submit' disabled={isPending} isLoading={isPending}>
          Save
        </Button>
      </Form>
    </StepperFormLayout>
  );
}
