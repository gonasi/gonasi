import { Award, BookOpen, TrendingUp, Users } from 'lucide-react';

import { EarningsCard, PlanCard, StatsCard, StorageCard } from '~/components/cards';

export default function DashboardIndex() {
  return (
    <section className='space-y-4 p-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatsCard
          title='Total Courses'
          value={24}
          description='4 drafts, 20 published'
          icon={BookOpen}
          trend={{ value: '12%', positive: true }}
        />
        <StatsCard
          title='Total Students'
          value={1248}
          description='Across all courses'
          icon={Users}
          trend={{ value: '8%', positive: true }}
        />
        <StatsCard
          title='Active Users'
          value={892}
          description='Last 30 days'
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
