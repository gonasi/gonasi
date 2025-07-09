import { NavLink, useParams } from 'react-router';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

import type { PluginType } from '@gonasi/schemas/plugins';

import { Badge } from '../ui/badge';

import { cn } from '~/lib/utils';

const MotionNavLink = motion(NavLink);

const fadeInUpProps = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

interface GonasiPluginGroupProps {
  pluginTypes: PluginType[] | undefined;
}

export default function GoPluginsMenuDialog({ pluginTypes }: GonasiPluginGroupProps) {
  const params = useParams();

  const getResolvedIcon = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as
      | LucideIcons.LucideIcon
      | undefined;
    return Icon ?? LucideIcons.Square;
  };

  const basePath = `/${params.organizationId}/builder/${params.courseId}/content`;
  const pluginGroupBasePath = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks/plugins/${params.pluginGroupId}`;

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {pluginTypes && pluginTypes.length ? (
        pluginTypes.map(({ id, name, description, icon, comingSoon }) => {
          const ResolvedIcon = getResolvedIcon(icon);

          return (
            <MotionNavLink
              key={id}
              to={`${pluginGroupBasePath}/${id}/create`}
              className={({ isPending }) =>
                cn(
                  'hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out hover:shadow-sm',
                  comingSoon && 'hover:cursor-not-allowed hover:bg-none hover:shadow-none',
                  isPending && 'bg-primary/10 pointer-events-none opacity-60',
                )
              }
              onClick={(e) => {
                if (comingSoon) e.preventDefault();
              }}
              tabIndex={comingSoon ? -1 : 0} // prevent keyboard focus if disabled
              aria-disabled={comingSoon ? 'true' : 'false'}
              {...fadeInUpProps}
            >
              {({ isPending }) => (
                <>
                  <div className='bg-muted-foreground/5 border-primary/5 rounded-sm border p-2 transition-colors duration-200'>
                    {isPending ? (
                      <LucideIcons.LoaderCircle className='text-primary animate-spin' />
                    ) : (
                      <ResolvedIcon className='text-primary' />
                    )}
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <div className='font-secondary font-semibold'>{name}</div>
                      {comingSoon && <Badge variant='outline'>Coming Soon</Badge>}
                    </div>
                    <div className='text-muted-foreground font-secondary text-sm'>
                      {description}
                    </div>
                  </div>
                </>
              )}
            </MotionNavLink>
          );
        })
      ) : (
        <p>not found</p>
      )}
    </motion.div>
  );
}
