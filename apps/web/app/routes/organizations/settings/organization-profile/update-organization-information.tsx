import { useEffect, useRef } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash.debounce';
import { LoaderCircle } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  UpdateOrganizationInformationSchema,
  type UpdateOrganizationInformationSchemaTypes,
} from '@gonasi/schemas/organizations/settings/profile';

import type { Route } from './+types/update-organization-information';
import type { loader as organizationLoader } from './organization-profile-index';

import { Button } from '~/components/ui/button';
import { GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(UpdateOrganizationInformationSchema);

export default function UpdateOrganizationInformation({ params }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const handleCheckFetcher = useFetcher();
  const isPending = useIsPending();

  const { data } = useOutletContext<{
    data: Awaited<ReturnType<typeof organizationLoader>>;
  }>();

  const closeActionRoute = `/${params.organizationId}/settings/organization-profile`;

  const methods = useRemixForm<UpdateOrganizationInformationSchemaTypes>({
    mode: 'all',
    resolver,
    fetcher,
    defaultValues: {
      updateType: 'organization-information',
      organizationId: params.organizationId,
      name: data?.name,
      handle: data?.handle,
      description: data?.description ?? '',
      websiteUrl: data?.website_url,
    },
    submitConfig: {
      method: 'POST',
      action: closeActionRoute,
      replace: false,
    },
  });

  const handle = methods.watch('handle');

  const debouncedCheckRef = useRef(
    debounce((value: string) => {
      handleCheckFetcher.load(`/api/check-handle-exists/${params.organizationId}?handle=${value}`);
    }, 300),
  );

  useEffect(() => {
    if (!handle || handle.length < 3) return;

    const check = debouncedCheckRef.current;
    check(handle);

    return () => {
      check.cancel();
    };
  }, [handle]);

  useEffect(() => {
    if (!handleCheckFetcher.data) return;

    const isTaken = handleCheckFetcher.data.exists;
    const currentError = methods.formState.errors.handle;

    if (isTaken && !currentError) {
      methods.setError('handle', {
        type: 'manual',
        message: 'This handle is already taken.',
      });
    } else if (!isTaken && currentError?.type === 'manual') {
      methods.clearErrors('handle');
    }
  }, [handleCheckFetcher.data, methods]);

  const isFormDisabled = isPending || methods.formState.isSubmitting || fetcher.state !== 'idle';

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Organization Profile' closeRoute={closeActionRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <form onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <GoInputField
                name='name'
                labelProps={{ children: 'Organization Name', required: true }}
                inputProps={{
                  autoFocus: true,
                  disabled: isFormDisabled,
                }}
                description='This will appear publicly on your organization’s profile.'
              />

              <GoInputField
                name='handle'
                labelProps={{
                  children: 'Handle',
                  required: true,
                  endAdornment:
                    handleCheckFetcher.state !== 'idle' ? (
                      <LoaderCircle size={12} className='animate-spin' />
                    ) : null,
                }}
                inputProps={{
                  className: 'lowercase',
                  disabled: isFormDisabled,
                }}
                description='Unique identifier used in your organization’s public URL.'
              />

              <GoTextAreaField
                name='description'
                labelProps={{ children: 'About the Organization' }}
                textareaProps={{
                  placeholder: 'Share your mission, goals, or what makes your organization unique.',
                }}
                description='Displayed on your public profile to help users understand your organization.'
              />

              <GoInputField
                name='websiteUrl'
                labelProps={{ children: 'Website URL', required: true }}
                inputProps={{
                  disabled: isFormDisabled,
                }}
                description='Link to your organization’s website. This will be shown on your profile.'
              />

              <Button
                type='submit'
                disabled={
                  isPending || !methods.formState.isDirty || handleCheckFetcher.state !== 'idle'
                }
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
