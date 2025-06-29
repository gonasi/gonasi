import { useEffect, useRef } from 'react';
import { useFetcher, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Lock } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  ToggleProfileVisibilitySchema,
  type ToggleProfileVisibilitySchemaTypes,
} from '@gonasi/schemas/settings';

import { GoSwitchField } from '~/components/ui/forms/elements';
import { Label } from '~/components/ui/label/label';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(ToggleProfileVisibilitySchema);

interface IProfileVisibilityProps {
  isPublic: boolean;
}

export function ProfileVisibility({ isPublic }: IProfileVisibilityProps) {
  const fetcher = useFetcher();
  const params = useParams();
  const isPending = useIsPending();
  const isInitialMount = useRef(true);

  const submitRoute = `/go/${params.username}/settings/profile-information`;

  const methods = useRemixForm<ToggleProfileVisibilitySchemaTypes>({
    mode: 'onChange',
    resolver,
    fetcher,
    defaultValues: {
      isPublic,
      updateType: 'profile-visibility',
    },
    submitConfig: {
      method: 'POST',
      action: submitRoute,
      replace: false,
    },
  });

  const watchIsPublic = methods.watch('isPublic');
  const isFormDisabled = isPending || methods.formState.isSubmitting || fetcher.state !== 'idle';

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (watchIsPublic !== isPublic) {
      const submitForm = async () => {
        const isValid = await methods.trigger();
        if (isValid) {
          methods.handleSubmit();
        }
      };
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchIsPublic]);

  return (
    <div className='flex-col space-y-4'>
      <div>
        <h2 className='text-xl font-semibold'>Profile Visibility</h2>
        <p className='text-muted-foreground font-secondary text-sm'>
          Decide who can see your profile information.
        </p>
      </div>

      <motion.div
        layout
        className={cn(
          'md:bg-card/50 flex flex-col space-y-4 rounded-md bg-transparent p-0 md:p-4',
          isFormDisabled && 'animate-pulse',
        )}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <AnimatePresence mode='wait' initial={false}>
              <motion.div
                key={watchIsPublic ? 'public' : 'private'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {watchIsPublic ? <Globe /> : <Lock />}
              </motion.div>
            </AnimatePresence>

            <div>
              <Label
                htmlFor='profile-visibility'
                className='cursor-pointer py-0.5 text-sm font-medium'
              >
                {watchIsPublic ? 'Public Profile' : 'Private Profile'}
              </Label>
              <p className='text-muted-foreground font-secondary text-xs'>
                {watchIsPublic
                  ? 'Anyone can view your profile.'
                  : 'Your profile is hidden from others.'}
              </p>
            </div>
          </div>

          <RemixFormProvider {...methods}>
            <form onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoSwitchField name='isPublic' disabled={isFormDisabled} />
            </form>
          </RemixFormProvider>
        </div>

        <motion.div
          layout
          className='bg-muted/50 font-secondary text-muted-foreground rounded-lg px-4 py-2 text-xs font-light'
        >
          <div className='flex items-start space-x-2'>
            <div className='bg-secondary mt-1.5 h-2 w-2 flex-shrink-0 rounded-full' />
            <motion.div
              key={watchIsPublic ? 'public-info' : 'private-info'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {watchIsPublic ? (
                <>
                  Your profile and activity will be visible to all users and may appear in search
                  results.
                </>
              ) : (
                <>
                  Your profile will remain private. Only your username will appear in interactions.
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
