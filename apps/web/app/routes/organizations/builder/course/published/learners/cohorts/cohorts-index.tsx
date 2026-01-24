import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';

export function meta() {
  return [
    { title: 'Cohorts • Gonasi' },
    { name: 'description', content: 'Manage learner cohorts for this course' },
  ];
}

export default function CohortsIndex() {
  return (
    <div className='flex flex-col gap-6'>
      <Card className='rounded-none'>
        <CardHeader>
          <CardTitle>Cohorts</CardTitle>
          <CardDescription>Organize learners into cohorts for better management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground'>Cohort management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
