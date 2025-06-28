import { Globe, Lock } from 'lucide-react';

import { Label } from '~/components/ui/label/label';
import { Switch } from '~/components/ui/switch/switch';

export function ProfileVisibility() {
  const isPublic = true;
  return (
    <div className='flex-col space-y-4'>
      <div>
        <h2 className='text-xl'>Profile Visibility</h2>
        <p className='font-secondary text-muted-foreground text-sm'>
          Control who can see your profile information
        </p>
      </div>
      <div className='md:bg-card/50 flex flex-col space-y-4 rounded-md bg-transparent p-0 md:p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
              {isPublic ? (
                <Globe className='h-5 w-5 text-green-600' />
              ) : (
                <Lock className='h-5 w-5 text-orange-600' />
              )}
            </div>
            <div className='space-y-1'>
              <Label htmlFor='profile-visibility' className='cursor-pointer text-sm font-medium'>
                {isPublic ? 'Public Profile' : 'Private Profile'}
              </Label>
              <p className='text-muted-foreground font-secondary text-xs'>
                {isPublic ? 'Anyone can view your profile' : 'Only you can view your profile'}
              </p>
            </div>
          </div>
          <Switch
            id='profile-visibility'
            checked={isPublic}
            // onCheckedChange={setIsPublic}
            aria-label='Toggle profile visibility'
          />
        </div>
        <div className='bg-muted/50 font-secondary rounded-lg p-2 font-light md:p-3'>
          <div className='flex items-start space-x-2'>
            <div className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500' />
            <div className='text-muted-foreground text-xs'>
              {isPublic ? (
                <>
                  <strong>Public:</strong> Your profile, posts, and activity will be visible to all
                  users and may appear in search results.
                </>
              ) : (
                <>
                  <strong>Private:</strong> Your profile information will be hidden from other
                  users. Only your username will be visible in interactions.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
