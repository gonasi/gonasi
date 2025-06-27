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
  const { username, fullName } = useOutletContext<ProfileOutletContext>();

  // Initialize form methods with Remix Hook Form
  const methods = useRemixForm<UpdatePersonalInformationSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { updateType: 'personal-information' },
    defaultValues: {
      username,
      fullName,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const closeRoute = `/go/${params.username}/settings/profile-information`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Update Personal Information' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              {/* Anti-bot honeypot field */}
              <HoneypotInputs />

              {/* Full name input field */}
              <GoInputField
                labelProps={{ children: 'Your Name', required: true }}
                name='fullName'
                inputProps={{
                  autoFocus: true,
                  disabled: isDisabled,
                }}
                description='Let us know who you are'
              />

              {/* Email input field */}
              <GoInputField
                labelProps={{ children: 'Username', required: true }}
                name='username'
                inputProps={{
                  className: 'lowercase',

                  disabled: isDisabled,
                }}
                description='We’ll use this to keep in touch'
              />

              {/* Submit button with loading state */}
              <Button type='submit' disabled={isPending} isLoading={isDisabled} className='w-full'>
                Save
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
