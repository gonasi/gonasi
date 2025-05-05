import { useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { differenceInMinutes, format, isPast } from 'date-fns';
import { CheckCircle, Clock, Mail, RefreshCw, XCircle } from 'lucide-react';

import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { PaginationBar } from '~/components/search-params/pagination-bar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { StaffInvitesLoaderReturnType } from '~/routes/dashboard/team-management/staff-invites';

interface Props {
  loaderData: StaffInvitesLoaderReturnType;
}
export function InviteCard({ loaderData }: Props) {
  const { data, count } = loaderData;
  const params = useParams();
  const fetcher = useFetcher();

  const [loading, setLoading] = useState(false);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
      setActiveInviteId(null);
    }
  }, [fetcher.state, fetcher.data]);

  const handleResend = (inviteId: string) => {
    const formData = new FormData();
    setActiveInviteId(inviteId);
    formData.append('inviteId', inviteId);

    fetcher.submit(formData, {
      method: 'post',
      action: `/dashboard/${params.companyId}/team-management/staff-invites`,
    });
  };

  return (
    <div>
      {data && data.length ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {data.map((user) => {
            const isExpired = user.expires_at ? isPast(new Date(user.expires_at)) : false;

            const getStatusColor = () => {
              if (user.is_confirmed) return 'bg-success text-success-foreground';
              if (isExpired) return 'bg-danger text-danger-foreground';
              return 'bg-tip text-tip-foreground';
            };

            const getStatusText = () => {
              if (user.is_confirmed) return 'Confirmed';
              if (isExpired) return 'Expired';
              return 'Pending';
            };

            const getStatusIcon = () => {
              if (user.is_confirmed) return <CheckCircle className='mr-1 h-4 w-4' />;
              if (isExpired) return <XCircle className='mr-1 h-4 w-4' />;
              return <Clock className='mr-1 h-4 w-4' />;
            };

            const lastResentAt = user.last_resent_at ? new Date(user.last_resent_at) : null;
            const minutesSinceLastResend = lastResentAt
              ? differenceInMinutes(new Date(), lastResentAt)
              : Infinity;
            const isCooldownActive = lastResentAt !== null && minutesSinceLastResend < 5;
            const isResendLimitReached = user.resend_count >= 3;
            const isDisabled = isResendLimitReached || isCooldownActive; // Always a boolean

            const tooltipMessage = isResendLimitReached
              ? 'Maximum resend attempts for the day reached.'
              : isCooldownActive
                ? `Please wait ${5 - minutesSinceLastResend} ${5 - minutesSinceLastResend === 1 ? 'minute' : 'minutes'} before resending.`
                : null;

            return (
              <div key={user.id}>
                <TooltipProvider>
                  <Card
                    className={cn(
                      'border-l-tip w-full max-w-md border-l-4 transition-shadow hover:shadow-md',
                      {
                        'border-l-success': user.is_confirmed,
                        'border-l-danger': isExpired,
                      },
                    )}
                  >
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <Badge
                          variant='outline'
                          className={`flex items-center border-transparent ${getStatusColor()}`}
                        >
                          {getStatusIcon()}
                          {getStatusText()}
                        </Badge>
                        {user.resend_count > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='text-muted-foreground flex items-center text-xs'>
                                <RefreshCw className='mr-1 h-3 w-3' />
                                Resent {user.resend_count}{' '}
                                {user.resend_count === 1 ? 'time' : 'times'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {user.last_resent_at && (
                                <p>
                                  Last resent:{' '}
                                  {format(new Date(user.last_resent_at), 'MMM d, yyyy')}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        <div className='flex items-center'>
                          <Mail className='text-muted-foreground mr-2 h-4 w-4' />
                          <span className='font-medium'>{user.invited_email}</span>
                        </div>

                        <div className='flex items-center'>
                          <span className='text-muted-foreground flex items-center space-x-2 text-sm'>
                            <span>Invited by: </span>
                            <UserAvatar
                              username={user.invited_by_profile.username}
                              imageUrl={user.invited_by_profile.avatar_url}
                              size='sm'
                            />
                          </span>
                        </div>

                        <div className='grid grid-cols-2 gap-2 text-sm'>
                          <div>
                            <p className='text-muted-foreground font-secondary'>Invited on</p>
                            <p>{format(new Date(user.invited_at), 'MMM d, yyyy')}</p>
                          </div>

                          {user.is_confirmed && user.confirmed_at ? (
                            <div>
                              <p className='text-muted-foreground font-secondary'>Confirmed on</p>
                              <p>{format(new Date(user.confirmed_at), 'MMM d, yyyy')}</p>
                            </div>
                          ) : (
                            <div>
                              <p className='text-muted-foreground font-secondary'>Expires on</p>
                              <p className={isExpired ? 'text-danger' : ''}>
                                {format(new Date(user.expires_at), 'MMM d, yyyy, h:mm a')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className='px-8'>
                      {user.is_confirmed ? (
                        <div className='py-4' />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='secondary'
                              size='sm'
                              className='ml-auto'
                              leftIcon={isCooldownActive ? <Clock /> : <RefreshCw />}
                              onClick={isDisabled ? undefined : () => handleResend(user.id)}
                              isLoading={user.id === activeInviteId && loading}
                            >
                              Resend Invitation
                            </Button>
                          </TooltipTrigger>
                          {tooltipMessage && <TooltipContent>{tooltipMessage}</TooltipContent>}
                        </Tooltip>
                      )}
                    </CardFooter>
                  </Card>
                </TooltipProvider>
              </div>
            );
          })}

          <PaginationBar totalItems={count ?? 0} itemsPerPage={12} />
        </div>
      ) : (
        <NotFoundCard message='No staff found' />
      )}
    </div>
  );
}
