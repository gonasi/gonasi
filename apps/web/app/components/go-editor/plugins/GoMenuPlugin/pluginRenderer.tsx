import type { JSX } from 'react';
import type { LexicalEditor } from 'lexical';
import * as LucideIcons from 'lucide-react';

import type { PluginId } from './pluginData';
import { ALL_PLUGINS } from './pluginData';
import { PluginTypesRenderer } from './pluginTypesRenderer';

import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

// Types
type PluginCategoryConst = (typeof ALL_PLUGINS)[number];
type PluginConst = PluginCategoryConst['plugins'][number];
type PluginTypeConst = PluginConst['pluginTypes'][number];

// Renderer Component
interface Props {
  activeEditor: LexicalEditor;
  onClose: () => void;
}

export default function PluginTypeRenderer({ activeEditor, onClose }: Props): JSX.Element {
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
        <PluginTypesRenderer activeEditor={activeEditor} onClose={onClose} />
      ) : (
        <div className='flex flex-col gap-2'>
          {Object.entries(pluginTypeMap).map(([key, type]) => {
            const Icon = LucideIcons[type.icon as keyof typeof LucideIcons] as
              | LucideIcons.LucideIcon
              | undefined;

            const FallbackIcon = LucideIcons.Square;
            const ResolvedIcon = Icon ?? FallbackIcon;

            return (
              <button
                type='button'
                key={key}
                className={cn(
                  'hover:bg-primary/5 bg-card/20 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out hover:shadow-sm',
                  type.comingSoon && 'cursor-not-allowed opacity-50',
                )}
                onClick={() => updateActiveSubPlugin(type.id)}
                disabled={type.comingSoon}
              >
                <div className='bg-muted-foreground/5 border-primary/5 rounded-sm border p-2 transition-colors duration-200'>
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
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
