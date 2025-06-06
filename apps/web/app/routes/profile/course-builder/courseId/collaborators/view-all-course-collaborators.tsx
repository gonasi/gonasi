import { BannerCard } from '~/components/cards';

export default function ViewAllCourseCollaborators() {
  return (
    <div className='max-w-xl pb-20'>
      <BannerCard
        message='👀 Coming soon!'
        description="You'll soon be able to invite collaborators to help build your course. Hang tight... it's on the way! 🚀"
        variant='info'
        className='mb-10'
      />
    </div>
  );
}
