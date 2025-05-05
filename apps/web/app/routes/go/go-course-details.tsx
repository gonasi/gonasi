import { Link, useNavigate } from 'react-router';
import {
  BookOpen,
  ChevronRight,
  Clock,
  ImageIcon,
  MoveRight,
  StarOff,
  TableOfContents,
} from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import {
  fetchPublishedCourseDetailsById,
  getActiveChapterAndLessonForUser,
} from '@gonasi/database/courses';
import { fetchLessonsCompletionStatusByCourse } from '@gonasi/database/lessons';
import { timeAgo } from '@gonasi/utils/timeAgo';

import type { Route } from './+types/go-course-details';

import { UserAvatar } from '~/components/avatars';
import { CoursePrice } from '~/components/cards/course-card/course-price';
import { CourseThumbnail } from '~/components/cards/course-card/course-thumbnail';
import { ChapterLessonTree } from '~/components/course';
import { Badge } from '~/components/ui/badge';
import { buttonVariants } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export type UserCourseChaptersLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['course']['chapters'];

export type UserLessonCompletionStatusLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['completionStatus'];

export type UserActiveChapterAndLessonLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['activeChapterAndLesson'];

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId;

  // Fetch data in parallel
  const [completionStatus, course, activeChapterAndLesson] = await Promise.all([
    fetchLessonsCompletionStatusByCourse(supabase, courseId),
    fetchPublishedCourseDetailsById(supabase, courseId),
    getActiveChapterAndLessonForUser(supabase, courseId),
  ]);

  if (!course) {
    return redirectWithError(`/go/courses`, 'Course not found');
  }

  // Create lookup map for completion status for O(1) lookups instead of O(n)
  const completionStatusMap = new Map(
    completionStatus?.map((status) => [status.lesson_id, status.is_complete]) || [],
  );

  // Process course data with efficient lookups
  const courseWithCompletionStatus = {
    ...course,
    chapters: course.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => ({
        ...lesson,
        isCompleted: completionStatusMap.get(lesson.id) ?? false,
      })),
    })),
  };

  return { course: courseWithCompletionStatus, completionStatus, activeChapterAndLesson };
}

function MetaInfoItem({ label, timestamp }: { label: string; timestamp: string }) {
  return (
    <div className='font-secondary flex space-x-2 text-xs'>
      <div className='flex items-center space-x-1'>
        <Clock size={12} />
        <div>{label}</div>
      </div>
      <div className='text-foreground font-bold'>{timeAgo(timestamp)}</div>
    </div>
  );
}

export default function GoCourseDetails({ loaderData, params }: Route.ComponentProps) {
  const {
    name,
    signedUrl,
    description,
    course_categories,
    course_sub_categories,
    created_by_profile,
    created_at,
    updated_at,
    monthly_subscription_price,
    chapters,
    lesson_count,
    chapters_count,
  } = loaderData.course;

  const navigate = useNavigate();
  const handleClose = () => navigate(`/go/courses`);

  const categoryName = course_categories?.name;
  const subcategoryName = course_sub_categories?.name;
  const author = {
    displayName:
      created_by_profile.username ?? created_by_profile.full_name ?? created_by_profile.email,
    imageUrl: created_by_profile.avatar_url,
  };

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={
            signedUrl ? (
              <img src={signedUrl} alt={name} className='h-8 w-8 rounded-full object-cover' />
            ) : (
              <div className='text-primary-foreground border-primary bg-primary flex h-8 w-8 items-center justify-center rounded-full border'>
                <ImageIcon size={18} />
              </div>
            )
          }
          title={name}
        />
        <Modal.Body>
          <div>
            <div className='flex flex-col-reverse space-x-0 py-2 md:flex-row md:space-x-10 md:py-10'>
              {/* Left Content */}
              <div className='bg-card/20 flex flex-1 flex-col space-y-4 rounded-2xl p-4'>
                <div className='flex items-center space-x-2 overflow-auto'>
                  <Badge variant='outline'>{categoryName}</Badge>
                  <ChevronRight size={12} />
                  <Badge variant='outline'>{subcategoryName}</Badge>
                </div>

                <p className='font-secondary text-muted-foreground'>{description}</p>

                <div className='pb-2'>
                  <StarOff size={14} className='text-gold' />
                </div>

                <Link to='/'>
                  <UserAvatar username={author.displayName} imageUrl={author.imageUrl} size='xs' />
                </Link>

                <div className='flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4'>
                  <MetaInfoItem label='Published' timestamp={created_at} />
                  <MetaInfoItem label='Updated' timestamp={updated_at} />
                </div>

                <div className='flex items-center space-x-8 pt-2'>
                  <div className='flex items-center space-x-1'>
                    <TableOfContents size={12} />
                    <span>
                      {chapters_count} {chapters_count === 1 ? 'chapter' : 'chapters'}
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <BookOpen size={12} />
                    <span>
                      {lesson_count} {lesson_count === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className='mb-4 min-w-full md:mb-0 md:min-w-xs lg:min-w-sm'>
                <div className='flex flex-col'>
                  <CourseThumbnail
                    iconUrl={signedUrl}
                    name={name}
                    className='rounded-t-2xl'
                    badges={
                      loaderData.activeChapterAndLesson?.status === 'complete' ? ['Completed'] : []
                    }
                  />
                  <div className='bg-card rounded-b-2xl px-4 pb-4 md:rounded-b-none md:bg-transparent md:px-0 md:pb-0'>
                    <div className='py-4'>
                      <CoursePrice price={monthly_subscription_price} />
                    </div>
                    <Link to='' className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
                      Start for Free
                      <MoveRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter Tree */}
            <div className='max-w-md md:max-w-xl'>
              <ChapterLessonTree
                courseId={params.courseId}
                chapters={chapters}
                activeChapterAndLesson={loaderData.activeChapterAndLesson}
              />
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
