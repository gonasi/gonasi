import { BookOpen, Star, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card/card';

interface CourseMetricsProps {
  total_enrollments: number;
  active_enrollments: number;
  completion_rate: number | null;
  average_rating: number | null;
  total_reviews: number;
  total_chapters: number;
  total_lessons: number;
  total_blocks: number;
}

export function CourseMetrics({
  total_enrollments,
  active_enrollments,
  completion_rate,
  average_rating,
  total_reviews,
  total_chapters,
  total_lessons,
  total_blocks,
}: CourseMetricsProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card className='rounded-none'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium'>Total Enrollments</CardTitle>
            <Users className='text-muted-foreground size-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{total_enrollments ?? 0}</div>
          <p className='text-muted-foreground text-xs'>{active_enrollments ?? 0} active</p>
        </CardContent>
      </Card>

      <Card className='rounded-none'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium'>Completion Rate</CardTitle>
            <TrendingUp className='text-muted-foreground size-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {completion_rate ? `${completion_rate}%` : 'N/A'}
          </div>
          <p className='text-muted-foreground text-xs'>Average across all students</p>
        </CardContent>
      </Card>

      <Card className='rounded-none'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium'>Rating</CardTitle>
            <Star className='text-muted-foreground size-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {average_rating ? average_rating.toFixed(1) : 'N/A'}
          </div>
          <p className='text-muted-foreground text-xs'>
            {total_reviews ?? 0} {total_reviews === 1 ? 'review' : 'reviews'}
          </p>
        </CardContent>
      </Card>

      <Card className='rounded-none'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium'>Course Content</CardTitle>
            <BookOpen className='text-muted-foreground size-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{total_lessons}</div>
          <p className='text-muted-foreground text-xs'>
            {total_chapters} chapters • {total_blocks} blocks
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
