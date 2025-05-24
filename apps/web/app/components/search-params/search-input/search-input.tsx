import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import debounce from 'lodash.debounce';
import { CircleX, Search } from 'lucide-react';

import { Input } from '~/components/ui/input';

interface SearchInputProps {
  queryParam?: string;
  debounceMs?: number;
  placeholder?: string;
}

export const SearchInput = ({
  queryParam = 'name',
  debounceMs = 300,
  placeholder = 'Search...',
}: SearchInputProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from query param
  const [value, setValue] = useState(() => searchParams.get(queryParam) ?? '');
  const deferredValue = useDeferredValue(value);

  const debouncedSetSearchParams = useRef(
    debounce((newValue: string) => {
      const currentParams = new URLSearchParams(window.location.search);

      if (newValue) {
        currentParams.set(queryParam, newValue);
      } else {
        currentParams.delete(queryParam);
      }

      setSearchParams(currentParams, { replace: true });
    }, debounceMs),
  ).current;

  // Sync value -> query param
  useEffect(() => {
    debouncedSetSearchParams(deferredValue);
    return () => debouncedSetSearchParams.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredValue]);

  // Sync query param -> value on back/forward nav or external changes
  useEffect(() => {
    const externalValue = searchParams.get(queryParam) ?? '';
    setValue(externalValue);
  }, [searchParams, queryParam]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
  };

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className='max-w-md'>
      <Input
        type='text'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<Search />}
        rightIcon={value ? <CircleX onClick={handleClear} className='cursor-pointer' /> : null}
        className='rounded-full'
      />
      {deferredValue.length > 1 && (
        <div className='pt-2 md:pt-4'>
          <span className='font-secondary text-muted-foreground text-sm'>
            Results for <span className='text-primary font-bold'>{deferredValue}</span>
            {searchParams.get('all') === 'true' && <span className='ml-1'>(all)</span>}
          </span>
        </div>
      )}
    </div>
  );
};
