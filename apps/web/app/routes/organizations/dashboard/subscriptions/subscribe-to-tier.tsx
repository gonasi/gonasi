import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  CircleX,
  Info,
} from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import {
  type OrganizationTierChangeRequestSuccessResponse,
  type TierLimitsRow,
  VALID_TIER_ORDER,
  validateTierChangeRequest,
} from '@gonasi/database/organizationSubscriptions';

import type { Route } from './+types/subscribe-to-tier';

import { Badge } from '~/components/ui/badge';
import { Button, NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId, tier: tierParam } = params;

  if (!tierParam || !VALID_TIER_ORDER.includes(tierParam as TierLimitsRow)) {
    return redirectWithError(
      `/${organizationId}/dashboard/subscriptions`,
      'Invalid tier selected.',
    );
  }

  const targetTier = tierParam as TierLimitsRow;
  const validation = await validateTierChangeRequest({
    supabase,
    organizationId,
    targetTier,
  });

  if (!validation.success) {
    return redirectWithError(
      `/${organizationId}/dashboard/subscriptions`,
      validation.message ?? 'You do not have permission to manage subscriptions.',
    );
  }

  return validation;
}

export default function SubscribeToTier({ params, loaderData }: Route.ComponentProps) {
  const data = loaderData as OrganizationTierChangeRequestSuccessResponse;
  const { currentTier, targetTier, isUpgrade, isDowngrade, canProceed, warnings } = data;

  const title = isUpgrade
    ? `Upgrade from ${currentTier} → ${targetTier}`
    : isDowngrade
      ? `Downgrade from ${currentTier} → ${targetTier}`
      : `Manage ${targetTier} tier`;

  const icon = isUpgrade ? (
    <ArrowUpRight className='text-success' />
  ) : isDowngrade ? (
    <ArrowDownRight className='text-warning' />
  ) : (
    <Info className='text-blue-500' />
  );

  const blockingErrors = warnings.filter((w) => w.type === 'error');
  const nonBlockingWarnings = warnings.filter((w) => w.type !== 'error');

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <Modal.Header
          title={title}
          leadingIcon={icon}
          closeRoute={`/${params.organizationId}/dashboard/subscriptions`}
        />
        <Modal.Body className='space-y-6 px-4 pb-6'>
          {/* Summary */}
          <div className='bg-muted/40 rounded-none border-none p-4'>
            <p className='text-muted-foreground mb-2 text-sm'>
              Current Tier:
              <Badge variant='outline' className='ml-2 capitalize'>
                {currentTier}
              </Badge>
            </p>
            <p className='text-muted-foreground text-sm'>
              Target Tier:
              <Badge
                variant='secondary'
                className={cn(
                  'ml-2 capitalize',
                  isUpgrade && 'bg-success/20 text-success',
                  isDowngrade && 'bg-warning/20 text-warning',
                )}
              >
                {targetTier}
              </Badge>
            </p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className='space-y-4'>
              {warnings.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border p-3 text-sm',
                    w.type === 'error' && 'border-red-400 bg-red-50 text-red-700',
                    w.type === 'warning' && 'border-yellow-400 bg-yellow-50 text-yellow-700',
                    w.type === 'info' && 'border-blue-400 bg-blue-50 text-blue-700',
                  )}
                >
                  {w.type === 'error' && <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />}
                  <span>{w.message}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Comparison Table */}
          <div className='overflow-hidden rounded-none'>
            <div className='bg-muted/30 grid grid-cols-3 p-2 text-sm font-semibold'>
              <span>Feature</span>
              <span className='text-center capitalize'>{currentTier}</span>
              <span className='text-center capitalize'>{targetTier}</span>
            </div>

            {Object.keys(data.data.currentTierLimits).map((key) => {
              const currentVal = data.data.currentTierLimits[key];
              const targetVal = data.data.targetTierLimits[key];
              if (typeof currentVal !== 'boolean' && typeof currentVal !== 'number') return null;

              const changed = currentVal !== targetVal;
              return (
                <div
                  key={key}
                  className={cn(
                    'grid grid-cols-3 border-t p-2 text-sm',
                    changed && 'bg-green-50/50',
                  )}
                >
                  <span className='capitalize'>{key.replaceAll('_', ' ')}</span>
                  <span className='text-center'>{String(currentVal)}</span>
                  <span className='text-center font-medium'>{String(targetVal)}</span>
                </div>
              );
            })}
          </div>

          <div className='flex justify-end gap-3 border-t pt-4'>
            <div>
              <NavLinkButton
                to={`/${params.organizationId}/dashboard/subscriptions`}
                variant='ghost'
                leftIcon={<CircleX />}
              >
                Cancel
              </NavLinkButton>
            </div>
            <Button
              variant={isUpgrade ? 'success' : 'danger'}
              disabled={!canProceed}
              rightIcon={isUpgrade ? <ArrowUpRight /> : <ArrowDownLeft />}
            >
              {isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
            </Button>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
