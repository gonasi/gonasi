import { motion } from 'framer-motion';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

interface UserAvatarProps {
  username: string | null;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isActive?: boolean;
  isPending?: boolean;
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14 md:h-18 md:w-18',
  xl: 'h-18 w-19',
};

const ringSizeClasses = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-15 w-15 md:h-20 md:w-20',
  xl: 'h-20 w-20',
};

export function PlainAvatar({
  username,
  imageUrl,
  size = 'md',
  isActive = false,
  isPending = false,
  className,
  showTooltip = false,
}: UserAvatarProps) {
  const initials = username
    ? username
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '';

  const avatar = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={imageUrl || undefined} alt={username ?? ''} />
      <AvatarFallback className='bg-primary/10 text-primary'>{initials}</AvatarFallback>
    </Avatar>
  );

  const avatarWithRing = (
    <div className={cn('text-foreground relative flex items-center justify-center', className)}>
      {isPending ? (
        <motion.div
          className={`border-primary/20 absolute rounded-full border-2 border-b-transparent ${ringSizeClasses[size]}`}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
      ) : isActive ? (
        <div className={`border-primary absolute rounded-full border-2 ${ringSizeClasses[size]}`} />
      ) : (
        <div
          className={`absolute rounded-full border-2 border-transparent ${ringSizeClasses[size]}`}
        />
      )}
      {avatar}
    </div>
  );

  // ✅ If tooltip is enabled
  if (showTooltip && username) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{avatarWithRing}</TooltipTrigger>
          <TooltipContent>{username}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ✅ Normal render
  return avatarWithRing;
}
