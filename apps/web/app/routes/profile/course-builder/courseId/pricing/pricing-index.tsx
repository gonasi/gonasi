import { Check, Edit, MoreHorizontal, Trash2, X } from 'lucide-react';

import { fetchCoursePricing } from '@gonasi/database/courses';

import type { Route } from './+types/pricing-index';

import { BannerCard, NotFoundCard } from '~/components/cards';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const pricing = await fetchCoursePricing({ supabase, courseId });
  return { pricing };
}

export default function CoursePricing({ loaderData }: Route.ComponentProps) {
  const { pricing } = loaderData;

  if (!pricing?.length) {
    return (
      <div className='mx-auto max-w-3xl'>
        <NotFoundCard message='No course pricing found' />
      </div>
    );
  }

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <Badge variant={isActive ? 'success' : 'error'}>
      {isActive ? <Check /> : <X />} {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const PromoSection = ({ price }: { price: (typeof pricing)[0] }) => {
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
          <Badge variant='secondary'>Special price</Badge>
          <div className='mt-1 text-sm'>
            {formatCurrency(price.promotional_price, price.currency_code)}
          </div>
        </>
      );
    }

    return <span className='text-muted-foreground'>None</span>;
  };

  const PriceCell = ({ price }: { price: (typeof pricing)[0] }) => {
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

  const FlagBadges = ({ price }: { price: (typeof pricing)[0] }) => (
    <div className='flex flex-col gap-1'>
      {price.is_popular && <Badge variant='outline'>Popular</Badge>}
      {price.is_recommended && <Badge variant='outline'>Recommended</Badge>}
    </div>
  );

  return (
    <div className='mx-auto max-w-3xl'>
      <BannerCard
        message='Your new prices go live instantly, no need to hit publish!'
        description='Just updating the price? It updates right away. Only content changes need publishing.'
        variant='info'
        className='mb-10'
      />

      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Course Details</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Promotion</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pricing.map((price) => (
            <TableRow key={price.id}>
              <TableCell className='font-medium'>
                <StatusBadge isActive={price.is_active} />
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <div>
                    <div className='font-medium'>{price.tier_name || 'Unnamed Tier'}</div>
                    <div className='text-muted-foreground font-secondary text-sm capitalize'>
                      {price.payment_frequency}
                    </div>
                  </div>
                  {price.is_free && <Badge variant='outline'>Free Course</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <PriceCell price={price} />
              </TableCell>
              <TableCell>
                <PromoSection price={price} />
              </TableCell>
              <TableCell>
                <FlagBadges price={price} />
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
    </div>
  );
}
