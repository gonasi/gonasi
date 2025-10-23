import { Award, TrendingUp, Users } from 'lucide-react';

import { TotalCoursesCard } from './components/TotalCoursesCard';

import { EarningsCard, PlanCard, StatsCard, StorageCard } from '~/components/cards';

export default function DashboardIndex() {
  return (
    <section className='mx-auto space-y-4 p-4'>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4'>
        <TotalCoursesCard />
        <StatsCard
          title='Total Students'
          value={1248}
          description='Across all courses'
          icon={Users}
          trend={{ value: '8%', positive: true }}
        />
        <StatsCard
          title='Active Enrollments'
          value={892}
          description='Students currently enrolled in courses'
          icon={TrendingUp}
          trend={{ value: '5%', positive: false }}
        />

        <EarningsCard />
      </div>

      {/* Plan, Storage, and Completion */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <PlanCard />
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
  );
}
