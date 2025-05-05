import { useSearchParams } from 'react-router';

import { FormDescription } from '~/components/ui/forms';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';

interface Props {
  label: string;
  description?: string;
}

export function ViewAll({ label, description }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();

  const viewAll = searchParams.get('all') === 'true';

  const handleToggle = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('all', (!viewAll).toString());
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className='px-2 pb-8'>
      <Label className='font-bold' htmlFor='view-all-switch'>
        {label}
      </Label>
      <Switch id='view-all-switch' checked={viewAll} onCheckedChange={handleToggle} />
      {description ? <FormDescription>{description}</FormDescription> : null}
    </div>
  );
}
