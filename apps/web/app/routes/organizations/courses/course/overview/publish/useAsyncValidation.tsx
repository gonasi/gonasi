import { useCallback, useState } from 'react';
import type { FieldValues, UseFormTrigger } from 'react-hook-form';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const getRandomDelay = () => Math.random() * (3000 - 1500) + 1500;

interface UseAsyncValidationProps<T extends FieldValues = FieldValues> {
  trigger: UseFormTrigger<T>;
}

type LoadingStates = Record<string, boolean>;
type ValidationStates = Record<string, 'pending' | 'loading' | 'success' | 'error'>;
type ValidationQueue = {
  key: string;
  fields: Parameters<UseFormTrigger<any>>[0];
  validator: () => Promise<void>;
}[];

export function useAsyncValidation<T extends FieldValues = FieldValues>({
  trigger,
}: UseAsyncValidationProps<T>) {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const [validationStates, setValidationStates] = useState<ValidationStates>({});
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const createValidator = useCallback(
    (key: string, fields: Parameters<UseFormTrigger<T>>[0]) => async () => {
      setLoadingStates((prev) => ({ ...prev, [key]: true }));
      setValidationStates((prev) => ({ ...prev, [key]: 'loading' }));

      try {
        const [validationResult] = await Promise.all([trigger(fields), sleep(getRandomDelay())]);

        // Check if validation passed (no errors for this field)
        const hasErrors = !validationResult;
        setValidationStates((prev) => ({
          ...prev,
          [key]: hasErrors ? 'error' : 'success',
        }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        setValidationStates((prev) => ({ ...prev, [key]: 'error' }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, [key]: false }));
      }
    },
    [trigger],
  );

  // Initialize validation states as pending
  const initializeValidationStates = useCallback((keys: string[]) => {
    setValidationStates((prev) => {
      const newStates = { ...prev };
      keys.forEach((key) => {
        if (!newStates[key]) {
          newStates[key] = 'pending';
        }
      });
      return newStates;
    });
  }, []);

  // Sequential validation processor
  const processValidationQueue = useCallback(
    async (validationQueue: ValidationQueue) => {
      if (isProcessingQueue) return;

      setIsProcessingQueue(true);

      try {
        for (const { validator } of validationQueue) {
          await validator();
          // Small delay between validations to prevent UI blocking
          await sleep(100);
        }
      } catch (error) {
        console.error('Error during sequential validation:', error);
      } finally {
        setIsProcessingQueue(false);
      }
    },
    [isProcessingQueue],
  );

  // Create a sequential validator that processes validations one by one
  const createSequentialValidator = useCallback(
    (
      validationConfigs: {
        key: string;
        fields: Parameters<UseFormTrigger<T>>[0];
      }[],
    ) => {
      return async () => {
        // Initialize all states as pending
        initializeValidationStates(validationConfigs.map((config) => config.key));

        const validationQueue: ValidationQueue = validationConfigs.map(({ key, fields }) => ({
          key,
          fields,
          validator: createValidator(key, fields),
        }));

        await processValidationQueue(validationQueue);
      };
    },
    [createValidator, processValidationQueue, initializeValidationStates],
  );

  const getValidationState = useCallback(
    (key: string): 'pending' | 'loading' | 'success' | 'error' => {
      return validationStates[key] || 'pending';
    },
    [validationStates],
  );

  const isLoading = useCallback(
    (key: string): boolean => {
      return loadingStates[key] || false;
    },
    [loadingStates],
  );

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(Boolean) || isProcessingQueue;
  }, [loadingStates, isProcessingQueue]);

  return {
    loadingStates,
    validationStates,
    createValidator,
    createSequentialValidator,
    initializeValidationStates,
    getValidationState,
    isLoading,
    isAnyLoading,
    isProcessingQueue,
  };
}
