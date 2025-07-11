import { NavLink } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, HardDrive, UploadCloud } from 'lucide-react';

import { getStorageUsageAnalytics } from '@gonasi/database/files';

import type { Route } from './+types/storage-index';

import { GoThumbnail } from '~/components/cards/go-course-card';
import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Storage Usage • Gonasi' },
    {
      name: 'description',
      content: `Monitor your organization's storage usage across all courses on Gonasi. View how much space is used, available, and manage your files effectively.`,
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const storageUsage = await getStorageUsageAnalytics(supabase, params.organizationId);
  return { storageUsage };
}

export default function StorageIndex({ loaderData, params }: Route.ComponentProps) {
  const { storageUsage } = loaderData;
  const shouldReduceMotion = useReducedMotion();

  if (!storageUsage.success) {
    return <div>Error: {storageUsage.message}</div>;
  }

  const formatStorage = (bytes: number) => {
    const kb = bytes / 1024;
    const mb = bytes / 1024 ** 2;
    const gb = bytes / 1024 ** 3;
    const tb = bytes / 1024 ** 4;
    if (tb >= 1) return `${tb.toFixed(1)} TB`;
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const data = storageUsage.data!;
  const usagePercentage = data.usagePercentage;
  const totalBytes = data.totalUsageBytes;
  const limitBytes = data.limitBytes;
  const remainingBytes = data.remainingBytes;

  return (
    <motion.section
      className='p-4'
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className='flex flex-col items-start justify-between space-y-4 pb-4 md:flex-row md:items-center md:space-y-0'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold'>Storage Usage</h1>
          <p className='text-muted-foreground font-secondary text-sm'>
            {`View your organization's storage usage and manage your files.`}
          </p>
        </div>
        <div>
          <NavLinkButton variant='secondary' to=''>
            <UploadCloud className='h-4 w-4' />
            Upgrade Storage
          </NavLinkButton>
        </div>
      </div>

      <Card className='mt-4 max-w-lg rounded-none border-none shadow-none'>
        <CardHeader className='flex flex-row items-center space-y-0 pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <HardDrive className='h-4 w-4' />
            <span className='mt-1'>Total Storage Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Progress value={usagePercentage} className='h-2' />
            <div className='text-muted-foreground font-secondary flex justify-between text-sm'>
              <span>{usagePercentage.toFixed(1)}% used</span>
              <span>{formatStorage(remainingBytes)} available</span>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-secondary text-sm font-bold'>Used</p>
              <p className='text-2xl font-bold'>{formatStorage(totalBytes)}</p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-secondary text-sm font-bold'>Total</p>
              <p className='text-2xl font-bold'>{formatStorage(limitBytes)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='my-8 max-w-lg rounded-none shadow-none'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <BookOpen className='h-4 w-4' />
            Storage by Builder & Published Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {data.courseBreakdown.map((course, index) => {
              const coursePercentage = (course.usageBytes / limitBytes) * 100;

              return (
                <NavLink
                  key={course.courseId}
                  to={`/${params.organizationId}/builder/${course.courseId}/file-library`}
                >
                  {({ isPending }) => (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={cn(
                        'space-y-2 rounded-md p-2 transition-colors',
                        'hover:bg-muted/50',
                        isPending && 'pointer-events-none opacity-50',
                      )}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex min-w-0 flex-1 items-center gap-2'>
                          {course.courseImageUrl && (
                            <div className='h-8 w-8'>
                              <GoThumbnail
                                iconUrl={course.signedUrl ?? null}
                                blurHash={course.courseBlurHash}
                                name={course.courseName}
                                objectFit='cover'
                                aspectRatio='1/1'
                                className='rounded-md'
                              />
                            </div>
                          )}
                          <span className='truncate text-sm font-medium'>{course.courseName}</span>
                        </div>
                        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                          <span>{coursePercentage.toFixed(1)}%</span>
                          <span className='text-foreground font-medium'>
                            {formatStorage(course.usageBytes)}
                          </span>
                        </div>
                      </div>

                      <Progress value={coursePercentage} className='h-1' />

                      <div className='text-muted-foreground flex justify-between text-xs'>
                        <span>
                          {course.fileCount} {course.fileCount === 1 ? 'file' : 'files'}
                        </span>
                        {course.largestFile && (
                          <span>
                            Largest: {course.largestFile.name} (
                            {formatStorage(course.largestFile.sizeMB * 1024 * 1024)})
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className='mt-4 border-t pt-4'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                Total from {data.courseBreakdown.length}{' '}
                {data.courseBreakdown.length === 1 ? 'course' : 'courses'}
              </span>
              <span className='font-medium'>{formatStorage(totalBytes)}</span>
            </div>
            <div className='text-muted-foreground mt-1 flex items-center justify-between text-xs'>
              <span>
                {data.totalFiles} total {data.totalFiles === 1 ? 'file' : 'files'}
              </span>
              <span>
                {usagePercentage.toFixed(1)}% of {formatStorage(limitBytes)} limit
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
