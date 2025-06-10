import { BannerCard } from '~/components/cards';

export default function CoursePricing() {
  return (
    <div className='mx-auto max-w-2xl'>
      <BannerCard
        message='Your new prices go live instantly, no need to hit publish!'
        description='Just updating the price? It updates right away. Only content changes need publishing.'
        variant='info'
        className='mb-10'
      />

      <h2>pricing</h2>
    </div>
  );
}
