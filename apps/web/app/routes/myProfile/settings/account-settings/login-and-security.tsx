import { BannerCard } from '~/components/cards';

export default function LoginAndSecuritySettings() {
  return (
    <BannerCard
      message='🔐 Coming soon!'
      description='Soon you’ll be able to update your login credentials, enable two-factor authentication, and manage your account security. Hang tight! 🔧'
      variant='info'
      className='mb-10'
    />
  );
}
