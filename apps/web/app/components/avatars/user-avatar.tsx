import { PlainAvatar } from './plain-avatar';

interface UserAvatarProps {
  username: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isActive?: boolean;
  isPending?: boolean;
}

const textSizeClasses = {
  xs: 'text-sm',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-medium',
};

export function UserAvatar({
  username,
  fullName,
  imageUrl,
  size = 'md',
  isActive = false,
  isPending = false,
}: UserAvatarProps) {
  return (
    <div className='text-foreground flex items-center gap-2'>
      <PlainAvatar
        username={username}
        imageUrl={imageUrl}
        isActive={isActive}
        isPending={isPending}
        size='md'
      />
      <div>
        {fullName ? (
          <div className={`${textSizeClasses[size]} line-clamp-2 uppercase`}>{fullName}</div>
        ) : null}
        <div className={`${textSizeClasses[size]} text-muted-foreground line-clamp-1`}>
          {username}
        </div>
      </div>
    </div>
  );
}
