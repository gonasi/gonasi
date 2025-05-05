import type { JSX } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

import type { PluginId } from './pluginData';
import { ALL_PLUGINS } from './pluginData';
import { PluginTypesRenderer } from './pluginTypesRenderer';

import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

type PluginCategoryConst = (typeof ALL_PLUGINS)[number];
type PluginConst = PluginCategoryConst['plugins'][number];
type PluginTypeConst = PluginConst['pluginTypes'][number];

export default function PluginTypeRenderer(): JSX.Element {
  const { activePlugin, activeSubPlugin, updateActiveSubPlugin } = useStore();

  function getPluginTypes(id: PluginId | null): Record<string, PluginTypeConst> {
    for (const category of ALL_PLUGINS) {
      const plugin = category.plugins.find((p) => p.id === id);
      if (plugin && plugin.pluginTypes) {
        return plugin.pluginTypes.reduce(
          (acc, type) => {
            acc[type.id] = type;
            return acc;
          },
          {} as Record<string, PluginTypeConst>,
        );
      }
    }
    return {};
  }

  const pluginTypeMap = getPluginTypes(activePlugin);

  return (
    <>
      {activeSubPlugin ? (
        <PluginTypesRenderer name={activeSubPlugin} />
      ) : (
        <motion.div
          className='flex flex-col gap-2'
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
          {Object.entries(pluginTypeMap).map(([key, type]) => {
            const Icon = LucideIcons[type.icon as keyof typeof LucideIcons] as
              | LucideIcons.LucideIcon
              | undefined;

            const FallbackIcon = LucideIcons.Square;
            const ResolvedIcon = Icon ?? FallbackIcon;

            return (
              <motion.button
                type='button'
                key={key}
                className={cn(
                  'hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out hover:shadow-sm',
                  type.comingSoon &&
                    'cursor-not-allowed opacity-50 hover:bg-transparent hover:shadow-none',
                )}
                onClick={() => updateActiveSubPlugin(type.id)}
                disabled={type.comingSoon}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className='bg-muted-foreground/5 border-primary/5 rounded-sm border p-2'>
                  <ResolvedIcon className='text-primary' />
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <div className='font-secondary font-semibold'>{type.name}</div>
                    {type.comingSoon && <Badge variant='outline'>Coming Soon</Badge>}
                  </div>
                  <div className='text-muted-foreground font-secondary text-sm'>
                    {type.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </>
  );
}
