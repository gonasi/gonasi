import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Save, Trash } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { v4 as uuidv4 } from 'uuid';

import {
  type PluginTypeId,
  type TapToRevealCardSchemaType,
  TapToRevealContentSchema,
} from '@gonasi/schemas/plugins';

import { Button, IconTooltipButton, OutlineButton } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

interface CreateTapToRevealPluginProps {
  pluginTypeId: PluginTypeId;
}

export function CreateTapToRevealPlugin({ pluginTypeId }: CreateTapToRevealPluginProps) {
  const pending = useIsPending();

  const [form, fields] = useForm({
    id: `create-${pluginTypeId}-form`,
    constraint: getZodConstraint(TapToRevealContentSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TapToRevealContentSchema });
    },
  });

  const cards = fields.cards.getFieldList();

  const getCards = (): TapToRevealCardSchemaType[] =>
    cards.map((fieldset) => {
      const { frontContent, backContent, uuid } = fieldset.getFieldset();
      return {
        uuid: uuid.value ?? '',
        frontContent: frontContent.value ?? '',
        backContent: backContent.value ?? '',
      };
    });

  const updateCards = (updated: TapToRevealCardSchemaType[]) => {
    form.update({ name: fields.cards.name, value: updated });
  };

  const addCard = () => {
    const current = getCards();

    updateCards([
      ...current,
      {
        uuid: uuidv4(),
        frontContent: '',
        backContent: '',
      },
    ]);
  };

  const removeCard = (uuid: string) => {
    const current = getCards();
    const updated = current.filter((card) => card.uuid !== uuid);
    updateCards(updated);
  };

  return (
    <Form method='POST' {...getFormProps(form)}>
      <div className='flex flex-col space-y-4'>
        <HoneypotInputs />

        <RichTextInputField
          labelProps={{ children: 'Title', required: true }}
          meta={fields.title as FieldMetadata<string>}
          placeholder='Enter your title'
          description='The title shown to users'
          errors={fields.title.errors}
        />

        <div className='mt-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <h3
              className={cn('font-secondary text-sm font-medium', {
                'text-danger': form.allErrors.choices,
              })}
            >
              Cards *
            </h3>
            <OutlineButton
              type='button'
              size='sm'
              onClick={addCard}
              className={cn({
                'border-danger text-danger': form.allErrors.choices,
              })}
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Card
            </OutlineButton>
          </div>
          <div className='flex flex-col space-y-4'>
            {cards.length > 0 ? (
              <AnimatePresence>
                {cards.map((card, index) => {
                  const { frontContent, backContent, uuid } = card.getFieldset();
                  return (
                    <motion.div
                      key={uuid.value}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className='bg-card/50 flex flex-col space-y-4 rounded-lg p-4'
                    >
                      <RichTextInputField
                        labelProps={{
                          children: `Front of Card ${index + 1}`,
                          required: true,
                          endAdornment: (
                            <IconTooltipButton
                              title={`Delete Card ${index + 1}`}
                              icon={Trash}
                              type='button'
                              onClick={() => removeCard(uuid.value ?? '')}
                            />
                          ),
                        }}
                        meta={frontContent as FieldMetadata<string>}
                        errors={frontContent?.errors}
                      />
                      <RichTextInputField
                        labelProps={{ children: `Back of Card ${index + 1}`, required: true }}
                        meta={backContent as FieldMetadata<string>}
                        errors={backContent?.errors}
                      />
                      <input {...getInputProps(uuid, { type: 'hidden' })} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <p className='text-warning text-sm'>No cards added yet.</p>
            )}
          </div>
          <ErrorList errors={form.allErrors.choices} />
        </div>

        <ErrorList errors={Object.values(form.allErrors).flat()} id={form.errorId} />

        <div className='mt-4 flex justify-end space-x-2'>
          <Button
            type='submit'
            rightIcon={<Save />}
            disabled={pending}
            isLoading={pending}
            name='intent'
            value={pluginTypeId}
          >
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
