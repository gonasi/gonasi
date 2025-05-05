import { useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

import type { PluginId } from './pluginData';
import PluginTypeRenderer from './pluginRenderer';
import { usePluginOptions } from './usePluginOptions';

import { NotFoundCard } from '~/components/cards';
import { Input } from '~/components/ui/input';
import { useStore } from '~/store';

export function GoPluginsMenuDialog() {
  const { activePlugin, updateActivePlugin } = useStore();
  const [query, setQuery] = useState('');
  const categories = usePluginOptions(query);

  return (
    <div>
      {activePlugin ? (
        <PluginTypeRenderer />
      ) : (
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
              onChange={(e) => setQuery(e.target.value)}
              className='mb-4 rounded-full'
              leftIcon={<LucideIcons.Search />}
              rightIcon={query ? <LucideIcons.CircleX onClick={() => setQuery('')} /> : null}
            />
          </motion.div>

          <motion.div
            initial='hidden'
            animate='visible'
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {categories.length ? (
              categories.map((cat) => (
                <motion.div key={cat.id} className='mb-6'>
                  <motion.h3
                    className='text-primary mb-2 text-lg font-semibold'
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {cat.name}
                  </motion.h3>
                  <div className='grid gap-3'>
                    {cat.plugins.map((plugin) => {
                      const Icon = LucideIcons[plugin.icon as keyof typeof LucideIcons] as
                        | LucideIcons.LucideIcon
                        | undefined;

                      const FallbackIcon = LucideIcons.Square;
                      const ResolvedIcon = Icon ?? FallbackIcon;

                      return (
                        <motion.button
                          type='button'
                          key={plugin.id}
                          className='hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out hover:shadow-sm'
                          onClick={() => updateActivePlugin(plugin.id as PluginId)}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className='bg-muted-foreground/5 border-primary/5 rounded-sm border p-2 transition-colors duration-200'>
                            <ResolvedIcon className='text-primary' />
                          </div>
                          <div>
                            <div className='font-secondary font-semibold'>{plugin.name}</div>
                            <div className='text-muted-foreground font-secondary text-sm'>
                              {plugin.description}
                            </div>
                          </div>
                        </motion.button>
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
      )}
    </div>
  );
}
