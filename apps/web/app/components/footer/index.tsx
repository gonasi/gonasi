import { Link } from 'react-router';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className='border-t'>
      <div className='mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8'>
        <div className='flex flex-col space-y-8 md:flex-row md:space-y-0 md:space-x-12'>
          {/* Company Info */}
          <div className='flex flex-col space-y-4'>
            <h3 className='text-foreground text-sm font-semibold'>Company</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div className='flex flex-col space-y-4'>
            <h3 className='text-foreground text-sm font-semibold'>Products</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className='flex flex-col space-y-4'>
            <h3 className='text-foreground text-sm font-semibold'>Support</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Status
                </Link>
              </li>
              <li>info@gonasi.com</li>
            </ul>
          </div>

          {/* Legal */}
          <div className='flex flex-col space-y-4'>
            <h3 className='text-foreground text-sm font-semibold'>Legal</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='/go/privacy'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to='/go/terms-of-service'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to='#'
                  className='text-muted-foreground font-secondary hover:text-foreground/80 text-sm transition-colors'
                >
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Links */}
        <div className='mt-8 md:mt-0'>
          <div className='flex space-x-6'>
            <Link
              to='https://www.facebook.com/people/Gonasi/61579657334134/'
              target='_blank'
              className='text-muted-foreground hover:text-foreground/80 transition-colors'
              rel='noreferrer'
            >
              <span className='sr-only'>Facebook</span>
              <Facebook className='h-6 w-6' />
            </Link>
            {/* <Link
              to='#'
              className='text-muted-foreground hover:text-foreground/80 transition-colors'
            >
              <span className='sr-only'>Twitter</span>
              <Twitter className='h-6 w-6' />
            </Link> */}
            <Link
              to='https://www.instagram.com/gonasi_app/'
              target='_blank'
              className='text-muted-foreground hover:text-foreground/80 transition-colors'
              rel='noreferrer'
            >
              <span className='sr-only'>Instagram</span>
              <Instagram className='h-6 w-6' />
            </Link>
            <Link
              to='https://www.linkedin.com/company/gonasi-app/'
              target='_blank'
              className='text-muted-foreground hover:text-foreground/80 transition-colors'
              rel='noreferrer'
            >
              <span className='sr-only'>LinkedIn</span>
              <Linkedin className='h-6 w-6' />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className='pb-20 md:pb-4'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <p className='text-muted-foreground pt-2 text-center text-sm'>
            © 2025 Gonasi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
