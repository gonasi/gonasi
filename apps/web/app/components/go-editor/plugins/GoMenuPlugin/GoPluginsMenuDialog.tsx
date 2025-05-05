import { useState } from 'react';
import type { LexicalEditor } from 'lexical';
import * as LucideIcons from 'lucide-react';

import { usePluginOptions } from '../../hooks/usePluginOptions';
import type { PluginId } from './pluginData';
import PluginTypeRenderer from './pluginRenderer';

import { NotFoundCard } from '~/components/cards';
import { Input } from '~/components/ui/input';
import { useStore } from '~/store';

interface Props {
  activeEditor: LexicalEditor;
  onClose: () => void;
}

export function GoPluginsMenuDialog({ activeEditor, onClose }: Props) {
  const { activePlugin, updateActivePlugin } = useStore();

  const [query, setQuery] = useState('');
  const categories = usePluginOptions(query);

  return (
    <div>
      {activePlugin ? (
        <PluginTypeRenderer activeEditor={activeEditor} onClose={onClose} />
      ) : (
        <>
          <div className='sticky top-11 z-10'>
            <Input
              placeholder='Search for a Go Plugin'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='mb-4 rounded-full'
              leftIcon={<LucideIcons.Search />}
              rightIcon={query ? <LucideIcons.CircleX onClick={() => setQuery('')} /> : null}
            />
          </div>
          <div>
            {categories.length ? (
              categories.map((cat) => (
                <div key={cat.id} className='mb-6'>
                  <h3 className='text-primary mb-2 text-lg font-semibold'>{cat.name}</h3>
                  <div className='grid gap-3'>
                    {cat.plugins.map((plugin) => {
                      const Icon = LucideIcons[plugin.icon as keyof typeof LucideIcons] as
                        | LucideIcons.LucideIcon
                        | undefined;

                      const FallbackIcon = LucideIcons.Square;
                      const ResolvedIcon = Icon ?? FallbackIcon;

                      return (
                        <button
                          type='button'
                          key={plugin.id}
                          className='hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out hover:shadow-sm'
                          onClick={() => updateActivePlugin(plugin.id as PluginId)}
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
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <NotFoundCard message='Plugin not found' />
            )}
          </div>
        </>
      )}
    </div>
  );
}
