import { Check, X } from 'lucide-react';

import { cn } from '~/lib/utils';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthCriteria {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const strengthCriteria: StrengthCriteria[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'One special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

const getPasswordStrength = (password: string): number => {
  return strengthCriteria.reduce((score, criteria) => {
    return criteria.test(password) ? score + 1 : score;
  }, 0);
};

const getStrengthColor = (strength: number): string => {
  if (strength <= 1) return 'bg-red-500';
  if (strength <= 2) return 'bg-orange-500';
  if (strength <= 3) return 'bg-yellow-500';
  if (strength <= 4) return 'bg-blue-500';
  return 'bg-green-500';
};

const getStrengthLabel = (strength: number): string => {
  if (strength <= 1) return 'Very Weak';
  if (strength <= 2) return 'Weak';
  if (strength <= 3) return 'Fair';
  if (strength <= 4) return 'Good';
  return 'Strong';
};

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  const strengthPercentage = (strength / strengthCriteria.length) * 100;

  return (
    <div className={cn('space-y-3 pb-2', className)}>
      {/* Strength meter */}
      <div className='space-y-1'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Password Strength</span>
          <span
            className={cn(
              'text-secondary font-medium',
              strength <= 1 && 'text-danger',
              strength === 2 && 'text-warning',
              strength === 3 && 'text-info',
              strength === 4 && 'text-blue-600',
              strength === 5 && 'text-success',
            )}
          >
            {getStrengthLabel(strength)}
          </span>
        </div>

        <div className='h-2 w-full rounded-full bg-gray-200'>
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300 ease-in-out',
              getStrengthColor(strength),
            )}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className='space-y-1'>
        <p className='text-muted-foreground text-sm'>Requirements:</p>
        <ul className='space-y-1'>
          {strengthCriteria.map((criteria) => {
            const isValid = criteria.test(password);
            return (
              <li
                key={criteria.id}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors duration-200',
                  isValid ? 'text-green-600' : 'text-muted-foreground',
                )}
              >
                {isValid ? (
                  <Check className='h-3 w-3 text-green-600' />
                ) : (
                  <X className='text-muted-foreground h-3 w-3' />
                )}
                <span>{criteria.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
