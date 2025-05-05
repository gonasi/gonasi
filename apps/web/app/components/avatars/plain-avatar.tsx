import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';

interface UserAvatarProps {
  username: string | null;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function PlainAvatar({ username, imageUrl, size = 'md' }: UserAvatarProps) {
  // Get initials from username for the fallback
  const initials = username
    ? username
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '';

  // Determine avatar size based on prop
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className='text-foreground flex items-center gap-2'>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={imageUrl || undefined} alt={username ?? ''} />
        <AvatarFallback className='bg-primary/10 text-primary'>{initials}</AvatarFallback>
      </Avatar>
    </div>
  );
}
