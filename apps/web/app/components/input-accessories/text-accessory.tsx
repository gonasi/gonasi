import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {}

export function TextAccessory({ children }: Props) {
  return <span>{children}</span>;
}
