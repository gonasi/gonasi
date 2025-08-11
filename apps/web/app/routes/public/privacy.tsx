export function meta() {
  return [
    {
      title: 'Gonasi • Privacy Policy',
    },
    {
      name: 'description',
      content:
        'Read Gonasi’s Privacy Policy • Learn how we collect, use, and protect your personal information • Your privacy matters to us.',
    },
  ];
}

export default function PrivacyPolicy() {
  return (
    <div className='mx-auto max-w-4xl px-6 py-12 leading-relaxed'>
      <h1 className='mb-6 text-3xl font-bold'>Privacy Policy</h1>
      <p className='mb-4'>Last updated: 11 August 2025</p>

      <p className='mb-4'>
        This Privacy Policy explains how Gonasi ("we", "our", or "us") collects, uses, and protects
        your personal information when you use our platform. By using Gonasi, you agree to the terms
        of this policy.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>1. Information We Collect</h2>
      <ul className='list-disc space-y-1 pl-6'>
        <li>Account information you provide (name, email, password)</li>
        <li>Profile details (bio, profile picture, preferences)</li>
        <li>Course activity and progress</li>
        <li>Payment and billing details (handled securely via third-party providers)</li>
        <li>Technical data such as device type, browser, IP address</li>
      </ul>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>2. How We Use Your Information</h2>
      <ul className='list-disc space-y-1 pl-6'>
        <li>To operate and improve our platform</li>
        <li>To process transactions and send payment receipts</li>
        <li>To provide customer support</li>
        <li>To communicate updates, offers, and announcements (with your consent)</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>3. Sharing of Information</h2>
      <p className='mb-4'>We do not sell your personal data. We may share your information with:</p>
      <ul className='list-disc space-y-1 pl-6'>
        <li>Service providers (e.g., payment processors, hosting providers)</li>
        <li>Legal authorities when required by law</li>
        <li>Other users, when you choose to share content publicly</li>
      </ul>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>4. Your Rights</h2>
      <p className='mb-4'>
        You may request access to, correction of, or deletion of your personal data by contacting
        us. You can also update your account information directly in your profile settings.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>5. Security</h2>
      <p className='mb-4'>
        We implement security measures to protect your information. However, no online service is
        completely secure, so we cannot guarantee absolute protection.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>6. Changes to This Policy</h2>
      <p className='mb-4'>
        We may update this policy from time to time. If we make significant changes, we will notify
        you via email or in-app notification.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>7. Contact Us</h2>
      <p>
        If you have any questions, contact us at:{' '}
        <a href='mailto:support@gonasi.com' className='text-blue-600 hover:underline'>
          support@gonasi.com
        </a>
      </p>
    </div>
  );
}
