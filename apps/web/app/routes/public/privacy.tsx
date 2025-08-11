import { Link } from 'react-router';

export default function PrivacyPolicy() {
  return (
    <div className='leading-relaxed'>
      <header>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-6 py-6'>
          <nav className='flex w-full justify-end space-x-4 text-sm'>
            <Link to='/go/privacy' className='text-secondary font-medium'>
              Privacy Policy
            </Link>
            <Link to='/go/terms-of-service' className=''>
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className='mx-auto max-w-5xl px-6 py-12'>
        <article className='rounded-2xl p-8'>
          <h1 className='mb-2 text-3xl font-bold'>Privacy Policy</h1>
          <p className='mb-6 text-sm'>
            Effective date: <strong>August 11, 2025</strong>
          </p>

          <div className='prose text-muted-foreground font-secondary max-w-none'>
            <h2 className='font-primary text-foreground'>1. Who we are</h2>
            <p>
              Gonasi (“we”, “us”, or “Gonasi”) operates{' '}
              <a
                href='https://www.gonasi.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-secondary'
              >
                https://www.gonasi.com
              </a>{' '}
              (the “Service”). This Privacy Policy explains how we collect, use, disclose, and
              protect personal information when you visit or use the Service.
            </p>

            <h2 className='font-primary text-foreground'>2. Data controller / contact</h2>
            <p>
              If you have questions about this policy or your personal data, contact us at{' '}
              <a href='mailto:support@gonasi.com' className='text-secondary'>
                support@gonasi.com
              </a>
              .
            </p>

            <h2 className='font-primary text-foreground'>3. Information we collect</h2>
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

            <h2 className='font-primary text-foreground'>4. Google user data</h2>
            <p>
              If you sign in with Google or connect your Google account, we may access the following
              Google user data (with your consent via OAuth): name, email address, and profile
              picture. This information is used solely to:
            </p>
            <ul>
              <li>Authenticate your account and allow you to log in.</li>
              <li>Display your profile information in the Service.</li>
              <li>Communicate with you regarding your account.</li>
            </ul>
            <p>
              We do <strong>not</strong> use Google user data for advertising purposes, and we do{' '}
              <strong>not</strong> share it with third parties except as required to provide the
              Service (e.g., authentication services). Any stored Google user data is kept securely
              and deleted if you disconnect your Google account or delete your profile.
            </p>
            <p>
              Our use of information received from Google APIs will adhere to the{' '}
              <a
                href='https://developers.google.com/terms/api-services-user-data-policy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-secondary'
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>

            <h2 className='font-primary text-foreground'>5. How we use your information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, operate, and improve the Service.</li>
              <li>Process payments and send transactional communications.</li>
              <li>Respond to support requests and inquiries.</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2 className='font-primary text-foreground'>6. Sharing of information</h2>
            <p>
              We do not sell your personal information. We may share your information with
              third-party service providers (such as payment processors, hosting providers) who help
              us operate the Service, subject to strict confidentiality agreements.
            </p>

            <h2 className='font-primary text-foreground'>7. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new policy on this page and updating the effective
              date above.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
