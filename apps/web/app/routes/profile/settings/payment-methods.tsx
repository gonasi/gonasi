import { BannerCard } from '~/components/cards';

export default function PaymentMethodsSettings() {
  return (
    <BannerCard
      message='💳 Coming soon!'
      description='You’ll soon be able to add, update, or remove your saved payment methods for purchases and subscriptions. Coming your way! 💼'
      variant='info'
      className='mb-10'
    />
  );
}
