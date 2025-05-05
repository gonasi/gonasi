import type { JSX, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin';
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin';

interface ContextShape {
  historyState?: HistoryState;
}

const Context: React.Context<ContextShape> = createContext({});

export const SharedHistoryContext = ({ children }: { children: ReactNode }): JSX.Element => {
  const historyContext = useMemo(() => ({ historyState: createEmptyHistoryState() }), []);
  return <Context.Provider value={historyContext}>{children}</Context.Provider>;
};

export const useSharedHistoryContext = (): ContextShape => {
  return useContext(Context);
};
