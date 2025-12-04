import { UserCheck } from 'lucide-react';

import { Badge } from '~/components/ui/badge/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';

interface Enrollment {
  id: string;
  user_id: string;
  is_active: boolean;
  expires_at: string | null;
}

interface RecentEnrollmentsProps {
  course_enrollments: Enrollment[];
}

export function RecentEnrollments({ course_enrollments }: RecentEnrollmentsProps) {
  if (!course_enrollments || course_enrollments.length === 0) {
    return null;
  }

  return (
    <Card className='rounded-none'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <UserCheck className='size-5' />
          <CardTitle>Recent Enrollments</CardTitle>
        </div>
        <CardDescription>
          {course_enrollments.length} active{' '}
          {course_enrollments.length === 1 ? 'enrollment' : 'enrollments'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-2'>
          {course_enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className='border-border flex items-center justify-between rounded-md border p-3'
            >
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full font-semibold'>
                  {enrollment.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className='text-sm font-medium'>{enrollment.user_id}</p>
                  <p className='text-muted-foreground text-xs'>
                    Expires:{' '}
                    {enrollment.expires_at
                      ? new Date(enrollment.expires_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <Badge variant={enrollment.is_active ? 'success' : 'outline'}>
                {enrollment.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
