interface Props {
  height: number | 'inherit';
  width: number | 'inherit' | string;
}

export function ImageComponentFallback({ height, width }: Props) {
  return <div className='bg-card animate-pulse rounded-xs' style={{ height, width }} />;
}
