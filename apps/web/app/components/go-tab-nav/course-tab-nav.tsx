import { type LucideIcon } from 'lucide-react';

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
  endComponent?: React.ReactNode;
}

export function GoTabNav({ tabs, previousLink, endComponent }: GoTabNavProps) {
  return (
    <div className='border-b-border/40 border-b'>
      <div className='grid grid-cols-[1fr_4fr_1fr] items-center px-4 pt-4 md:grid-cols-[1fr_8fr_1fr]'>
        <div className='w-fit justify-self-start'>
          {previousLink ? <BackArrowNavLink to={previousLink} /> : null}
        </div>

        <div className='flex w-full items-center justify-center gap-1.5 md:gap-10'>
          {tabs
            .filter((tab) => tab.isVisible !== false)
            .map((tab) => (
              <TabLink key={tab.to + tab.name} to={tab.to} name={tab.name} icon={tab.icon} />
            ))}
        </div>

        <div className='w-fit justify-self-end'>{endComponent}</div>
      </div>
    </div>
  );
}
