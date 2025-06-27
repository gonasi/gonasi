import { Form, useOutletContext } from 'react-router';
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
  const isPending = useIsPending();
  const {
    username: defaultUsername,
    fullName: defaultFullName,
    email,
  } = useOutletContext<ProfileOutletContext>();

  const methods = useRemixForm<UpdatePersonalInformationSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { updateType: 'personal-information' },
    defaultValues: {
      username: defaultUsername,
      fullName: defaultFullName,
      updateType: 'personal-information',
    },
  });

  const isFormDisabled = isPending || methods.formState.isSubmitting;
  const closeActionRoute = `/go/${params.username}/settings/profile-information`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Personal Information' closeRoute={closeActionRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit} action={closeActionRoute}>
              <HoneypotInputs />

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
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
