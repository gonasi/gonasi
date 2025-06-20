import { Link } from 'react-router';
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

import { fetchPublishedCourseById } from '@gonasi/database/publishedCourses';
import { timeAgo } from '@gonasi/utils/timeAgo';

import type { Route } from './+types/published-course-id-index';

import { UserAvatar } from '~/components/avatars';
import { GoPricingSheet } from '~/components/cards/go-course-card/GoPricingSheet';
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

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const publishedCourseId = params.publishedCourseId;

  const courseOverview = await fetchPublishedCourseById({ supabase, publishedCourseId });

  if (!courseOverview) {
    return redirectWithError(`/`, 'Course not found');
  }

  return { courseOverview };
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

export default function PublishedCourseIdIndex({ loaderData }: Route.ComponentProps) {
  const {
    name,
    description,
    course_categories,
    course_sub_categories,
    created_at,
    updated_at,
    lessons_count,
    chapters_count,
    pricing_data,
  } = loaderData.courseOverview;

  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirectTo');

  let closeLink = '/';

  if (redirectTo) {
    closeLink = redirectTo;
  }

  const categoryName = course_categories?.name;
  const subcategoryName = course_sub_categories?.name;

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={
            <div className='text-primary-foreground border-primary bg-primary flex h-8 w-8 items-center justify-center rounded-full border'>
              <ImageIcon size={18} />
            </div>
          }
          title={name}
          closeRoute={closeLink}
        />
        <Modal.Body>
          <div className='min-h-screen'>
            <div className='flex flex-col-reverse space-x-0 py-2 md:flex-row md:space-x-10 md:py-10'>
              {/* Left Content */}
              <div className='md:bg-card/50 flex flex-1 flex-col space-y-4 rounded-2xl bg-transparent p-0 md:p-4'>
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
                  <UserAvatar username='username' imageUrl='' size='xs' />
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
                      {lessons_count} {lessons_count === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className='mb-4 min-w-full md:mb-0 md:min-w-xs lg:min-w-sm'>
                <div className='flex flex-col'>
                  {/* <CourseThumbnail
                    iconUrl={signedUrl}
                    name={name}
                    className='rounded-t-2xl'
                    // badges={
                    //   loaderData.activeChapterAndLesson?.status === 'complete' ? ['Completed'] : []
                    // }
                  /> */}
                  <div className='bg-card rounded-b-2xl px-4 pb-4 md:rounded-b-none md:bg-transparent md:px-0 md:pb-0'>
                    <div className='py-4'>
                      <GoPricingSheet pricingData={pricing_data} side='left' textSize='lg' />
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
              {/* <ChapterLessonTree
                courseId={params.courseId}
                chapters={chapters}
                activeChapterAndLesson={loaderData.activeChapterAndLesson}
              /> */}
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
