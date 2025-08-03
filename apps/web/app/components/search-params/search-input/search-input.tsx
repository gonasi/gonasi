import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigation, useSearchParams } from 'react-router';
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
  const navigation = useNavigation();

  // Initialize from query param
  const [value, setValue] = useState(() => searchParams.get(queryParam) ?? '');
  const deferredValue = useDeferredValue(value);

  // Track if we're currently searching
  const isSearching = navigation.state === 'loading' && value.length > 0;

  const debouncedSetSearchParams = useRef(
    debounce((newValue: string) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          if (newValue) {
            newParams.set(queryParam, newValue);
          } else {
            newParams.delete(queryParam);
          }

          // Reset to page 1 when searching
          newParams.set('page', '1');

          return newParams;
        },
        { replace: true },
      );
    }, debounceMs),
  ).current;

  // Sync value -> query param
  useEffect(() => {
    debouncedSetSearchParams(deferredValue);
    return () => debouncedSetSearchParams.cancel();
  }, [deferredValue, debouncedSetSearchParams]);

  // Sync query param -> value on back/forward nav
  useEffect(() => {
    const paramValue = searchParams.get(queryParam) ?? '';
    if (paramValue !== value) {
      setValue(paramValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, queryParam]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
  };

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className='max-w-md'>
      <div className='relative'>
        <Input
          type='text'
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          leftIcon={
            isSearching ? (
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500' />
            ) : (
              <Search />
            )
          }
          rightIcon={value ? <CircleX onClick={handleClear} className='cursor-pointer' /> : null}
          className={`rounded-full transition-all duration-200 ${
            isSearching ? 'ring-opacity-50 ring-secondary/20 ring-2' : ''
          }`}
        />
        {isSearching && (
          <div className='bg-secondary/50 pointer-events-none absolute inset-0 rounded-full opacity-20' />
        )}
      </div>
      {deferredValue.length > 1 && (
        <div className='pt-2 md:pt-4'>
          <span className='font-secondary text-muted-foreground text-sm'>
            Results for <span className='text-primary font-bold'>{deferredValue}</span>
            {searchParams.get('all') === 'true' && <span className='ml-1'>(all)</span>}
            {isSearching && (
              <span className='text-secondary ml-2 animate-pulse'>• Searching...</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
