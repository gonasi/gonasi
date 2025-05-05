import * as LucideIcons from 'lucide-react';
import type { z } from 'zod';

import type { LucideIconSchema } from '@gonasi/schemas/lessonTypes';

interface Props {
  name?: z.infer<typeof LucideIconSchema>; // e.g., "BookOpen"
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string; // HSLA or any CSS color
  'aria-hidden'?: boolean;
}

export function LucideIconRenderer({
  name,
  size = 20,
  strokeWidth = 2,
  className,
  color,
  ...props
}: Props) {
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon | undefined;
  const FallbackIcon = LucideIcons.Square;
  const ResolvedIcon = Icon ?? FallbackIcon;

  return (
    <ResolvedIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={color ? { stroke: color } : undefined}
      {...props}
    />
  );
}
