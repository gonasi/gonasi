import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCohortsForCourse } from '@gonasi/database/cohorts';
import { inviteToCourse } from '@gonasi/database/courseInvites';
import { fetchCoursePricing } from '@gonasi/database/courses/pricing';
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
    return { cohorts: [], pricingTiers: [] };
  }

  const [cohorts, pricingTiers] = await Promise.all([
    fetchCohortsForCourse(supabase, courseId),
    fetchCoursePricing({ supabase, courseId }),
  ]);

  // Helper to format payment frequency (matching PricingDisplay component)
  const frequencyLabels: Record<string, string> = {
    monthly: 'month',
    bi_monthly: '2 months',
    quarterly: 'quarter',
    semi_annual: '6 months',
    annual: 'year',
  };

  // Helper to format price using Intl.NumberFormat
  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(price);
    } catch {
      // Fallback if currency code is invalid
      return `${currency} ${Number(price).toLocaleString()}`;
    }
  };

  // Helper to check if promotion is active
  const isPromotionActive = (tier: NonNullable<typeof pricingTiers>[number]) => {
    if (!tier.promotional_price || !tier.promotion_start_date || !tier.promotion_end_date) {
      return false;
    }
    const now = new Date();
    const start = new Date(tier.promotion_start_date);
    const end = new Date(tier.promotion_end_date);
    return now >= start && now <= end;
  };

  const allPricingTiers = (pricingTiers ?? [])
    .sort((a, b) => a.position - b.position)
    .map((tier) => {
      if (tier.is_free) {
        const label = tier.tier_name || 'Free Access';
        const description = tier.tier_description || 'No payment required';

        return {
          value: tier.id,
          label: `${label} - Free`,
          description,
          status: tier.is_active ? 'active' : 'not active',
        };
      }

      // Check if promotion is active
      const hasActivePromo = isPromotionActive(tier);
      const effectivePrice = hasActivePromo ? tier.promotional_price! : tier.price;
      const priceDisplay = formatPrice(effectivePrice, tier.currency_code);
      const frequency = frequencyLabels[tier.payment_frequency] || tier.payment_frequency;

      // Build main label with tier name and current price
      const tierName = tier.tier_name || 'Standard';
      const mainLabel = `${tierName} - ${priceDisplay} / ${frequency}`;

      // Build description with additional details
      let description = '';
      if (hasActivePromo) {
        const originalPrice = formatPrice(tier.price, tier.currency_code);
        const savings = formatPrice(tier.price - tier.promotional_price!, tier.currency_code);
        description = `🎉 Promotional price! Save ${savings} (was ${originalPrice} / ${frequency})`;
      } else if (tier.tier_description) {
        description = tier.tier_description;
      }

      // Add badges for popular/recommended
      const badges: string[] = [];
      if (tier.is_popular) badges.push('🔥 Popular');
      if (tier.is_recommended) badges.push('⭐ Recommended');

      // Combine badges with description
      if (badges.length > 0) {
        description = badges.join(' • ') + (description ? ` • ${description}` : '');
      }

      return {
        value: tier.id,
        label: mainLabel,
        description: description || undefined,
        status: tier.is_active ? 'active' : 'not active',
      };
    });

  const hasActiveTiers = allPricingTiers.some((tier) => tier.status === 'active');

  return {
    cohorts: (cohorts ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
    pricingTiers: allPricingTiers,
    hasActiveTiers,
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
    `/${params.organizationId}/courses/${params.courseId}/learners/invites`,
    `Invitation sent to ${data.email}`,
  );
}

export default function NewInvite({ params, loaderData }: Route.ComponentProps) {
  const outletContext = useOutletContext<CourseInvitesPageLoaderData>();
  const { canSendInvite, visibility, visibilityLabel } = outletContext;
  const { cohorts, pricingTiers, hasActiveTiers } = loaderData;

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

  const closeRoute = `/${params.organizationId}/courses/${params.courseId}/learners/invites`;

  const isPrivateCourse = visibility === 'private';
  const canCreateInvite = canSendInvite.allowed && isPrivateCourse;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title={canCreateInvite ? 'Invite New Learner' : 'Invites Not Available'}
          closeRoute={closeRoute}
        />
        <Modal.Body className='px-4'>
          {!isPrivateCourse ? (
            <div className='border-muted bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm'>
              <p className='text-foreground mb-1 font-medium'>
                Email invitations not needed for {visibilityLabel} courses
              </p>
              <p className='font-secondary mb-2'>
                The currently published version of this course is set to {visibilityLabel},{' '}
                {visibility === 'public'
                  ? 'making it visible and searchable to everyone'
                  : 'so anyone with the course link can access it directly'}
                . If you change this course to Private, you’ll need to publish your changes for them
                to take effect. Email invitations are only required for Private courses, until then,
                you can simply share the course link with learners.
              </p>

              <NavLinkButton to={closeRoute} className='mt-4'>
                Go Back
              </NavLinkButton>
            </div>
          ) : canSendInvite.allowed ? (
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
                  labelProps={{ children: 'Pricing Tier', required: true }}
                  name='pricingTierId'
                  description='The pricing tier determines what the invited learner will pay for course access.'
                  selectProps={{
                    placeholder: 'Choose a pricing option...',
                    options: pricingTiers,
                    disabled: isDisabled || !hasActiveTiers,
                  }}
                />

                {!hasActiveTiers && (
                  <div className='border-muted bg-muted/40 text-muted-foreground -mt-2 mb-4 rounded-lg border p-3 text-sm'>
                    <p className='text-foreground mb-1 font-medium'>
                      No active pricing tiers available
                    </p>
                    <p className='font-secondary'>
                      Please activate at least one pricing tier before sending invites.
                    </p>
                  </div>
                )}

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
                  disabled={isDisabled || !hasActiveTiers}
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
