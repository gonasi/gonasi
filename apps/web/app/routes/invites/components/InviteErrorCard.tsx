import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

import { AppLogo } from '~/components/app-logo';
import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';

interface InviteErrorCardProps {
  message: string;
}

export function InviteErrorCard({ message }: InviteErrorCardProps) {
  return (
    <div className='from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='w-full max-w-md space-y-8 text-center'
      >
        <div className='flex justify-center'>
          <AppLogo />
        </div>

        <Card className='border-destructive/20 bg-destructive/5'>
          <CardContent className='space-y-4 pt-6'>
            <div className='bg-destructive/10 text-destructive mx-auto flex size-16 items-center justify-center rounded-full'>
              <Mail className='size-8' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold'>Invalid Invitation</h2>
              <p className='text-muted-foreground text-sm'>{message}</p>
            </div>
            <div className='pt-4'>
              <NavLinkButton to='/' variant='ghost' className='w-full'>
                Go to Home
              </NavLinkButton>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
