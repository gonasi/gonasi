import { Link, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { BookOpen, History, MailPlus, Pencil, Rocket, Users } from 'lucide-react';

import { timeAgo } from '@gonasi/utils/timeAgo';

import { buttonVariants, NavLinkButton } from '../ui/button';

interface Props {
  name: string;
  description: string | null;
  editLink?: string;
  errorMessage?: string[];
  updatedAt: string;
  canEditCourse: boolean;
  visibility: 'public' | 'private' | 'unlisted';
}

const AnimatedRocket = () => (
  <motion.div
    animate={{
      x: [0, 5, 0, 5, 0], // move right-up twice, then back
      y: [0, -5, 0, -5, 0], // move up-right twice, then back
    }}
    transition={{
      duration: 1, // total animation time
      times: [0, 0.2, 0.4, 0.6, 1], // control frame pacing
      repeat: Infinity,
      repeatDelay: 5, // wait 5s after each loop
      ease: 'easeInOut',
    }}
  >
    <Rocket />
  </motion.div>
);

export function CourseOverview({
  name,
  description,
  canEditCourse,
  editLink,
  updatedAt,
  visibility,
}: Props) {
  const params = useParams();

  const canPublish = canEditCourse;
  return (
    <div className='flex h-full flex-col justify-between space-y-4'>
      <div>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg md:text-2xl'>{name}</h2>
          {editLink ? (
            <Link to={editLink} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              <Pencil />
            </Link>
          ) : null}
        </div>
        <div className='font-secondary text-muted-foreground py-2 text-sm'>
          <p>{description ? description : 'No description provided...'}</p>
        </div>
        <div className='text-muted-foreground font-secondary flex flex-wrap items-center gap-4 text-sm'>
          <div className='flex items-center gap-1'>
            <BookOpen size={14} />
            <span>0 lessons</span>
          </div>
          <div className='flex items-center gap-1'>
            <Users size={14} />
            <span>0 Collaborators</span>
          </div>
          <div className='flex items-center gap-1'>
            <History size={14} />
            <span>{timeAgo(updatedAt)}</span>
          </div>
          <div className='flex items-center gap-1'>
            {visibility === 'public' ? (
              <>
                <Rocket size={14} />
                <span className='text-green-600'>Public</span>
              </>
            ) : (
              <>
                <MailPlus size={14} />
                <span className='text-yellow-600'>Private</span>
              </>
            )}
          </div>
        </div>
      </div>
      {canPublish ? (
        <div className='w-full'>
          <div className='w-full'>
            <NavLinkButton
              to={`/${params.organizationId}/builder/${params.courseId}/overview/publish`}
              rightIcon={<AnimatedRocket />}
              className='w-full md:w-48'
            >
              Publish
            </NavLinkButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
