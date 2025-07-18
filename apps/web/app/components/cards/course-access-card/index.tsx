import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

interface ICourseAccessCardProps {
  enrollPath: string;
}

export default function CourseAccessCard({ enrollPath }: ICourseAccessCardProps) {
  return (
    <motion.div
      className='mx-auto max-w-md px-4 py-8'
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
    >
      <motion.div
        className='w-full'
        animate={{
          x: [0, -10, 10, -10, 10, 0],
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <Card className='rounded-none border-none text-center shadow-none'>
          <CardHeader className='pb-4'>
            <motion.div
              className='bg-danger/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Lock className='text-danger h-6 w-6' />
            </motion.div>
            <CardTitle className='text-xl font-semibold'>Course Access Required</CardTitle>
            <CardDescription className='font-secondary text-base'>
              You need to enroll in this course to access the content and materials.
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            <NavLinkButton variant='secondary' className='w-full' size='lg' to={enrollPath}>
              Enroll Now
            </NavLinkButton>
            <p className='text-muted-foreground font-secondary mt-3 text-sm'>
              Already enrolled? Try refreshing the page or{' '}
              <button className='text-secondary underline hover:no-underline'>
                contact support
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
