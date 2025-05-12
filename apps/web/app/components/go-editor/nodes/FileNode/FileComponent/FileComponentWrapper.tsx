interface FileComponentWrapperProps {
  children: React.ReactNode;
}
export function FileComponentWrapper({ children }: FileComponentWrapperProps) {
  return <div>{children}</div>;
}
