import { useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Edit, Plus, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';
import type { ChoiceSchemaTypes } from '@gonasi/schemas/plugins/schemas/choiceSchema';

import { Button, IconTooltipButton } from '../../button';
import { Checkbox } from '../../checkbox';
import { Label, type LabelProps } from '../../label';
import { Modal } from '../../modal';
import { ErrorDisplay, FormDescription } from './Common';
import { GoRichTextInputField } from './GoRichTextInputField';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';

interface GoChoiceFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
}

export function GoChoiceField({ name, description, className, labelProps }: GoChoiceFieldProps) {
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useRemixFormContext();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const choices = (watch(name) as ChoiceSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<{
    choice: ChoiceSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addChoice = () => {
    const newChoice: ChoiceSchemaTypes = {
      id: uuidv4(),
      isCorrect: false,
      content: EMPTY_LEXICAL_STATE,
    };

    // Add the choice first
    append(newChoice);

    // Open modal with the new choice data
    const newIndex = choices.length; // This will be the index after append
    setCurrentChoice({
      choice: newChoice as ChoiceSchemaTypes,
      index: newIndex,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  const editChoice = (choiceId: string) => {
    const index = choices.findIndex((choice) => choice.id === choiceId);
    if (index === -1) return;

    const choice = choices[index];
    if (!choice) return;

    setCurrentChoice({
      choice,
      index,
      isNew: false,
    });
    setIsModalOpen(true);
  };

  const removeChoice = (choiceId: string) => {
    const index = choices.findIndex((choice) => choice.id === choiceId);
    if (index !== -1) {
      remove(index);
    }
  };

  const updateChoice = (choiceId: string, field: string, value: any) => {
    const index = choices.findIndex((choice) => choice.id === choiceId);
    if (index !== -1) {
      const currentChoice = choices[index];
      const updatedChoice = { ...currentChoice, [field]: value };
      update(index, updatedChoice);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentChoice(null);
  };

  const renderChoice = (choice: ChoiceSchemaTypes, index: number) => {
    return (
      <div key={choice.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Choice {index + 1}</span>
          </div>

          <div className='flex items-center space-x-2'>
            <div className='flex items-center gap-2'>
              <Checkbox
                name={`${name}.${index}.isCorrect`}
                checked={choice.isCorrect}
                onCheckedChange={(checked) => updateChoice(choice.id, 'isCorrect', checked)}
              />
              <Label htmlFor={`${name}.${index}.isCorrect`}>Correct Choice</Label>
            </div>
            <IconTooltipButton
              type='button'
              title='Edit Choice'
              icon={Edit}
              onClick={() => editChoice(choice.id)}
            />
            <IconTooltipButton
              title='Delete Choice'
              icon={Trash}
              onClick={() => removeChoice(choice.id)}
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='border-border/80 bg-border/50 flex w-full items-center border'>
            <RichTextRenderer editorState={choice.content} />
          </div>
        </div>

        {/* Display other field errors */}
        <ErrorMessage
          errors={errors}
          name={`${name}.${index}`}
          render={({ message }) => <p>{message}</p>}
        />
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
            {/* Add Choice Buttons */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={() => addChoice()}
                disabled={choices.length >= 6}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Choice
              </Button>
            </div>

            {/* Choices List */}
            <div className='space-y-3'>
              {choices.map((choice, index) => renderChoice(choice, index))}
            </div>

            {choices.length === 0 && (
              <div className='text-muted-foreground rounded-lg border-2 border-dashed border-gray-300 py-8 text-center'>
                <p className='text-sm'>No choices added yet.</p>
                <p className='text-xs'>Add at least 2 choices to get started.</p>
              </div>
            )}

            {/* Constraints Info */}
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>Choices: {choices.length}/6</span>
              <span>Minimum: 2 required</span>
            </div>
          </div>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>

          {/* Choice Editor Modal */}
          <Modal open={isModalOpen} onOpenChange={closeModal}>
            <Modal.Content size='sm' className=''>
              <Modal.Header title={`${currentChoice?.isNew ? 'Create' : 'Edit'} Choice`} />
              <Modal.Body>
                {currentChoice && (
                  <div className='space-y-4'>
                    <GoRichTextInputField
                      name={`${name}.${currentChoice.index}.content`}
                      labelProps={{ children: 'Choice', required: true }}
                      placeholder='Choice...'
                    />

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-2 border-t pt-4'>
                      <Button type='button' onClick={closeModal} variant='ghost'>
                        Cancel
                      </Button>
                      <Button type='button' onClick={closeModal} variant='secondary'>
                        {currentChoice.isNew ? 'Create Choice' : 'Save Changes'}
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
