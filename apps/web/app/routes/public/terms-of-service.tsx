export default function TermsOfService() {
  return (
    <div className='bg-gray-50 leading-relaxed text-gray-800'>
      <header className='border-b bg-white'>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-6 py-6'>
          <a href='/' className='text-2xl font-semibold text-indigo-600'>
            Gonasi
          </a>
          <nav className='space-x-4 text-sm'>
            <a href='/privacy' className='text-gray-600'>
              Privacy Policy
            </a>
            <a href='/terms-of-service' className='font-medium text-indigo-600'>
              Terms
            </a>
          </nav>
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-6 py-12'>
        <article className='rounded-2xl bg-white p-8 shadow-sm'>
          <h1 className='mb-2 text-3xl font-bold'>Terms of Service</h1>
          <p className='mb-6 text-sm text-gray-500'>
            Effective date: <strong>August 11, 2025</strong>
          </p>
          <div className='prose max-w-none'>
            <h2>1. Acceptance of terms</h2>
            <p>
              These Terms of Service govern your access to and use of Gonasi’s website, platform,
              and services. By accessing or using the Service you agree to these Terms. If you do
              not agree, do not use the Service.
            </p>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least the minimum age required by local law to use the Service. By
              creating an account you represent that you meet this requirement.
            </p>
            <h2>3. Accounts and access</h2>
            <ul>
              <li>
                You are responsible for maintaining the confidentiality of your account credentials.
              </li>
              <li>You agree to provide accurate and up-to-date account information.</li>
              <li>We may suspend or terminate accounts that violate these Terms.</li>
            </ul>
            {/* Continue with remaining Terms sections here... */}
          </div>
        </article>
      </main>
    </div>
  );
}
