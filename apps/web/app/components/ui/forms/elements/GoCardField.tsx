/**
 * GoCardField - Field for managing swipe categorize cards
 *
 * Features:
 * - Add/Edit/Delete cards with content and correct category
 * - Each card has an index for ordering
 * - Category selection dropdown (left/right)
 * - Rich text content editing
 */

import { useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Edit, Plus, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';
import type { CardSchemaTypes } from '@gonasi/schemas/plugins/schemas/swipeCategorize';

import { Button, IconTooltipButton } from '../../button';
import { Label, type LabelProps } from '../../label';
import { Modal } from '../../modal';
import { ErrorDisplay, FormDescription } from './Common';
import { GoRichTextInputField } from './GoRichTextInputField';
import { GoSelectInputField } from './GoSelectInputField';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';

interface GoCardFieldProps {
  name: string;
  description?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  maxCards?: number;
  minCards?: number;
}

export function GoCardField({
  name,
  description,
  labelProps,
  minCards = 3,
  maxCards = 20,
}: GoCardFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove } = useFieldArray({
    control,
    name,
  });

  const cards = (watch(name) as CardSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<{
    card: CardSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addCard = () => {
    const newIndex = cards.length;
    const newCard: CardSchemaTypes = {
      id: uuidv4(),
      content: EMPTY_LEXICAL_STATE,
      correctCategory: 'left',
      index: newIndex,
    };

    // Add the card first
    append(newCard);

    // Open modal with the new card data
    setCurrentCard({
      card: newCard as CardSchemaTypes,
      index: newIndex,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  const editCard = (cardId: string) => {
    const index = cards.findIndex((card) => card.id === cardId);
    if (index === -1) return;

    const card = cards[index];
    if (!card) return;

    setCurrentCard({
      card,
      index,
      isNew: false,
    });
    setIsModalOpen(true);
  };

  const removeCard = (cardId: string) => {
    const index = cards.findIndex((card) => card.id === cardId);
    if (index !== -1) {
      remove(index);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCard(null);
  };

  const renderCard = (card: CardSchemaTypes, index: number) => {
    return (
      <div key={card.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Card {index + 1}</span>
            <span
              className={`text-xs rounded-full px-2 py-1 ${
                card.correctCategory === 'left'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-success/10 text-success'
              }`}
            >
              {card.correctCategory === 'left' ? '👈 Left' : '👉 Right'}
            </span>
          </div>

          <div className='flex items-center space-x-2'>
            <IconTooltipButton
              type='button'
              title='Edit Card'
              icon={Edit}
              onClick={() => editCard(card.id)}
            />
            <IconTooltipButton title='Delete Card' icon={Trash} onClick={() => removeCard(card.id)} />
          </div>
        </div>

        {/* Card content preview */}
        <div>
          <Label className='mb-2 text-xs'>Content</Label>
          <div className='border-border/80 bg-border/50 flex min-h-[60px] w-full items-center border p-2'>
            <RichTextRenderer editorState={card.content} />
          </div>
          <p className='text-danger font-secondary text-xs'>
            <ErrorMessage errors={errors} name={`${name}.${index}.content`} />
          </p>
        </div>
      </div>
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div>
          <Label htmlFor={id} error={hasError} {...labelProps} />

          <div className='space-y-4'>
            {/* Add Card Button */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={() => addCard()}
                disabled={cards.length >= maxCards}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Card
              </Button>
            </div>

            {/* Cards List */}
            <div className='space-y-3'>{cards.map((card, index) => renderCard(card, index))}</div>

            {cards.length === 0 && (
              <div className='text-muted-foreground rounded-lg border-2 border-dashed border-gray-300 py-8 text-center'>
                <p className='text-sm'>No cards added yet.</p>
                <p className='text-xs'>Add at least {minCards} cards to get started.</p>
              </div>
            )}

            {/* Constraints Info */}
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>
                Cards: {cards.length}/{maxCards}
              </span>
              <span>Minimum: {minCards} required</span>
            </div>
          </div>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>

          {/* Card Editor Modal */}
          <Modal open={isModalOpen} onOpenChange={closeModal}>
            <Modal.Content size='lg' className=''>
              <Modal.Header title={`${currentCard?.isNew ? 'Create' : 'Edit'} Card`} />
              <Modal.Body>
                {currentCard && (
                  <div className='space-y-4'>
                    <GoRichTextInputField
                      name={`${name}.${currentCard.index}.content`}
                      labelProps={{ children: 'Card Content', required: true }}
                      placeholder='Enter card content...'
                    />

                    <GoSelectInputField
                      name={`${name}.${currentCard.index}.correctCategory`}
                      labelProps={{ children: 'Correct Category', required: true }}
                      description='Which category should this card be swiped to?'
                      selectProps={{
                        options: [
                          { value: 'left', label: '👈 Left' },
                          { value: 'right', label: '👉 Right' },
                        ],
                      }}
                    />

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-2 border-t pt-4'>
                      <Button type='button' onClick={closeModal} variant='ghost'>
                        Cancel
                      </Button>
                      <Button type='button' onClick={closeModal} variant='secondary'>
                        {currentCard.isNew ? 'Create Card' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}
              </Modal.Body>
            </Modal.Content>
          </Modal>
        </div>
      )}
    />
  );
}
