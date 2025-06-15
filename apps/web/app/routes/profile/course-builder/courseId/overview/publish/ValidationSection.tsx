// components/ValidationSection.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCheck, LoaderCircle, RefreshCw } from 'lucide-react';

import { PlainButton } from '~/components/ui/button';
import { GoValidationCheckField } from '~/components/ui/forms/elements';
import { cn } from '~/lib/utils';

export interface ValidationField {
  name: string;
  title: string;
  fix: string;
}

interface ValidationSectionProps {
  title: string;
  fields: ValidationField[];
  hasErrors: boolean;
  onValidate: () => Promise<void>;
  isLoading: boolean;
}

export function ValidationSection({
  title,
  fields,
  hasErrors,
  onValidate,
  isLoading,
}: ValidationSectionProps) {
  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between'>
        <div
          className={cn(
            'flex items-center space-x-2',
            !isLoading && hasErrors && 'text-danger',
            !isLoading && !hasErrors && 'text-success',
          )}
        >
          {hasErrors ? <Ban size={18} /> : <CheckCheck size={18} />}
          <h2 className='mt-1 text-lg'>{title}</h2>
        </div>
        <PlainButton onClick={onValidate} disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle size={18} className='animate-spin' />
          ) : (
            <RefreshCw size={18} />
          )}
        </PlainButton>
      </div>

      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {fields.map((field) => (
              <GoValidationCheckField
                key={field.name}
                name={field.name}
                title={field.title}
                fixLink={field.fix}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
