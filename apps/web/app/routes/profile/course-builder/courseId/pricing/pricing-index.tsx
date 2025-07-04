import { useEffect, useState } from 'react';
import { data, NavLink, Outlet, useFetcher } from 'react-router';
import { Reorder, useDragControls } from 'framer-motion';
import { Check, Edit, GripVerticalIcon, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import {
  fetchAvailablePaymentFrequencies,
  fetchCoursePricing,
  updatePricingTierPositions,
} from '@gonasi/database/courses';
import { CourseTierPositionUpdateArraySchema } from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/pricing-index';

import { BannerCard, NotFoundCard } from '~/components/cards';
import { CourseToggle } from '~/components/cards/course-toggle';
import { Badge } from '~/components/ui/badge';
import { Button, NavLinkButton } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Table,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { ReorderIconTooltip } from '~/components/ui/tooltip/ReorderIconToolTip';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { formatCurrency } from '~/utils/format-currency';

export function meta() {
  return [
    { title: 'Course Pricing Overview • Gonasi' },
    {
      name: 'description',
      content:
        'View and manage all pricing tiers for your courses on Gonasi. Compare free and paid options, set access levels, and optimize your course monetization strategy.',
    },
  ];
}

export type CoursePricingleLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['pricingData'];

export type AvailableFrequenciesLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['availableFrequencies'];

type CoursePricingType = NonNullable<CoursePricingleLoaderReturnType>[number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const [pricingData, availableFrequencies] = await Promise.all([
    fetchCoursePricing({ supabase, courseId }),
    fetchAvailablePaymentFrequencies({ supabase, courseId }),
  ]);

  const isPaid = Array.isArray(pricingData)
    ? pricingData.some((item) => item.is_free === false)
    : false;

  const hasInactiveTier = Array.isArray(pricingData)
    ? pricingData.some((item) => item.is_active === false)
    : false;

  return { pricingData, isPaid, availableFrequencies, hasInactiveTier };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const pricingTiersRaw = formData.get('pricingTiers');

  if (typeof pricingTiersRaw !== 'string') {
    throw new Response('Invalid data', { status: 400 });
  }

  // Validate the blocks position data using Zod schema
  const parsed = CourseTierPositionUpdateArraySchema.safeParse(JSON.parse(pricingTiersRaw));

  if (!parsed.success) {
    console.error(parsed.error);
    throw new Response('Validation failed', { status: 400 });
  }

  // Update positions in DB
  const result = await updatePricingTierPositions({
    supabase,
    courseId: params.courseId,
    pricingTierPositions: parsed.data,
  });

  return result.success
    ? data({ success: true })
    : dataWithError(null, result.message ?? 'Could not re-order pricing tiers');
}

export default function CoursePricing({ loaderData, params }: Route.ComponentProps) {
  const { pricingData, isPaid, availableFrequencies, hasInactiveTier } = loaderData;
  const fetcher = useFetcher();

  const [reorderedPricingTiers, setReorderedPricingTiers] = useState<CoursePricingType[]>(
    pricingData ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coursePricingTierDragControls = useDragControls();

  useEffect(() => {
    setReorderedPricingTiers(pricingData ?? []);
  }, [pricingData]);

  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  function handleReorder(updated: CoursePricingType[]) {
    setReorderedPricingTiers(updated);

    const orderedData = updated.map((chapter, index) => ({
      id: chapter.id,
      position: index + 1,
    }));

    const formData = new FormData();
    formData.append('pricingTiers', JSON.stringify(orderedData));

    fetcher.submit(formData, { method: 'post' });
  }

  if (!pricingData?.length) {
    return (
      <div className='mx-auto max-w-3xl'>
        <NotFoundCard message='No pricing tiers found for this course' />
      </div>
    );
  }

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <Badge variant={isActive ? 'success' : 'error'}>
      {isActive ? <Check /> : <X />} {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const PromoDetails = ({ price }: { price: CoursePricingType }) => {
    if (price.promotional_price) {
      return (
        <>
          <Badge variant='secondary'>Promo price</Badge>
          <div className='mt-1 text-sm'>
            {formatCurrency(price.promotional_price, price.currency_code)}
          </div>
        </>
      );
    }

    return <span className='text-muted-foreground'>No promotions</span>;
  };

  const PriceInfo = ({ price }: { price: CoursePricingType }) => {
    if (price.is_free) {
      return (
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>FREE</Badge>
          <span className='text-muted-foreground text-sm'>No cost</span>
        </div>
      );
    }

    return (
      <div className='flex flex-col'>
        <span className='font-medium'>{formatCurrency(price.price, price.currency_code)}</span>
        {price.promotional_price && (
          <span className='text-success text-sm font-medium'>
            Promo: {formatCurrency(price.promotional_price, price.currency_code)}
          </span>
        )}
      </div>
    );
  };

  const FeatureFlags = ({ price }: { price: CoursePricingType }) => (
    <div className='flex flex-col gap-1'>
      {price.is_popular && <Badge variant='tip'>Popular</Badge>}
      {price.is_recommended && <Badge variant='info'>Recommended</Badge>}
    </div>
  );

  return (
    <div className='mx-auto max-w-3xl'>
      {hasInactiveTier ? (
        <BannerCard
          message='Some tiers are inactive'
          description="Inactive tiers won't be visible to users when the course is published. Please review them before publishing."
          variant='error'
          className='mb-10'
        />
      ) : null}

      <div className='flex w-full items-end justify-between py-4'>
        <CourseToggle isPaidState={isPaid} />
        <div>
          {isPaid ? (
            <NavLinkButton
              variant='secondary'
              to={`/${params.username}/course-builder/${params.courseId}/pricing/manage-pricing-tier/add-new-tier`}
              leftIcon={<Plus />}
              disabled={!isPaid || !availableFrequencies || availableFrequencies?.length === 0}
            >
              Add Pricing Tier
            </NavLinkButton>
          ) : null}
        </div>
      </div>
      <Table>
        <TableCaption>A list of pricing options for this course</TableCaption>
        <TableHeader>
          <TableRow className='border-border/60'>
            <TableHead />
            <TableHead>Status</TableHead>
            <TableHead>Tier Details</TableHead>
            <TableHead>Base Price</TableHead>
            <TableHead>Promotions</TableHead>
            <TableHead>Highlights</TableHead>
            {isPaid ? <TableHead className='w-[70px] text-right'>Actions</TableHead> : null}
          </TableRow>
        </TableHeader>

        <Reorder.Group
          axis='y'
          values={reorderedPricingTiers}
          onReorder={handleReorder}
          as='tbody'
          className={cn('[&_tr:last-child]:border-0')}
        >
          {reorderedPricingTiers.map((priceTier) => (
            <Reorder.Item
              value={priceTier}
              key={priceTier.id}
              id={priceTier.id}
              as='tr'
              className={cn(
                'data-[state=selected]:bg-muted border-border/60 border-b transition-colors',
                isSubmitting && 'animate-pulse hover:cursor-wait',
              )}
            >
              <TableCell className='px-0'>
                <ReorderIconTooltip
                  title='Drag and drop to pricing tiers'
                  icon={GripVerticalIcon}
                  disabled={isSubmitting}
                  dragControls={coursePricingTierDragControls}
                  className='border-border/60 border bg-transparent'
                />
              </TableCell>
              <TableCell className='font-medium'>
                <StatusBadge isActive={priceTier.is_active} />
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <div>
                    <div className='font-medium'>{priceTier.tier_name || 'Unnamed Tier'}</div>
                    <div className='text-muted-foreground font-secondary text-sm capitalize'>
                      {priceTier.payment_frequency}
                    </div>
                  </div>
                  {priceTier.is_free && <Badge variant='outline'>Free</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <PriceInfo price={priceTier} />
              </TableCell>
              <TableCell>
                <PromoDetails price={priceTier} />
              </TableCell>
              <TableCell>
                <FeatureFlags price={priceTier} />
              </TableCell>
              {isPaid ? (
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem className='w-full'>
                        <NavLink
                          to={`/${params.username}/course-builder/${params.courseId}/pricing/manage-pricing-tier/${priceTier.id}`}
                          className={cn('flex h-full w-full items-center space-x-4')}
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Edit
                        </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem className='w-full'>
                        <NavLink
                          to={`/${params.username}/course-builder/${params.courseId}/pricing/manage-pricing-tier/${priceTier.id}/delete`}
                          className={cn('flex w-full items-center space-x-4')}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Delete
                        </NavLink>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              ) : null}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </Table>
      <Outlet context={{ isPaid, availableFrequencies }} />
    </div>
  );
}
