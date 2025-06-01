export function CourseProfileCardSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className='bg-card animate-pulse rounded-lg border p-4'>
          <div className='bg-muted mb-4 h-32 rounded' />
          <div className='bg-muted mb-2 h-4 rounded' />
          <div className='bg-muted h-3 w-3/4 rounded' />
        </div>
      ))}
    </div>
  );
}
