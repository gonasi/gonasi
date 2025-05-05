import { TabLink } from './tab-link';

interface Tab {
  to: string;
  name: string;
}

interface GoTabNavProps {
  tabs: Tab[];
}

export function GoTabNav({ tabs }: GoTabNavProps) {
  return (
    <div className='border-b-card flex items-center space-x-4 border-b pt-4'>
      {tabs.map((tab) => (
        <TabLink key={tab.to + tab.name} to={tab.to} name={tab.name} />
      ))}
    </div>
  );
}
