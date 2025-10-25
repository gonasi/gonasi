import { ArrowUpRight, Crown } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';

export function PlanCard() {
  return (
    <Card className='border-border/50 rounded-none'>
      <CardContent className='p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <div className='flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <p className='text-muted-foreground text-sm font-medium'>Current Plan</p>
              <Badge variant='default' className='bg-gradient-primary'>
                Active
              </Badge>
            </div>
            <h3 className='text-foreground mb-2 text-3xl font-bold'>Pro</h3>
            <p className='text-muted-foreground text-sm'>Advanced features for growing teams</p>
          </div>
          <div className='bg-accent/10 flex h-12 w-12 items-center justify-center rounded-lg'>
            <Crown className='text-accent h-6 w-6' />
          </div>
        </div>

        <div className='mb-4 space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Members</span>
            <span className='text-foreground font-medium'>5 / 25</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>AI Credits</span>
            <span className='text-foreground font-medium'>15,000 / month</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Next Renewal</span>
            <span className='text-foreground font-medium'>Dec 15, 2025</span>
          </div>
        </div>

        <Button className='bg-gradient-primary transition-smooth group w-full hover:opacity-90'>
          Upgrade to Enterprise
          <ArrowUpRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
        </Button>
      </CardContent>
    </Card>
  );
}
