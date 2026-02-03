import { Award, TrendingUp, UserCheck } from 'lucide-react';

import type { UserProgressStats } from '@gonasi/database/courses';

import { Badge } from '~/components/ui/badge/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card/card';

interface Enrollment {
  id: string;
  user_id: string;
  is_active: boolean;
  expires_at: string | null;
}

interface RecentEnrollmentsProps {
  course_enrollments: Enrollment[];
  usersProgress: UserProgressStats[];
}

export function RecentEnrollments({ course_enrollments, usersProgress }: RecentEnrollmentsProps) {
  if (!course_enrollments || course_enrollments.length === 0) {
    return null;
  }

  // Create a map of user progress for quick lookup
  const progressMap = new Map(usersProgress.map((progress) => [progress.user_id, progress]));

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
          {course_enrollments.map((enrollment) => {
            const userProgress = progressMap.get(enrollment.user_id);

            return (
              <div
                key={enrollment.id}
                className='border-border flex items-center justify-between rounded-md border p-4'
              >
                <div className='flex items-center gap-4'>
                  <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full font-semibold'>
                    {enrollment.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className='flex flex-col gap-1'>
                    <p className='text-sm font-medium'>{enrollment.user_id}</p>
                    <p className='text-muted-foreground text-xs'>
                      Expires:{' '}
                      {enrollment.expires_at
                        ? new Date(enrollment.expires_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-4'>
                  {/* Progress Percentage */}
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='text-muted-foreground size-4' />
                    <div className='flex flex-col items-end'>
                      <span className='text-sm font-semibold'>
                        {userProgress ? `${Math.round(userProgress.progress_percentage)}%` : '0%'}
                      </span>
                      <span className='text-muted-foreground text-xs'>Progress</span>
                    </div>
                  </div>

                  {/* Average Score */}
                  <div className='flex items-center gap-2'>
                    <Award className='text-warning size-4' />
                    <div className='flex flex-col items-end'>
                      <span className='text-sm font-semibold'>
                        {userProgress ? userProgress.average_score.toFixed(1) : '-'}
                      </span>
                      <span className='text-muted-foreground text-xs'>Avg Score</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge variant={enrollment.is_active ? 'success' : 'outline'}>
                    {enrollment.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
