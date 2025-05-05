import type { PropsWithChildren } from 'react';

interface ContainerProps extends PropsWithChildren {
  className?: string;
}

export function Container({ children, className = '' }: ContainerProps) {
  return <section className={`container mx-auto px-4 md:px-0 ${className}`}>{children}</section>;
}
