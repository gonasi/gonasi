import { Link } from 'react-router';

export default function TermsOfService() {
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
          <h1 className='mb-2 text-3xl font-bold'>Terms of Service</h1>
          <p className='mb-6 text-sm'>
            Effective date: <strong>August 11, 2025</strong>
          </p>

          <div className='prose text-muted-foreground font-secondary max-w-none'>
            <h2 className='font-primary text-foreground'>1. Acceptance of terms</h2>
            <p>
              These Terms of Service (“Terms”) govern your access to and use of Gonasi’s website,
              platform, and related services (collectively, the “Service”). By accessing or using
              the Service, you agree to be bound by these Terms and our Privacy Policy. If you do
              not agree, you must not use the Service.
            </p>

            <h2 className='font-primary text-foreground'>2. Eligibility</h2>
            <p>
              You must be at least the minimum age of majority in your country or region to use the
              Service. By creating an account, you represent and warrant that you meet this
              requirement and have the legal capacity to enter into a binding agreement.
            </p>

            <h2 className='font-primary text-foreground'>3. Accounts and access</h2>
            <ul>
              <li>
                You are responsible for maintaining the confidentiality of your login details.
              </li>
              <li>
                You agree to provide accurate, current, and complete account information at all
                times.
              </li>
              <li>
                You must not share your account or allow others to access it without our written
                consent.
              </li>
              <li>
                We may suspend or terminate your account if we reasonably believe you have violated
                these Terms.
              </li>
            </ul>

            <h2 className='font-primary text-foreground'>4. Use of the service</h2>
            <ul>
              <li>
                You may use the Service only for lawful purposes and in accordance with these Terms.
              </li>
              <li>
                You must not use the Service to post or transmit any harmful, unlawful, infringing,
                or otherwise objectionable content.
              </li>
              <li>
                We reserve the right to remove any content that violates these Terms or our
                policies.
              </li>
            </ul>

            <h2 className='font-primary text-foreground'>5. Intellectual property</h2>
            <p>
              All content, features, and functionality of the Service (including but not limited to
              text, graphics, logos, icons, images, software, and audio) are the exclusive property
              of Gonasi or its licensors and are protected by copyright, trademark, and other
              intellectual property laws.
            </p>

            <h2 className='font-primary text-foreground'>6. User-generated content</h2>
            <ul>
              <li>
                You retain ownership of any content you submit, post, or display on or through the
                Service (“User Content”).
              </li>
              <li>
                By posting User Content, you grant Gonasi a worldwide, non-exclusive, royalty-free
                license to use, reproduce, modify, and display such content solely for the purpose
                of operating and improving the Service.
              </li>
              <li>
                You represent and warrant that you have the necessary rights to grant us this
                license.
              </li>
            </ul>

            <h2 className='font-primary text-foreground'>7. Payments and refunds</h2>
            <p>
              If you purchase any paid Service, you agree to pay all applicable fees as described at
              the time of purchase. Except as required by law or stated otherwise, all payments are
              non-refundable.
            </p>

            <h2 className='font-primary text-foreground'>8. Third-party services</h2>
            <p>
              The Service may contain links to or integrations with third-party services. We do not
              control and are not responsible for the content, privacy policies, or practices of any
              third-party services.
            </p>

            <h2 className='font-primary text-foreground'>9. Disclaimers</h2>
            <p>
              The Service is provided “as is” and “as available” without warranties of any kind,
              whether express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>

            <h2 className='font-primary text-foreground'>10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Gonasi shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
              or other intangible losses, resulting from (a) your use or inability to use the
              Service; (b) any unauthorized access to or use of our servers; or (c) any other matter
              relating to the Service.
            </p>

            <h2 className='font-primary text-foreground'>11. Changes to these terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we will
              notify you by posting the updated Terms on this page and updating the “Effective date”
              above. Your continued use of the Service after such changes constitutes acceptance of
              the new Terms.
            </p>

            <h2 className='font-primary text-foreground'>12. Contact us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href='mailto:support@gonasi.com' className='text-secondary'>
                support@gonasi.com
              </a>
              .
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
