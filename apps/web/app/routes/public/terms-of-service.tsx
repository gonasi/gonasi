export function meta() {
  return [
    {
      title: 'Gonasi • Terms of Service',
    },
    {
      name: 'description',
      content:
        'Read Gonasi’s Terms of Service • Understand your rights, responsibilities, and the rules for using our platform.',
    },
  ];
}

export default function TermsOfService() {
  return (
    <div className='mx-auto max-w-4xl px-6 py-12 leading-relaxed'>
      <h1 className='mb-6 text-3xl font-bold'>Terms of Service</h1>
      <p className='mb-4'>Last updated: 11 August 2025</p>

      <p className='mb-4'>
        These Terms of Service ("Terms") govern your use of Gonasi ("we", "our", or "us") and its
        services. By accessing or using Gonasi, you agree to these Terms.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>1. Using Gonasi</h2>
      <ul className='list-disc space-y-1 pl-6'>
        <li>You must be at least 13 years old (or the age of digital consent in your country)</li>
        <li>You are responsible for the accuracy of the information you provide</li>
        <li>You agree not to misuse the platform or interfere with its operation</li>
      </ul>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>2. Accounts</h2>
      <p className='mb-4'>
        You are responsible for maintaining the confidentiality of your account and password. You
        must notify us immediately if you suspect unauthorized use of your account.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>3. Content</h2>
      <ul className='list-disc space-y-1 pl-6'>
        <li>You retain ownership of content you create and upload</li>
        <li>You grant us a license to display and distribute your content within the platform</li>
        <li>You must not post content that is unlawful, harmful, or infringes on others’ rights</li>
      </ul>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>4. Payments</h2>
      <p className='mb-4'>
        Paid services are billed according to the plan you choose. Prices and features are subject
        to change, but we will notify you before any significant changes.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>5. Termination</h2>
      <p className='mb-4'>
        We may suspend or terminate your account if you violate these Terms or misuse the service.
        You can close your account at any time.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>6. Disclaimer</h2>
      <p className='mb-4'>
        Gonasi is provided "as is" without warranties of any kind. We are not liable for damages
        arising from the use or inability to use the platform.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>7. Changes to These Terms</h2>
      <p className='mb-4'>
        We may update these Terms periodically. Continued use of the platform after changes means
        you accept the new Terms.
      </p>

      <h2 className='mt-8 mb-2 text-xl font-semibold'>8. Contact Us</h2>
      <p>
        If you have questions about these Terms, contact us at:{' '}
        <a href='mailto:support@gonasi.com' className='text-blue-600 hover:underline'>
          support@gonasi.com
        </a>
      </p>
    </div>
  );
}
