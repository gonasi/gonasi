import { Card } from '~/components/ui/card';

export default function TapToRevealFallback() {
  return (
    <div className='flex w-full items-center justify-center'>
      <Card className='bg-card h-64 w-48 animate-pulse' />
    </div>
  );
}
