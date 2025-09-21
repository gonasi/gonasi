import { useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Edit, Plus, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE, type StepByStepRevealCardSchemaTypes } from '@gonasi/schemas/plugins';

import { Button, IconTooltipButton } from '../../button';
import { Label, type LabelProps } from '../../label';
import { Modal } from '../../modal';
import { ErrorDisplay, FormDescription } from './Common';
import { GoRichTextInputField } from './GoRichTextInputField';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';

interface GoStepByStepRevealFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  maxCards?: number;
  minCards?: number;
}

export function GoStepByStepRevealField({
  name,
  description,
  className,
  labelProps,
  minCards = 1,
  maxCards = 10, // Updated to match schema max
}: GoStepByStepRevealFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove, update } = useFieldArray({
    control,
    name,
  });

  const cards = (watch(name) as StepByStepRevealCardSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<{
    card: StepByStepRevealCardSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addCard = () => {
    const newCard: StepByStepRevealCardSchemaTypes = {
      id: uuidv4(),
      frontContent: EMPTY_LEXICAL_STATE,
      backContent: EMPTY_LEXICAL_STATE,
    };

    // Add the card first
    append(newCard);

    // Open modal with the new card data
    const newIndex = cards.length; // This will be the index after append
    setCurrentCard({
      card: newCard,
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

  const renderCard = (card: StepByStepRevealCardSchemaTypes, index: number) => {
    return (
      <div key={card.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Card {index + 1}</span>
          </div>

          <div className='flex items-center space-x-2'>
            <IconTooltipButton
              type='button'
              title='Edit Card'
              icon={Edit}
              onClick={() => editCard(card.id)}
            />
            <IconTooltipButton
              title='Delete Card'
              icon={Trash}
              onClick={() => removeCard(card.id)}
              disabled={cards.length <= minCards}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex flex-col items-center justify-center space-y-2 space-x-0 md:flex-row md:space-y-0 md:space-x-4'>
            <div className='w-full'>
              <Label className='text-muted-foreground mb-1 block text-xs font-medium'>
                Front Content
              </Label>
              <div className='border-border/80 bg-border/50 flex h-70 w-60 items-center justify-center rounded border p-2'>
                <RichTextRenderer editorState={card.frontContent} />
              </div>
              <div className='space-y-1'>
                <ErrorMessage
                  errors={errors}
                  name={`${name}.${index}.frontContent`}
                  render={({ message }) => (
                    <p className='text-danger font-secondary text-xs'>{message}</p>
                  )}
                />
              </div>
            </div>
            <div className='w-full'>
              <Label className='text-muted-foreground mb-1 block text-xs font-medium'>
                Revealed Content
              </Label>
              <div className='border-border/80 bg-border/50 flex h-70 w-60 items-center justify-center rounded border p-2'>
                <RichTextRenderer editorState={card.backContent} />
              </div>
              <div className='space-y-1'>
                <ErrorMessage
                  errors={errors}
                  name={`${name}.${index}.backContent`}
                  render={({ message }) => (
                    <p className='text-danger font-secondary text-xs'>{message}</p>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div className={className}>
          <Label htmlFor={id} error={hasError} {...labelProps} />

          <div className='space-y-4'>
            {/* Add Card Button */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={addCard}
                disabled={cards.length >= maxCards}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Card ({cards.length}/{maxCards})
              </Button>
            </div>

            {/* Cards List */}
            <div className='space-y-3'>{cards.map((card, index) => renderCard(card, index))}</div>

            {/* Empty State */}
            {cards.length === 0 && (
              <div className='text-muted-foreground rounded-lg border-2 border-dashed border-gray-300 py-8 text-center'>
                <p className='text-sm'>No cards added yet.</p>
                <p className='text-xs'>
                  Add at least {minCards} card{minCards !== 1 ? 's' : ''} to get started.
                </p>
              </div>
            )}

            {/* Constraints Info */}
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>
                Cards: {cards.length}/{maxCards}
              </span>
              <span>
                Minimum: {minCards} required
                {cards.length < minCards && (
                  <span className='text-danger ml-1'>({minCards - cards.length} more needed)</span>
                )}
              </span>
            </div>
          </div>

          {/* Form-level errors and description */}
          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>

          {/* Card Editor Modal */}
          <Modal open={isModalOpen} onOpenChange={closeModal}>
            <Modal.Content size='lg' className='max-w-4xl'>
              <Modal.Header
                title={`${currentCard?.isNew ? 'Create' : 'Edit'} Card ${currentCard ? currentCard.index + 1 : ''}`}
              />
              <Modal.Body>
                {currentCard && (
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <GoRichTextInputField
                        name={`${name}.${currentCard.index}.frontContent`}
                        labelProps={{ children: 'Front Content', required: true }}
                        placeholder='Enter the content that will be shown initially...'
                        description='This content will be visible before the card is revealed.'
                      />

                      <GoRichTextInputField
                        name={`${name}.${currentCard.index}.backContent`}
                        labelProps={{ children: 'Revealed Content', required: true }}
                        placeholder='Enter the content that will be revealed...'
                        description='This content will be shown when the card is clicked or revealed.'
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-2 border-t pt-4'>
                      <Button type='button' onClick={closeModal} variant='ghost'>
                        Cancel
                      </Button>
                      <Button type='button' onClick={closeModal}>
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
