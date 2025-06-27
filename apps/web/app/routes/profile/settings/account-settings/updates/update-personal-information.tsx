import { useEffect, useRef } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash.debounce';
import { LoaderCircle } from 'lucide-react';
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
  const usernameCheckFetcher = useFetcher();
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
    fetcher,
    submitData: { updateType: 'personal-information' },
    defaultValues: {
      username: defaultUsername,
      fullName: defaultFullName,
      updateType: 'personal-information',
    },
    submitConfig: {
      method: 'POST',
      action: closeActionRoute,
      replace: false,
    },
  });

  const username = methods.watch('username');

  const debouncedCheckRef = useRef(
    debounce((uname: string) => {
      usernameCheckFetcher.load(`/api/check-username-exists?username=${uname}`);
    }, 300),
  );

  // Trigger debounced username check
  useEffect(() => {
    if (!username || username.length < 3) return;

    const debouncedFn = debouncedCheckRef.current;
    debouncedFn(username);

    return () => {
      debouncedFn.cancel();
    };
  }, [username]);

  // Handle username availability response
  useEffect(() => {
    if (!usernameCheckFetcher.data) return;

    const isUsernameTaken = usernameCheckFetcher.data.exists;
    const currentError = methods.formState.errors.username;

    if (isUsernameTaken && !currentError) {
      methods.setError('username', {
        type: 'manual',
        message: 'This username is already taken.',
      });
    } else if (!isUsernameTaken && currentError?.type === 'manual') {
      methods.clearErrors('username');
    }
  }, [usernameCheckFetcher.data, methods]);

  const isFormDisabled = isPending || methods.formState.isSubmitting || fetcher.state !== 'idle';

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Personal Information' closeRoute={closeActionRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <form onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <div className='border-input bg-input/20 text-muted-foreground mb-6 rounded-lg border p-3 italic hover:cursor-not-allowed'>
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
                labelProps={{
                  children: 'Username',
                  required: true,
                  endAdornment:
                    usernameCheckFetcher.state !== 'idle' ? (
                      <LoaderCircle size={12} className='animate-spin' />
                    ) : null,
                }}
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
