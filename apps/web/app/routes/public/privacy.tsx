export default function PrivacyPolicy() {
  return (
    <div className='bg-gray-50 leading-relaxed text-gray-800'>
      <header className='border-b bg-white'>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-6 py-6'>
          <a href='/' className='text-2xl font-semibold text-indigo-600'>
            Gonasi
          </a>
          <nav className='space-x-4 text-sm'>
            <a href='/privacy' className='font-medium text-indigo-600'>
              Privacy Policy
            </a>
            <a href='/terms-of-service' className='text-gray-600'>
              Terms
            </a>
          </nav>
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-6 py-12'>
        <article className='rounded-2xl bg-white p-8 shadow-sm'>
          <h1 className='mb-2 text-3xl font-bold'>Privacy Policy</h1>
          <p className='mb-6 text-sm text-gray-500'>
            Effective date: <strong>August 11, 2025</strong>
          </p>
          <div className='prose max-w-none'>
            <h2>1. Who we are</h2>
            <p>
              Gonasi (“we”, “us”, or “Gonasi”) operates
              <a href='https://www.gonasi.com' className='text-indigo-600'>
                https://www.gonasi.com
              </a>
              (the “Service”). This Privacy Policy explains how we collect, use, disclose, and
              protect personal information when you visit or use the Service.
            </p>
            <h2>2. Data controller / contact</h2>
            <p>
              If you have questions about this policy or your personal data, contact us at
              <a href='mailto:support@gonasi.com' className='text-indigo-600'>
                support@gonasi.com
              </a>
              .
            </p>
            <h2>3. Information we collect</h2>
            <ul>
              <li>Account & profile data: name, email, username, profile photo, biography.</li>
              <li>
                Content you create: course content, quizzes, messages, uploaded files and media.
              </li>
              <li>Payment & billing info: billing address and transaction records.</li>
              <li>Communications: support messages, emails, and other communications.</li>
              <li>
                Usage & technical data: IP address, device and browser info, logs, performance and
                diagnostic data.
              </li>
              <li>Cookies & tracking technologies for analytics and service operation.</li>
            </ul>
            {/* Continue with remaining Privacy Policy sections here... */}
          </div>
        </article>
      </main>
    </div>
  );
}
