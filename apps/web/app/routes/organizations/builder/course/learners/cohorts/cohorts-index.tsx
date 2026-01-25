import { Link, Outlet } from 'react-router';
import { Calendar, Edit, MoreVertical, Plus, Trash2, Users, UsersRound } from 'lucide-react';

import { fetchCohortsForCourse } from '@gonasi/database/cohorts';

import type { Route } from './+types/cohorts-index';

import { Badge } from '~/components/ui/badge/badge';
import { Button, NavLinkButton } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Cohorts • Gonasi' },
    { name: 'description', content: 'Manage learner cohorts for this course' },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const cohorts = await fetchCohortsForCourse(supabase, params.courseId);

  return { cohorts };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CohortsIndex({ loaderData, params }: Route.ComponentProps) {
  const { cohorts } = loaderData;

  return (
    <>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>Cohorts</h2>
            <p className='text-muted-foreground hidden text-sm md:flex'>
              Organize learners into cohorts for better management
            </p>
          </div>
          <div>
            <NavLinkButton
              to={`/${params.organizationId}/builder/${params.courseId}/learners/cohorts/new`}
              leftIcon={<Plus />}
            >
              New Cohort
            </NavLinkButton>
          </div>
        </div>

        {cohorts.length === 0 ? (
          <Card className='rounded-none'>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <UsersRound className='text-muted-foreground mb-4 size-12' />
              <h3 className='mb-2 text-lg font-semibold'>No cohorts yet</h3>
              <p className='text-muted-foreground font-secondary mb-4 text-center text-sm'>
                Create your first cohort to organize learners into groups
              </p>
              <div>
                <NavLinkButton
                  to={`/${params.organizationId}/builder/${params.courseId}/learners/cohorts/new`}
                  leftIcon={<Plus />}
                >
                  Create Cohort
                </NavLinkButton>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            {cohorts.map((cohort) => (
              <Card key={cohort.id} className='relative rounded-none'>
                {/* Status badge – pinned top left */}
                <Badge
                  variant={cohort.is_active ? 'success' : 'outline'}
                  className='absolute -top-2 left-0 z-10'
                >
                  {cohort.is_active ? 'Active' : 'Inactive'}
                </Badge>

                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='mb-1 text-base'>{cohort.name}</CardTitle>

                      {cohort.description && (
                        <CardDescription className='line-clamp-2 text-xs'>
                          {cohort.description}
                        </CardDescription>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='size-8'>
                          <MoreVertical className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/${params.organizationId}/builder/${params.courseId}/learners/cohorts/${cohort.id}/edit`}
                          >
                            <Edit className='size-4' />
                            Edit
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            to={`/${params.organizationId}/builder/${params.courseId}/learners/cohorts/${cohort.id}/delete`}
                            className='text-destructive focus:text-destructive'
                          >
                            <Trash2 className='size-4' />
                            Delete
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center gap-1.5'>
                      <Users className='text-muted-foreground size-4' />
                      <span className='text-muted-foreground'>Enrolled:</span>
                    </div>

                    <span className='font-medium'>
                      {cohort.current_enrollment_count}
                      {cohort.max_enrollment ? ` / ${cohort.max_enrollment}` : ''}
                    </span>
                  </div>

                  {(cohort.start_date || cohort.end_date) && (
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex items-center gap-1.5'>
                        <Calendar className='text-muted-foreground size-4' />
                        <span className='text-muted-foreground'>Duration:</span>
                      </div>

                      <span className='text-xs'>
                        {formatDate(cohort.start_date)} - {formatDate(cohort.end_date)}
                      </span>
                    </div>
                  )}

                  <div className='flex items-center justify-end'>
                    <NavLinkButton
                      to={`/${params.organizationId}/builder/${params.courseId}/learners/cohorts/${cohort.id}/assign-users`}
                    >
                      Manage Users
                    </NavLinkButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Outlet />
    </>
  );
}
