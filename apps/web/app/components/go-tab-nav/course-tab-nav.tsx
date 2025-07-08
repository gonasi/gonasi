import type { LucideIcon } from 'lucide-react';

import { BackArrowNavLink } from '../ui/button';
import { TabLink } from './tab-link';

export interface Tab {
  to: string;
  name: string;
  icon: LucideIcon;
  isVisible?: boolean; // TODO: Change to required once done
}

interface GoTabNavProps {
  tabs: Tab[];
  previousLink?: string;
}

export function GoTabNav({ tabs, previousLink }: GoTabNavProps) {
  return (
    <div className='border-b-border/20 grid grid-cols-3 items-center border-b px-0 pt-4 md:px-4'>
      <div>{previousLink ? <BackArrowNavLink to={previousLink} /> : null}</div>
      <div className='mx-auto flex w-full max-w-md items-center justify-center gap-2 md:gap-10'>
        {tabs
          .filter((tab) => tab.isVisible !== false)
          .map((tab) => (
            <TabLink key={tab.to + tab.name} to={tab.to} name={tab.name} icon={tab.icon} />
          ))}
      </div>
    </div>
  );
}
