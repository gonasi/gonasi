import { DollarSign } from 'lucide-react';

import { Card, CardContent } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

export function TotalEarningsCard() {
  return (
    <Card className='border-border/50 rounded-none'>
      <CardContent className='p-6'>
        <Tabs defaultValue='account'>
          <TabsList>
            <TabsTrigger value='account'>Account</TabsTrigger>
            <TabsTrigger value='password'>Password</TabsTrigger>
          </TabsList>
          <TabsContent value='account'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-muted-foreground mb-1 text-sm font-medium'>Total Earnings</p>
                <h3 className='text-foreground mb-2 text-3xl font-bold'>$48,392</h3>
                <p className='text-muted-foreground text-sm'>From all courses</p>
                <div className='mt-2 flex items-center gap-1'>
                  <span className='text-success text-xs font-medium'>↑ $3,240</span>
                  <span className='text-muted-foreground text-xs'>this month</span>
                </div>
              </div>
              <div className='bg-success/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                <DollarSign className='text-success h-6 w-6' />
              </div>
            </div>
          </TabsContent>
          <TabsContent value='password'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-muted-foreground mb-1 text-sm font-medium'>Total Earnings</p>
                <h3 className='text-foreground mb-2 text-3xl font-bold'>$48,392</h3>
                <p className='text-muted-foreground text-sm'>From all courses</p>
                <div className='mt-2 flex items-center gap-1'>
                  <span className='text-success text-xs font-medium'>↑ $3,240</span>
                  <span className='text-muted-foreground text-xs'>this month</span>
                </div>
              </div>
              <div className='bg-success/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                <DollarSign className='text-success h-6 w-6' />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
