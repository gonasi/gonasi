import { useCallback, useRef, useState } from 'react';
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
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => {
      if (prev[key] === loading) return prev; // Prevent unnecessary re-renders
      return { ...prev, [key]: loading };
    });
  }, []);

  const createValidator = useCallback(
    (key: string, fields: Parameters<UseFormTrigger<T>>[0]) => async (): Promise<void> => {
      // Cancel previous validation for this key
      if (abortControllersRef.current[key]) {
        abortControllersRef.current[key].abort();
      }

      const controller = new AbortController();
      abortControllersRef.current[key] = controller;

      setLoading(key, true);

      try {
        await Promise.all([
          trigger(fields),
          sleep(getRandomDelay()).then(() => {
            // Check if validation was cancelled
            if (controller.signal.aborted) {
              throw new Error('Validation cancelled');
            }
          }),
        ]);
      } catch (error) {
        // Only handle non-abort errors
        if (error instanceof Error && error.message !== 'Validation cancelled') {
          console.error('Validation error:', error);
        }
      } finally {
        // Only update loading state if this validation wasn't cancelled
        if (!controller.signal.aborted) {
          setLoading(key, false);
          delete abortControllersRef.current[key];
        }
      }
    },
    [trigger, setLoading],
  );

  const isLoading = useCallback(
    (key: string): boolean => {
      return loadingStates[key] || false;
    },
    [loadingStates],
  );

  // Cleanup function to cancel all pending validations
  const cancelAllValidations = useCallback(() => {
    Object.values(abortControllersRef.current).forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current = {};
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    createValidator,
    isLoading,
    cancelAllValidations,
  };
}
