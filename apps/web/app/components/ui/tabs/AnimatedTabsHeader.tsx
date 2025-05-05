import clsx from 'clsx';

import { TabsList, TabsTrigger } from '~/components/ui/tabs';

interface Tab {
  value: string;
  label: string;
}

interface AnimatedTabsHeaderProps {
  tabs: Tab[];
  activeTab: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function AnimatedTabsHeader({
  tabs,
  activeTab,
  onChange,
  className,
}: AnimatedTabsHeaderProps) {
  return (
    <div className='z-5'>
      <TabsList className={clsx('relative grid w-full', `grid-cols-${tabs.length}`, className)}>
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              type='button'
              onClick={() => onChange?.(tab.value)}
              className={clsx(
                'relative z-10 transition-colors',
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}
