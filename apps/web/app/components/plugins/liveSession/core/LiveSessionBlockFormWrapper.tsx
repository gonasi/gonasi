import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { fetchLiveSessionBlockById } from '@gonasi/database/liveSessions';

import type { LiveSessionPluginDefinition } from './types';

import { Button } from '~/components/ui/button';
import { GoSliderField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { useIsPending } from '~/utils/misc';

type LiveSessionBlockRow = NonNullable<Awaited<ReturnType<typeof fetchLiveSessionBlockById>>>;

interface LiveSessionBlockFormWrapperProps {
  plugin: LiveSessionPluginDefinition;
  block?: LiveSessionBlockRow;
  liveSessionId: string;
  organizationId: string;
  actionUrl: string;
  /** Cancel button destination. */
  closeRoute: string;
  /** Modal X-button destination — defaults to closeRoute. */
  modalCloseRoute?: string;
  /** Optional back-arrow rendered in the modal header. */
  leadingIcon?: ReactNode;
}

/**
 * Generic form + modal for all live session block types.
 *
 * Owns the full Modal shell so it can place the settings popover
 * in the header (same pattern as the course plugin Builder).
 *
 * Common settings (time_limit) live in the popover;
 * each plugin appends its own fields via renderSettings().
 * Content fields are rendered in the body via renderFields().
 */
export function LiveSessionBlockFormWrapper({
  plugin,
  block,
  liveSessionId,
  organizationId,
  actionUrl,
  closeRoute,
  modalCloseRoute,
  leadingIcon,
}: LiveSessionBlockFormWrapperProps) {
  const isPending = useIsPending();
  const isCreate = !block;

  const methods = useRemixForm({
    mode: 'onBlur',
    resolver: zodResolver(plugin.schema),
    defaultValues: block
      ? {
          id: block.id,
          live_session_id: block.live_session_id,
          organization_id: block.organization_id,
          plugin_type: plugin.pluginType,
          content: block.content,
          settings: block.settings,
          difficulty: block.difficulty,
          time_limit: block.time_limit ?? 10,
        }
      : {
          live_session_id: liveSessionId,
          organization_id: organizationId,
          plugin_type: plugin.pluginType,
          content: plugin.defaults.content,
          settings: plugin.defaults.settings,
          difficulty: plugin.defaults.difficulty,
          time_limit: plugin.defaults.time_limit,
        },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const settingsPopover = (
    <Popover modal>
      <PopoverTrigger asChild>
        <Settings
          className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
          size={20}
        />
      </PopoverTrigger>
      <PopoverContent className='max-h-120 w-80 overflow-y-auto'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Block settings</h4>
            <p className='text-muted-foreground text-sm'>Tweak how this block behaves.</p>
          </div>
          <div className='grid gap-2'>
            <GoSliderField
              name='time_limit'
              labelProps={{ children: 'Time Limit (seconds)' }}
              min={5}
              max={25}
              description='Set how long players have to answer each question before time runs out'
            />

            {plugin.renderSettings?.({ methods })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  const title = isCreate
    ? `New ${plugin.metadata.name} Block`
    : `Edit ${plugin.metadata.name} Block`;

  // RemixFormProvider wraps the Modal so that form fields inside
  // the settings popover (rendered via a portal in the header)
  // still have access to the form context.
  return (
    <RemixFormProvider {...methods}>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header
            title={title}
            closeRoute={modalCloseRoute ?? closeRoute}
            leadingIcon={leadingIcon}
            settingsPopover={settingsPopover}
          />
          <Modal.Body>
            <form
              id={`live-session-${plugin.pluginType}-form`}
              onSubmit={methods.handleSubmit}
              method='POST'
              action={actionUrl}
            >
              <HoneypotInputs />

              {block && <input type='hidden' name='id' value={block.id} />}
              <input type='hidden' name='live_session_id' value={liveSessionId} />
              <input type='hidden' name='organization_id' value={organizationId} />
              <input type='hidden' name='plugin_type' value={plugin.pluginType} />

              <div className='space-y-4'>
                {plugin.renderFields({ methods })}

                <div className='flex justify-end gap-2 pt-2'>
                  <NavLink to={closeRoute}>
                    <Button type='button' variant='ghost' disabled={isDisabled}>
                      Cancel
                    </Button>
                  </NavLink>
                  <Button type='submit' disabled={isDisabled} isLoading={isDisabled}>
                    {isCreate ? 'Save Block' : 'Update Block'}
                  </Button>
                </div>
              </div>
            </form>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </RemixFormProvider>
  );
}
