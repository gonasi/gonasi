import { BookOpen, Building2, Calendar, CheckCircle2, Clock, Sparkles, Users } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';

interface CourseInviteCardProps {
  courseName: string;
  description: string | null;
  imageUrl: string | null;
  organizationName: string;
  organizationPhotoUrl: string | null;
  categoryName: string | null;
  subCategoryName: string | null;
  publishedAt: string | null;
  cohortName: string | null;
  tierName: string;
  isFree: boolean;
  price: string;
  currencyCode: string;
  expiresAt: string;
}

export function CourseInviteCard({
  courseName,
  description,
  imageUrl,
  organizationName,
  organizationPhotoUrl,
  categoryName,
  subCategoryName,
  publishedAt,
  cohortName,
  tierName,
  isFree,
  price,
  currencyCode,
  expiresAt,
}: CourseInviteCardProps) {
  // Calculate days until expiration
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isExpiringSoon = daysUntilExpiry <= 3;

  return (
    <Card className='overflow-hidden rounded-none p-0'>
      <CardContent className='p-0'>
        {/* Course Image */}
        {imageUrl ? (
          <div className='bg-muted/30 relative aspect-video w-full overflow-hidden'>
            <img src={imageUrl} alt={courseName} className='h-full w-full object-cover' />
            <div className='from-background/80 to-background/40 absolute inset-0 bg-gradient-to-t' />
          </div>
        ) : (
          <div className='from-primary/10 to-primary/5 relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gradient-to-br'>
            <BookOpen className='text-muted-foreground/20 size-24' />
          </div>
        )}

        {/* Course Details */}
        <div className='space-y-4 p-4 md:p-8'>
          {/* Title and Description */}
          <div className='space-y-4'>
            <h2 className='text-2xl font-bold md:text-3xl'>{courseName}</h2>
            {description && (
              <p className='text-muted-foreground font-secondary leading-relaxed'>{description}</p>
            )}

            {/* Badges */}
            <div className='flex flex-wrap gap-2'>
              {isFree ? (
                <Badge variant='outline' className='gap-1.5'>
                  <CheckCircle2 className='size-3.5' />
                  Free Access
                </Badge>
              ) : (
                <Badge variant='outline' className='gap-1.5'>
                  <Sparkles className='size-3.5' />
                  {tierName}
                </Badge>
              )}
              {categoryName && (
                <Badge variant='outline' className='gap-1.5'>
                  {categoryName}
                  {subCategoryName && ` • ${subCategoryName}`}
                </Badge>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className='border-border grid gap-4 rounded-lg border p-4 md:grid-cols-2'>
            {/* Organization */}
            <div className='flex items-start gap-3'>
              <div>
                {organizationPhotoUrl ? (
                  <img
                    src={organizationPhotoUrl}
                    alt={organizationName}
                    className='size-8 rounded-full object-cover'
                  />
                ) : (
                  <div className='bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full'>
                    <Building2 className='size-3' />
                  </div>
                )}
              </div>
              <div className='flex-1'>
                <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  Organization
                </p>
                <div className='mt-1 flex items-center gap-2'>
                  <p className='text-sm font-semibold'>{organizationName}</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className='flex items-start gap-3'>
              <div className='bg-success/10 text-success rounded-full p-2'>
                <Sparkles className='size-4' />
              </div>
              <div className='flex-1'>
                <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  Pricing
                </p>
                <p className='mt-1 text-sm font-semibold'>
                  {isFree ? (
                    'Free Access'
                  ) : (
                    <>
                      {currencyCode} {Number(price).toLocaleString()}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Cohort */}
            {cohortName && (
              <div className='flex items-start gap-3'>
                <div className='bg-info/10 text-info rounded-full p-2'>
                  <Users className='size-4' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Cohort
                  </p>
                  <p className='mt-1 text-sm font-semibold'>{cohortName}</p>
                </div>
              </div>
            )}

            {/* Published Date */}
            {publishedAt && (
              <div className='flex items-start gap-3'>
                <div className='bg-muted text-muted-foreground rounded-full p-2'>
                  <Calendar className='size-4' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Published
                  </p>
                  <p className='mt-1 text-sm font-semibold'>
                    {new Date(publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Expiration Warning */}
          <div
            className={`flex items-start gap-3 rounded-lg p-4 ${
              isExpiringSoon ? 'bg-warning/10 border-warning/20 border' : 'bg-muted/50'
            }`}
          >
            <Clock
              className={`size-5 flex-shrink-0 ${isExpiringSoon ? 'text-warning' : 'text-muted-foreground'}`}
            />
            <div className='flex-1'>
              <p className='text-sm font-medium'>
                {isExpiringSoon ? (
                  <>
                    <span className='text-warning'>Expires soon!</span> This invitation expires{' '}
                    {daysUntilExpiry === 0
                      ? 'today'
                      : `in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`}
                  </>
                ) : (
                  <>Invitation expires on {expirationDate.toLocaleDateString()}</>
                )}
              </p>
              <p className='text-muted-foreground mt-1 text-xs'>
                {expirationDate.toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
