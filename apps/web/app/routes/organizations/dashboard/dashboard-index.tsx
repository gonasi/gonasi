import { Suspense } from 'react';
import { Await, Outlet } from 'react-router';
import { Award, LoaderCircle } from 'lucide-react';

import type { Route } from './+types/dashboard-index';
import { OrganizationPlanCard } from './components/OrganizationPlanCard';
import { TotalCoursesCard } from './components/TotalCoursesCard';
import { TotalEarningsCard } from './components/TotalEarningsCard';
import { TotalEnrollmentsCard } from './components/TotalEnrollmentsCard';
import { TotalReEnrollmentsCard } from './components/TotalReEnrollmentsCard';
import { TotalStudentsCard } from './components/TotalStudentsCard';
import { organizationTierLimitsSummary } from '../../../../../../shared/database/src/organizations/tierLimits/organizationTierLimitsSummary';

import { BannerCard, StatsCard, StorageCard } from '~/components/cards';
import createClient from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId } = params;

  const orgSummary = organizationTierLimitsSummary({
    supabase,
    organizationId,
  });

  return orgSummary;
}

export default function DashboardIndex({ params, loaderData }: Route.ComponentProps) {
  return (
    <>
      <Suspense
        fallback={
          <div className='flex w-full justify-end p-2'>
            <LoaderCircle className='animate-spin' />
          </div>
        }
      >
        <Await resolve={loaderData}>
          {(orgSummary) => {
            const isError = orgSummary.status === 'error';
            const isWarning = orgSummary.status === 'warning';

            return (
              <div className='px-4 pt-4'>
                {isError && (
                  <BannerCard
                    message={orgSummary.message}
                    showCloseIcon={false}
                    variant='error'
                    cta={[
                      {
                        to: `/${params.organizationId}/dashboard/subscriptions`,
                        children: 'View Subscription',
                      },
                    ]}
                  />
                )}

                {isWarning && (
                  <BannerCard
                    message={orgSummary.message}
                    showCloseIcon={false}
                    variant='warning'
                    cta={{
                      to: `/${params.organizationId}/dashboard/subscriptions`,
                      children: 'View Subscription',
                    }}
                  />
                )}

                {orgSummary.status === 'success' && (
                  <BannerCard
                    message={orgSummary.message}
                    showCloseIcon={false}
                    variant='success'
                  />
                )}
              </div>
            );
          }}
        </Await>
      </Suspense>
      <section className='mx-auto space-y-4 p-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <TotalCoursesCard />
          <TotalStudentsCard />
          <TotalEnrollmentsCard />
          <TotalReEnrollmentsCard />
        </div>

        <div>
          <TotalEarningsCard />
        </div>

        {/* Plan, Storage, and Completion */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <OrganizationPlanCard />
          <StorageCard />
          <StatsCard
            title='Avg. Completion'
            value='74%'
            description='Course completion rate'
            icon={Award}
            trend={{ value: '3%', positive: true }}
          />
        </div>
      </section>
      <Outlet />
    </>
  );
}
