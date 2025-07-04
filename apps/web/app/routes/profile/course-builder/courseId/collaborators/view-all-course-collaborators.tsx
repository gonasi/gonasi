import { BannerCard } from '~/components/cards';

export function meta() {
  return [
    { title: 'Invite Collaborators • Gonasi' },
    {
      name: 'description',
      content:
        'Invite collaborators to join your course project on Gonasi. Share editing access, assign roles, and build your course content together more efficiently.',
    },
  ];
}

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
