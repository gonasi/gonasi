import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useContext } from 'react';
import { toast } from 'sonner';

export type ShowFlashMessage = (message?: React.ReactNode, duration?: number) => void;

const Context = createContext<ShowFlashMessage | undefined>(undefined);
const DEFAULT_DURATION = 1000;

export const FlashMessageContext = ({ children }: { children: ReactNode }): JSX.Element => {
  const showFlashMessage = useCallback<ShowFlashMessage>((message, duration) => {
    if (message) {
      toast(message, { duration: duration ?? DEFAULT_DURATION });
    }
  }, []);

  return <Context.Provider value={showFlashMessage}>{children}</Context.Provider>;
};

export const useFlashMessageContext = (): ShowFlashMessage => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('Missing FlashMessageContext');
  }
  return ctx;
};
