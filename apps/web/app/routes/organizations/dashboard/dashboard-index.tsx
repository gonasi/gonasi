import { Award } from 'lucide-react';

import { OrganizationPlanCard } from './components/OrganizationPlanCard';
import { TotalCoursesCard } from './components/TotalCoursesCard';
import { TotalEnrollmentsCard } from './components/TotalEnrollmentsCard';
import { TotalReEnrollmentsCard } from './components/TotalReEnrollmentsCard';
import { TotalStudentsCard } from './components/TotalStudentsCard';

import { EarningsCard, StatsCard, StorageCard } from '~/components/cards';

export default function DashboardIndex() {
  return (
    <section className='mx-auto space-y-4 p-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <TotalCoursesCard />
        <TotalStudentsCard />
        <TotalEnrollmentsCard />
        <TotalReEnrollmentsCard />
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
      <div>
        <EarningsCard />
      </div>
    </section>
  );
}
