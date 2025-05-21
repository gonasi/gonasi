import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';
import * as LucideIcons from 'lucide-react';

import { usePluginOptions } from './usePluginOptions';

import { NotFoundCard } from '~/components/cards';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

const MotionNavLink = motion(NavLink);

const fadeInUpProps = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

const MotionHeading = motion.h3;

export default function GoPluginsMenuDialog() {
  const params = useParams();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const categories = usePluginOptions(debouncedQuery);

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 300),
    [],
  );

  useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      debouncedSetQuery(value);
    },
    [debouncedSetQuery],
  );

  const getResolvedIcon = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as
      | LucideIcons.LucideIcon
      | undefined;
    return Icon ?? LucideIcons.Square;
  };

  return (
    <>
      <motion.div
        className='sticky top-11 z-10'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Input
          placeholder='Search for a Go Plugin'
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className='mb-4 rounded-full'
          leftIcon={<LucideIcons.Search />}
          rightIcon={query ? <LucideIcons.CircleX onClick={() => handleQueryChange('')} /> : null}
        />
      </motion.div>

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
        {categories.length ? (
          categories.map((category) => (
            <motion.div key={category.id} className='mb-6'>
              <MotionHeading className='text-primary mb-2 text-lg font-semibold' {...fadeInUpProps}>
                {category.name}
              </MotionHeading>
              <div className='grid gap-3'>
                {category.pluginGroups.map((pluginGroup) => {
                  const ResolvedIcon = getResolvedIcon(pluginGroup.icon);

                  return (
                    <MotionNavLink
                      key={pluginGroup.id}
                      to={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/plugins/${pluginGroup.id}`}
                      className={({ isPending }) =>
                        cn(
                          'hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out hover:shadow-sm',
                          isPending && 'bg-primary/10 pointer-events-none animate-pulse opacity-60',
                        )
                      }
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
                            <div className='font-secondary font-semibold'>{pluginGroup.name}</div>
                            <div className='text-muted-foreground font-secondary text-sm'>
                              {pluginGroup.description}
                            </div>
                          </div>
                        </>
                      )}
                    </MotionNavLink>
                  );
                })}
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <NotFoundCard message='Plugin not found' />
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
