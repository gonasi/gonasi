import {
  Activity,
  Award,
  CheckCircle,
  Clock,
  RotateCcw,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

import { fetchCourseUsersProgress, fetchPublishedCourseDetails } from '@gonasi/database/courses';

import type { Route } from './+types/all-index';

import { PlainAvatar } from '~/components/avatars';
import { Badge } from '~/components/ui/badge/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card/card';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'All Learners • Gonasi' },
    { name: 'description', content: 'View and manage all learners enrolled in this course' },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [publishedCourse, usersProgress] = await Promise.all([
    fetchPublishedCourseDetails({
      supabase,
      publishedCourseId: params.courseId,
    }),
    fetchCourseUsersProgress({
      supabase,
      publishedCourseId: params.courseId ?? '',
    }),
  ]);

  return { publishedCourse, usersProgress };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatExpirationDate(dateString: string): string {
  const expiryDate = new Date(dateString);
  const now = new Date();

  const expiryDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = expiryDay.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays < 7) return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;

  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;

  const months = Math.floor(diffDays / 30);
  if (diffDays < 365) return `In ${months} ${months === 1 ? 'month' : 'months'}`;

  const years = Math.floor(diffDays / 365);
  return `In ${years} ${years === 1 ? 'year' : 'years'}`;
}

export default function AllLearnersIndex({ loaderData }: Route.ComponentProps) {
  const { usersProgress, publishedCourse } = loaderData;

  const courseEnrollments = publishedCourse?.course_enrollments ?? [];

  // Create enrollment lookup map
  const enrollmentMap = new Map(
    courseEnrollments.map((enrollment) => [enrollment.user_id, enrollment]),
  );

  if (!usersProgress || usersProgress.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <p className='text-muted-foreground'>No learners enrolled yet</p>
      </div>
    );
  }

  // Calculate overall stats
  const totalUsers = usersProgress.length;
  const avgCompletion =
    usersProgress.reduce((sum, user) => sum + user.progress_percentage, 0) / totalUsers;
  const usersWithScores = usersProgress.filter((user) => user.average_score > 0);
  const avgScore =
    usersWithScores.length > 0
      ? usersWithScores.reduce((sum, user) => sum + user.average_score, 0) / usersWithScores.length
      : 0;
  const completedUsers = usersProgress.filter(
    (user) => user.is_completed || user.progress_percentage >= 100,
  ).length;
  const activeEnrollments = courseEnrollments.filter((e) => e.is_active).length;

  return (
    <div className='flex flex-col gap-6'>
      {/* Summary Stats */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='rounded-none'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Active Learners</CardTitle>
              <Activity className='text-muted-foreground size-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeEnrollments}</div>
            <p className='text-muted-foreground text-xs'>
              {totalUsers} {totalUsers === 1 ? 'has' : 'have'} started learning
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-none'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Avg Completion</CardTitle>
              <TrendingUp className='text-muted-foreground size-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{Math.round(avgCompletion)}%</div>
            <p className='text-muted-foreground text-xs'>Average course completion</p>
          </CardContent>
        </Card>

        <Card className='rounded-none'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Avg Score</CardTitle>
              <Award className='text-muted-foreground size-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{avgScore > 0 ? avgScore.toFixed(1) : 'N/A'}</div>
            <p className='text-muted-foreground text-xs'>
              {usersWithScores.length > 0
                ? `From ${usersWithScores.length} learner${usersWithScores.length === 1 ? '' : 's'}`
                : 'No scored activities yet'}
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-none'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Completed</CardTitle>
              <CheckCircle className='text-muted-foreground size-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{completedUsers}</div>
            <p className='text-muted-foreground text-xs'>
              {totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0}% finished the
              course
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Progress Table */}
      <Card className='rounded-none'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b text-left text-sm font-medium'>
                  <th className='px-4 py-3'>Learner</th>
                  <th className='px-4 py-3'>Progress</th>
                  <th className='px-4 py-3'>Score</th>
                  <th className='px-4 py-3'>Lessons</th>
                  <th className='px-4 py-3'>Blocks</th>
                  <th className='px-4 py-3'>Time Spent</th>
                  <th className='px-4 py-3'>Last Activity</th>
                  <th className='px-4 py-3'>Resets</th>
                  <th className='px-4 py-3'>Enrollment</th>
                  <th className='px-4 py-3'>Course Status</th>
                </tr>
              </thead>
              <tbody>
                {usersProgress.map((user) => (
                  <tr key={user.user_id} className='border-b last:border-b-0'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <PlainAvatar
                          username={user?.username ?? user?.full_name}
                          imageUrl={user?.signed_url}
                          size='md'
                        />

                        <div className='flex flex-col'>
                          <span className='text-sm font-medium'>
                            {user.full_name || user.username || 'Unknown User'}
                          </span>
                          {user.username && user.full_name && (
                            <span className='text-muted-foreground text-xs'>@{user.username}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <div className='bg-muted h-2 w-24 overflow-hidden rounded-full'>
                            <div
                              className='bg-primary h-full transition-all'
                              style={{ width: `${user.progress_percentage}%` }}
                            />
                          </div>
                          <span className='text-sm font-medium'>
                            {Math.round(user.progress_percentage)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {user.average_score > 0 ? (
                        <div className='flex items-center gap-1'>
                          <Award className='text-warning size-4' />
                          <span className='text-sm font-medium'>
                            {user.average_score.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className='text-muted-foreground text-sm'>-</span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-muted-foreground text-sm'>
                        {user.completed_lessons}/{user.total_lessons}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-muted-foreground text-sm'>
                        {user.completed_blocks}/{user.total_blocks}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1'>
                        <Clock className='text-muted-foreground size-4' />
                        <span className='text-sm'>{formatDuration(user.time_spent_seconds)}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-col'>
                        <span className='text-muted-foreground text-sm'>
                          {user.last_activity
                            ? formatRelativeTime(user.last_activity)
                            : formatRelativeTime(user.enrolled_at)}
                        </span>
                        {!user.last_activity && (
                          <span className='text-muted-foreground text-xs'>(enrolled)</span>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1'>
                        <RotateCcw className='text-muted-foreground size-4' />
                        <span className='text-sm'>{user.reset_count}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {(() => {
                        const enrollment = enrollmentMap.get(user.user_id);
                        return (
                          <div className='flex flex-col gap-1'>
                            <Badge
                              variant={enrollment?.is_active ? 'success' : 'outline'}
                              className='w-fit'
                            >
                              {enrollment?.is_active ? (
                                <>
                                  <UserCheck className='size-3' /> Active
                                </>
                              ) : (
                                'Inactive'
                              )}
                            </Badge>
                            {enrollment?.expires_at && (
                              <span className='text-muted-foreground text-xs'>
                                {formatExpirationDate(enrollment.expires_at)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className='px-4 py-3'>
                      <Badge
                        variant={
                          user.is_completed || user.progress_percentage >= 100
                            ? 'success'
                            : 'outline'
                        }
                      >
                        {user.is_completed || user.progress_percentage >= 100 ? (
                          <>
                            <CheckCircle className='size-3' /> Completed
                          </>
                        ) : (
                          'In Progress'
                        )}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
