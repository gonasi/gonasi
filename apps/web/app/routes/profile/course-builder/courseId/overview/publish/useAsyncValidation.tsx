import { useState } from 'react';
import type { FieldValues, UseFormTrigger } from 'react-hook-form';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const getRandomDelay = () => Math.random() * (3000 - 1500) + 1500;

interface UseAsyncValidationProps<T extends FieldValues = FieldValues> {
  trigger: UseFormTrigger<T>;
}

type LoadingStates = Record<string, boolean>;

export function useAsyncValidation<T extends FieldValues = FieldValues>({
  trigger,
}: UseAsyncValidationProps<T>) {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  const createValidator = (key: string, fields: Parameters<UseFormTrigger<T>>[0]) => async () => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      await Promise.all([trigger(fields), sleep(getRandomDelay())]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  const isLoading = (key: string): boolean => {
    return loadingStates[key] || false;
  };

  return {
    loadingStates,
    createValidator,
    isLoading,
  };
}
