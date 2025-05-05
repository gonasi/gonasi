import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6 text-center'>
      <h1 className='text-4xl font-bold text-gray-900'>404 - Page Not Found</h1>
      <p className='mt-2 text-gray-600'>The page you are looking for does not exist.</p>
      <div className='mt-4'>
        <Link to='/' className='text-blue-600 hover:underline'>
          Go back home
        </Link>
      </div>
    </div>
  );
}
