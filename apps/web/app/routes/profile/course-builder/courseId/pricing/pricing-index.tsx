import { Outlet } from 'react-router';
import { Check, Edit, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';

import { fetchAvailablePaymentFrequencies, fetchCoursePricing } from '@gonasi/database/courses';

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
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { createClient } from '~/lib/supabase/supabase.server';
import { formatCurrency } from '~/utils/format-currency';

export function meta() {
  return [
    { title: 'Course Pricing Overview | Gonasi' },
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

  return { pricingData, isPaid, availableFrequencies };
}

export default function CoursePricing({ loaderData, params }: Route.ComponentProps) {
  const { pricingData, isPaid, availableFrequencies } = loaderData;

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
    if (price.discount_percentage) {
      return (
        <>
          <Badge variant='secondary'>{price.discount_percentage}% off</Badge>
          {price.promotional_price && (
            <div className='mt-1 text-sm'>
              {formatCurrency(price.promotional_price, price.currency_code)}
            </div>
          )}
        </>
      );
    }

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
      {price.is_popular && <Badge variant='outline'>Popular</Badge>}
      {price.is_recommended && <Badge variant='outline'>Recommended</Badge>}
    </div>
  );

  return (
    <div className='mx-auto max-w-3xl'>
      <BannerCard
        message='Your pricing updates are live immediately!'
        description='Price updates are applied instantly. No need to publish. Content changes still require publishing.'
        variant='info'
        className='mb-10'
      />
      <div className='flex items-end justify-between py-4'>
        <CourseToggle isPaidState={isPaid} />
        {isPaid || (availableFrequencies && availableFrequencies.length) ? (
          <NavLinkButton
            variant='secondary'
            to={`/${params.username}/course-builder/${params.courseId}/pricing/manage-pricing-tier/add-new-tier`}
            leftIcon={<Plus />}
            disabled={!isPaid}
          >
            Add Pricing Tier
          </NavLinkButton>
        ) : null}
      </div>
      <Table>
        <TableCaption>A list of pricing options for this course</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Tier Details</TableHead>
            <TableHead>Base Price</TableHead>
            <TableHead>Promotions</TableHead>
            <TableHead>Highlights</TableHead>
            <TableHead className='w-[70px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pricingData.map((priceTier) => (
            <TableRow key={priceTier.id}>
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
              <TableCell className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                      <span className='sr-only'>Open menu</span>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => {}}>
                      <Edit className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Outlet context={{ isPaid, availableFrequencies }} />
    </div>
  );
}
