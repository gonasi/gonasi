import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Save, Trash } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { v4 as uuidv4 } from 'uuid';

import { type TapToRevealCardType, TapToRevealSchema } from '@gonasi/schemas/plugins';

import type { EditPluginComponentProps } from '../../editPluginTypesRenderer';

import { Button, OutlineButton } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

export function EditTapToRevealPlugin({ block }: EditPluginComponentProps) {
  const pending = useIsPending();

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-form`,
    constraint: getZodConstraint(TapToRevealSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    defaultValue: {
      ...block.content,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TapToRevealSchema });
    },
  });

  const cards = fields.cards.getFieldList();

  const getCards = (): TapToRevealCardType[] =>
    cards.map((fieldset) => {
      const { frontContent, backContent, uuid } = fieldset.getFieldset();
      // Validate or coerce here if needed
      return {
        uuid: uuid.value ?? '',
        frontContent: frontContent.value ?? '',
        backContent: backContent.value ?? '',
      };
    });

  const updateCards = (updated: TapToRevealCardType[]) => {
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
    const indexToRemove = current.findIndex((card) => card.uuid === uuid);

    if (indexToRemove !== -1) {
      form.remove({ name: 'cards', index: indexToRemove });
    }
  };

  return (
    <Form method='POST' {...getFormProps(form)}>
      <div className='flex flex-col space-y-4'>
        <HoneypotInputs />

        <RichTextInputField
          labelProps={{ children: 'Question', required: true }}
          meta={fields.title as FieldMetadata<string>}
          placeholder='Enter your question'
          description='The title shown to users before revealing the cards.'
          errors={fields.title.errors}
        />

        <div className='mt-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <h3
              className={cn('font-secondary text-sm font-medium', {
                'text-danger': form.allErrors.cards,
              })}
            >
              Cards *
            </h3>
            <OutlineButton
              type='button'
              size='sm'
              onClick={addCard}
              disabled={cards.length >= 6}
              className={cn({
                'border-danger text-danger': form.allErrors.cards,
              })}
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Card
            </OutlineButton>
          </div>

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
                    className='bg-card/50 rounded-lg p-4'
                  >
                    <div className='flex w-full justify-end py-2'>
                      <OutlineButton
                        size='sm'
                        onClick={() => removeCard(uuid.value ?? '')}
                        type='button'
                      >
                        <Trash size={16} />
                      </OutlineButton>
                    </div>
                    <RichTextInputField
                      labelProps={{ children: `Front of Card ${index + 1}`, required: true }}
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
          <ErrorList errors={form.allErrors.cards} />
        </div>

        <ErrorList errors={Object.values(form.allErrors).flat()} id={form.errorId} />

        <div className='mt-4 flex justify-end space-x-2'>
          <Button
            type='submit'
            rightIcon={<Save />}
            disabled={pending}
            isLoading={pending}
            name='intent'
            value={block.plugin_type}
          >
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
