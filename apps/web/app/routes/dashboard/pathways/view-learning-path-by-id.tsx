import { data, Link, Outlet, redirect } from 'react-router';
import { Plus } from 'lucide-react';

import { checkUserOwnsPathway, fetchLearningPathById } from '@gonasi/database/learningPaths';

import type { Route } from './+types/view-learning-path-by-id';

import { NotFoundCard } from '~/components/cards';
import { EditableImage } from '~/components/editable-image';
import { ActionLinks } from '~/components/go-link';
import { PlainLayout } from '~/components/layouts/plain';
import { buttonVariants } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [learningPath, userOwnsPathway] = await Promise.all([
    fetchLearningPathById(supabase, params.learningPathId),
    checkUserOwnsPathway(supabase, params.learningPathId),
  ]);

  if (!learningPath) return redirect(`/dashboard/${params.companyId}/learning-paths`);

  return data({ data: learningPath, userOwnsPathway });
}

export default function LearningPathById({ loaderData, params }: Route.ComponentProps) {
  const { data: learningPathData, userOwnsPathway } = loaderData;

  return (
    <>
      <Outlet />
      <PlainLayout backLink={`/dashboard/${params.companyId}/learning-paths`} title='Learning path'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <EditableImage
                src={learningPathData.signed_url}
                alt={learningPathData.name}
                className='h-20 w-20'
                to={`/dashboard/${params.companyId}/learning-paths/${learningPathData.id}/edit/image`}
                canEdit={userOwnsPathway}
              />
              <h2>{learningPathData.name}</h2>
            </div>
            {userOwnsPathway && (
              <ActionLinks
                editLink={`/dashboard/${params.companyId}/learning-paths/${learningPathData.id}/edit`}
                deleteLink={`/dashboard/${params.companyId}/learning-paths/${learningPathData.id}/delete`}
              />
            )}
          </div>
          <p className='text-muted-foreground font-secondary text-sm'>
            {learningPathData.description}
          </p>
          <Separator />
          <div className='flex items-center justify-between'>
            <h2>Courses</h2>
            {userOwnsPathway && (
              <Link
                to={`/dashboard/${params.companyId}/learning-paths/${learningPathData.id}/course/add`}
                className={buttonVariants({ variant: 'secondary', size: 'sm' })}
              >
                Add <Plus />
              </Link>
            )}
          </div>
          {learningPathData.courses?.length ? (
            learningPathData.courses.map(({ id: courseId, name, signed_url }) => (
              <div key={courseId} className='flex items-center justify-between'>
                <Link
                  to={`/dashboard/${params.companyId}/courses/${courseId}/course-details`}
                  className={cn(
                    'bg-card/20 w-full rounded-lg p-2 transition-colors duration-200',
                    'text-muted-foreground font-secondary hover:bg-primary/5 hover:text-foreground flex items-center space-x-2',
                    {
                      'mr-2': userOwnsPathway,
                    },
                  )}
                >
                  {signed_url ? (
                    <img src={signed_url} alt={name} className='h-6 w-6 rounded-sm' />
                  ) : null}
                  <span>{name}</span>
                </Link>
                {userOwnsPathway && (
                  <ActionLinks
                    deleteLink={`/dashboard/${params.companyId}/learning-paths/${learningPathData.id}/course/${courseId}/remove`}
                  />
                )}
              </div>
            ))
          ) : (
            <NotFoundCard message='No courses added to learning path' />
          )}
        </div>
      </PlainLayout>
    </>
  );
}
