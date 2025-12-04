import { CheckCircle2, DollarSign } from 'lucide-react';

import { Badge } from '~/components/ui/badge/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';

interface PricingTier {
  id: string;
  tier_name: string | null;
  tier_description: string | null;
  is_free: boolean;
  price: number;
  currency_code: string;
  payment_frequency: string;
  promotional_price: number | null;
  promotion_start_date: string | null;
  promotion_end_date: string | null;
  is_popular: boolean;
  is_recommended: boolean;
  is_active: boolean;
}

interface PricingTiersProps {
  pricing_tiers: PricingTier[];
}

export function PricingTiers({ pricing_tiers }: PricingTiersProps) {
  if (!pricing_tiers || pricing_tiers.length === 0) {
    return null;
  }

  return (
    <Card className='rounded-none'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <DollarSign className='size-5' />
          <CardTitle>Pricing Tiers</CardTitle>
        </div>
        <CardDescription>Available pricing options for this course</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {pricing_tiers.map((tier) => (
            <div key={tier.id} className='border-border flex flex-col gap-3 rounded-lg border p-4'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-semibold capitalize'>{tier.tier_name || 'Unnamed Tier'}</h3>
                  {tier.tier_description && (
                    <p className='text-muted-foreground text-xs'>{tier.tier_description}</p>
                  )}
                </div>
                <div className='flex gap-1'>
                  {tier.is_popular && (
                    <Badge variant='success' className='text-xs'>
                      Popular
                    </Badge>
                  )}
                  {tier.is_recommended && (
                    <Badge variant='info' className='text-xs'>
                      Recommended
                    </Badge>
                  )}
                </div>
              </div>

              <div className='flex items-baseline gap-1'>
                <span className='text-2xl font-bold'>
                  {tier.is_free ? 'Free' : `${tier.currency_code} ${tier.price}`}
                </span>
                {!tier.is_free && (
                  <span className='text-muted-foreground text-sm'>/{tier.payment_frequency}</span>
                )}
              </div>

              {tier.promotional_price && (
                <div className='text-success text-sm'>
                  Promo: {tier.currency_code} {tier.promotional_price}
                  {tier.promotion_start_date && tier.promotion_end_date && (
                    <div className='text-muted-foreground text-xs'>
                      Valid until {new Date(tier.promotion_end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <Badge variant={tier.is_active ? 'success' : 'outline'} className='w-fit'>
                {tier.is_active ? (
                  <>
                    <CheckCircle2 className='size-3' /> Active
                  </>
                ) : (
                  'Inactive'
                )}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
