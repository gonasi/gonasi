import { cn } from '~/lib/utils';

interface FileComponentWrapperProps {
  children: React.ReactNode;
  className?: string;
}
export function FileComponentWrapper({ children, className }: FileComponentWrapperProps) {
  return <div className={cn(className)}>{children}</div>;
}
