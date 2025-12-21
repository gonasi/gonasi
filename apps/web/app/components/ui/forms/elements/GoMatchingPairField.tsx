/**
 * GoMatchingPairField - Field for managing matching game pairs
 *
 * Features:
 * - Add/Edit/Delete pairs with left and right content
 * - Each pair has leftIndex and rightIndex for custom ordering
 *
 * Future Enhancement:
 * - Drag-and-drop reordering for left and right items independently
 * - When implementing drag-and-drop:
 *   1. Use @dnd-kit/core for drag-and-drop functionality
 *   2. Add separate drag handles for left and right items
 *   3. Update leftIndex/rightIndex on drop
 *   4. Reindex all items after reordering to maintain sequential indexes
 */

import { useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Edit, Plus, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';
import type { MatchingPairSchemaTypes } from '@gonasi/schemas/plugins/schemas/matchingGame';

import { Button, IconTooltipButton } from '../../button';
import { Label, type LabelProps } from '../../label';
import { Modal } from '../../modal';
import { ErrorDisplay, FormDescription } from './Common';
import { GoRichTextInputField } from './GoRichTextInputField';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';

interface GoMatchingPairFieldProps {
  name: string;
  description?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  maxPairs?: number;
  minPairs?: number;
}

export function GoMatchingPairField({
  name,
  description,
  labelProps,
  minPairs = 2,
  maxPairs = 10,
}: GoMatchingPairFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove } = useFieldArray({
    control,
    name,
  });

  const pairs = (watch(name) as MatchingPairSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPair, setCurrentPair] = useState<{
    pair: MatchingPairSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addPair = () => {
    const newIndex = pairs.length;
    const newPair: MatchingPairSchemaTypes = {
      id: uuidv4(),
      leftContent: EMPTY_LEXICAL_STATE,
      rightContent: EMPTY_LEXICAL_STATE,
      leftIndex: newIndex,
      rightIndex: newIndex,
    };

    // Add the pair first
    append(newPair);

    // Open modal with the new pair data
    setCurrentPair({
      pair: newPair as MatchingPairSchemaTypes,
      index: newIndex,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  const editPair = (pairId: string) => {
    const index = pairs.findIndex((pair) => pair.id === pairId);
    if (index === -1) return;

    const pair = pairs[index];
    if (!pair) return;

    setCurrentPair({
      pair,
      index,
      isNew: false,
    });
    setIsModalOpen(true);
  };

  const removePair = (pairId: string) => {
    const index = pairs.findIndex((pair) => pair.id === pairId);
    if (index !== -1) {
      remove(index);
      // Note: Reindexing will be handled when drag-and-drop is implemented
      // For now, gaps in indexes are acceptable
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentPair(null);
  };

  const renderPair = (pair: MatchingPairSchemaTypes, index: number) => {
    return (
      <div key={pair.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Pair {index + 1}</span>
          </div>

          <div className='flex items-center space-x-2'>
            <IconTooltipButton
              type='button'
              title='Edit Pair'
              icon={Edit}
              onClick={() => editPair(pair.id)}
            />
            <IconTooltipButton
              title='Delete Pair'
              icon={Trash}
              onClick={() => removePair(pair.id)}
            />
          </div>
        </div>

        {/* Left and Right content preview */}
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <Label className='mb-2 text-xs'>Left Item</Label>
            <div className='border-border/80 bg-border/50 flex min-h-[60px] w-full items-center border p-2'>
              <RichTextRenderer editorState={pair.leftContent} />
            </div>
            <p className='text-danger font-secondary text-xs'>
              <ErrorMessage errors={errors} name={`${name}.${index}.leftContent`} />
            </p>
          </div>

          <div>
            <Label className='mb-2 text-xs'>Right Item</Label>
            <div className='border-border/80 bg-border/50 flex min-h-[60px] w-full items-center border p-2'>
              <RichTextRenderer editorState={pair.rightContent} />
            </div>
            <p className='text-danger font-secondary text-xs'>
              <ErrorMessage errors={errors} name={`${name}.${index}.rightContent`} />
            </p>
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
        <div>
          <Label htmlFor={id} error={hasError} {...labelProps} />

          <div className='space-y-4'>
            {/* Add Pair Button */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={() => addPair()}
                disabled={pairs.length >= maxPairs}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Pair
              </Button>
            </div>

            {/* Pairs List */}
            <div className='space-y-3'>{pairs.map((pair, index) => renderPair(pair, index))}</div>

            {pairs.length === 0 && (
              <div className='text-muted-foreground rounded-lg border-2 border-dashed border-gray-300 py-8 text-center'>
                <p className='text-sm'>No pairs added yet.</p>
                <p className='text-xs'>Add at least {minPairs} pairs to get started.</p>
              </div>
            )}

            {/* Constraints Info */}
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>
                Pairs: {pairs.length}/{maxPairs}
              </span>
              <span>Minimum: {minPairs} required</span>
            </div>
          </div>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>

          {/* Pair Editor Modal */}
          <Modal open={isModalOpen} onOpenChange={closeModal}>
            <Modal.Content size='lg' className=''>
              <Modal.Header title={`${currentPair?.isNew ? 'Create' : 'Edit'} Pair`} />
              <Modal.Body>
                {currentPair && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <GoRichTextInputField
                        name={`${name}.${currentPair.index}.leftContent`}
                        labelProps={{ children: 'Left Item', required: true }}
                        placeholder='Enter left item content...'
                      />

                      <GoRichTextInputField
                        name={`${name}.${currentPair.index}.rightContent`}
                        labelProps={{ children: 'Right Item', required: true }}
                        placeholder='Enter right item content...'
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-2 border-t pt-4'>
                      <Button type='button' onClick={closeModal} variant='ghost'>
                        Cancel
                      </Button>
                      <Button type='button' onClick={closeModal} variant='secondary'>
                        {currentPair.isNew ? 'Create Pair' : 'Save Changes'}
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
