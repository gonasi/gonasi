import { useFetcher, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  UpdatePersonalInformationSchema,
  type UpdatePersonalInformationSchemaTypes,
} from '@gonasi/schemas/settings';

import type { Route } from './+types/update-personal-information';
import type { ProfileOutletContext } from '../profile-information';

import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(UpdatePersonalInformationSchema);

export default function UpdatePersonalInformation({ params }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const isPending = useIsPending();

  const {
    username: defaultUsername,
    fullName: defaultFullName,
    email,
  } = useOutletContext<ProfileOutletContext>();

  const closeActionRoute = `/go/${params.username}/settings/profile-information`;

  const methods = useRemixForm<UpdatePersonalInformationSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { updateType: 'personal-information' },
    defaultValues: {
      username: defaultUsername,
      fullName: defaultFullName,
      updateType: 'personal-information',
    },
    fetcher, // Pass the fetcher to remix-hook-form
    submitConfig: {
      replace: false,
      method: 'POST',
      action: closeActionRoute,
    },
  });

  const isFormDisabled = isPending || methods.formState.isSubmitting || fetcher.state !== 'idle';

  // Handle errors from fetcher
  const actionData = fetcher.data;
  const hasErrors = actionData?.errors || actionData?.message;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Personal Information' closeRoute={closeActionRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <form onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              {/* Display action errors */}
              {actionData?.message && (
                <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700'>
                  {actionData.message}
                </div>
              )}

              <div className='text-muted-foreground border-input bg-input/20 mb-6 rounded-lg border p-3 italic hover:cursor-not-allowed'>
                {email}
              </div>

              <GoInputField
                name='fullName'
                labelProps={{ children: 'Full Name', required: true }}
                inputProps={{
                  autoFocus: true,
                  disabled: isFormDisabled,
                }}
                description='This will be displayed on your profile.'
              />

              <GoInputField
                name='username'
                labelProps={{ children: 'Username', required: true }}
                inputProps={{
                  className: 'lowercase',
                  disabled: isFormDisabled,
                }}
                description='Used in your public profile URL.'
              />

              <Button
                type='submit'
                disabled={isPending || !methods.formState.isDirty}
                isLoading={isFormDisabled}
              >
                Save Changes
              </Button>
            </form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
