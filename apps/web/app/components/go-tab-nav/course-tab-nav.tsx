import type { LucideIcon } from 'lucide-react';

import { TabLink } from './tab-link';

interface Tab {
  to: string;
  name: string;
  icon: LucideIcon;
  isVisible?: boolean; // TODO: Change to required once done
}

interface GoTabNavProps {
  tabs: Tab[];
}

export function GoTabNav({ tabs }: GoTabNavProps) {
  return (
    <div className='border-b-card border-b pt-4'>
      <div className='mx-auto flex w-full max-w-md items-center justify-center gap-10'>
        {tabs
          .filter((tab) => tab.isVisible !== false)
          .map((tab) => (
            <TabLink key={tab.to + tab.name} to={tab.to} name={tab.name} icon={tab.icon} />
          ))}
      </div>
    </div>
  );
}
