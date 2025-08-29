import { Construction } from 'lucide-react';

export function DevelopmentBanner() {
  return (
    <section className='border-b border-amber-200 bg-amber-100 text-amber-900'>
      <div className='container mx-auto px-4 py-2 md:px-0'>
        <div className='flex items-center justify-center gap-2 text-sm'>
          <Construction className='h-4 w-4 animate-pulse' />
          <span className='font-medium'>
            Gonasi is in <span className='underline'>active development</span>. Expect frequent
            updates & improvements 🚀
          </span>
          <div className='h-2 w-2 animate-pulse rounded-full bg-amber-500' />
        </div>
      </div>
    </section>
  );
}
