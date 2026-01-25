import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCohortsForCourse } from '@gonasi/database/cohorts';
import { inviteToCourse } from '@gonasi/database/courseInvites';
import {
  InviteToCourseSchema,
  type InviteToCourseSchemaTypes,
} from '@gonasi/schemas/courseInvites';

import type { Route } from './+types/new-invite';
import type { CourseInvitesPageLoaderData } from './invites-index';

import { Button, NavLinkButton } from '~/components/ui/button';
import { GoInputField, GoSelectInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Invite Learner • Gonasi' },
    {
      name: 'description',
      content:
        'Invite a new learner to your course on Gonasi and help them access your educational content.',
    },
  ];
}

const resolver = zodResolver(InviteToCourseSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { courseId } = params;

  if (!courseId) {
    return { cohorts: [] };
  }

  const cohorts = await fetchCohortsForCourse(supabase, courseId);

  return {
    cohorts: (cohorts ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Prevent bot submissions
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Invalid form data. Please check your inputs.');
  }

  const { supabase } = createClient(request);

  const result = await inviteToCourse(supabase, data);

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/builder/${params.courseId}/learners/invites`,
    `Invitation sent to ${data.email}`,
  );
}

export default function NewInvite({ params, loaderData }: Route.ComponentProps) {
  const outletContext = useOutletContext<CourseInvitesPageLoaderData>();
  const { canSendInvite } = outletContext;
  const { cohorts } = loaderData;

  const isPending = useIsPending();

  const methods = useRemixForm<InviteToCourseSchemaTypes>({
    mode: 'all',
    defaultValues: {
      publishedCourseId: params.courseId!,
      organizationId: params.organizationId,
      cohortId: null,
    },
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/learners/invites`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title={canSendInvite.allowed ? 'Invite New Learner' : 'Invites Not Available'}
          closeRoute={closeRoute}
        />
        <Modal.Body className='px-4'>
          {canSendInvite.allowed ? (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit} noValidate>
                <HoneypotInputs />

                <GoInputField
                  labelProps={{ children: 'Email', required: true }}
                  name='email'
                  inputProps={{
                    type: 'email',
                    autoFocus: true,
                    disabled: isDisabled,
                    placeholder: 'learner@example.com',
                  }}
                  description='Enter the email address of the person you want to invite to this course.'
                />

                <GoSelectInputField
                  labelProps={{ children: 'Cohort (Optional)' }}
                  name='cohortId'
                  description='Assign this learner to a specific cohort for organized tracking.'
                  selectProps={{
                    placeholder: 'No cohort (default)',
                    options: cohorts,
                    disabled: isDisabled || cohorts.length === 0,
                  }}
                />

                <Button
                  type='submit'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                  rightIcon={<ChevronRight />}
                >
                  Send Invite
                </Button>
              </Form>
            </RemixFormProvider>
          ) : (
            <div className='border-muted bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm'>
              <p className='text-foreground mb-1 font-medium'>
                Course invites are not available on your current plan.
              </p>
              <p className='font-secondary mb-2'>
                {canSendInvite.reason ??
                  'Upgrade your plan to send invitations to students for this course.'}
              </p>
              <NavLinkButton
                to={`/${params.organizationId}/dashboard/subscriptions`}
                className='mt-4'
              >
                Upgrade Your Plan
              </NavLinkButton>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
