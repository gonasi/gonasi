import React from 'react';
import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';

import { SignOutFormSchema, type SignOutFormSchemaTypes } from '@gonasi/schemas/auth';

import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(SignOutFormSchema);

interface ISignOutProps {
  signOutComponent: React.ReactElement<{ loading?: boolean }>;
}

export function SignOut({ signOutComponent }: ISignOutProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<SignOutFormSchemaTypes>({
    mode: 'all',
    resolver,
    submitConfig: {
      action: '/',
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <input type='hidden' {...methods.register('intent')} value='signout' />
        <button type='submit' style={{ all: 'unset' }} disabled={isDisabled}>
          {React.cloneElement(signOutComponent, { loading: isDisabled })}
        </button>
      </Form>
    </RemixFormProvider>
  );
}
