import { BannerCard } from '~/components/cards';

export default function NotificationSettings() {
  return (
    <BannerCard
      message='🔔 Coming soon!'
      description='Soon you’ll be able to customize how and when you get notifications—whether by email, in-app, or both. Stay tuned! 📬'
      variant='info'
      className='mb-10'
    />
  );
}
