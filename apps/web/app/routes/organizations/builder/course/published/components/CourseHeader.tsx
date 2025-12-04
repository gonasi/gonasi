import { BookOpen, Calendar, Eye, EyeOff, Users } from 'lucide-react';

import { Badge } from '~/components/ui/badge/badge';
import { Card, CardContent } from '~/components/ui/card/card';

interface CourseHeaderProps {
  name: string;
  description: string;
  image_url: string | null;
  visibility: string;
  is_active: boolean | null;
  published_at: string | null;
  has_free_tier: boolean | null;
  course_categories?: { name: string } | null;
  course_sub_categories?: { name: string } | null;
  organizations?: { name: string } | null;
}

export function CourseHeader({
  name,
  description,
  image_url,
  visibility,
  is_active,
  published_at,
  has_free_tier,
  course_categories,
  course_sub_categories,
  organizations,
}: CourseHeaderProps) {
  return (
    <Card className='rounded-none'>
      <CardContent className='pt-6'>
        <div className='flex flex-col gap-6 md:flex-row'>
          {/* Course Image */}
          {image_url && (
            <div className='flex-shrink-0'>
              <img
                src={image_url}
                alt={name}
                className='h-48 w-full rounded-lg object-cover md:w-64'
              />
            </div>
          )}

          {/* Course Info */}
          <div className='flex flex-1 flex-col gap-4'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div className='flex flex-col gap-2'>
                <h1 className='text-2xl font-bold'>{name}</h1>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant={visibility === 'public' ? 'success' : 'warning'}>
                    {visibility === 'public' ? (
                      <>
                        <Eye className='size-3' /> Public
                      </>
                    ) : (
                      <>
                        <EyeOff className='size-3' /> Private
                      </>
                    )}
                  </Badge>
                  <Badge variant={is_active === true ? 'success' : 'outline'}>
                    {is_active === true ? 'Active' : 'Inactive'}
                  </Badge>
                  {has_free_tier === true && <Badge variant='info'>Free Tier Available</Badge>}
                </div>
              </div>
            </div>

            <p className='text-muted-foreground text-sm'>{description}</p>

            <div className='flex flex-wrap gap-4 text-sm'>
              <div className='flex items-center gap-2'>
                <BookOpen className='text-muted-foreground size-4' />
                <span>
                  {course_categories?.name} • {course_sub_categories?.name}
                </span>
              </div>
              {organizations && (
                <div className='flex items-center gap-2'>
                  <Users className='text-muted-foreground size-4' />
                  <span>{organizations.name}</span>
                </div>
              )}
              {published_at && (
                <div className='flex items-center gap-2'>
                  <Calendar className='text-muted-foreground size-4' />
                  <span>Published {new Date(published_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
